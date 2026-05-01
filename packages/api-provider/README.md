# @alikhalilll/nuxt-api-provider

A strongly-typed `fetch` client for Nuxt 3 / 4 with interceptors, retry/backoff, and a framework-agnostic core you can use anywhere.

- **Typed client type** — `ApiProviderClient` is exported so you can annotate your own wrappers and composables.
- **Interceptor chain** — register multiple request/response/error interceptors via `.useRequest`, `.useResponse`, `.useError`.
- **Retry + backoff** — per-client defaults with per-call overrides. Configurable status codes and exponential delay.
- **Smart body encoding** — plain objects → JSON; `FormData` / `URLSearchParams` / `Blob` / `ArrayBuffer` / `string` pass through with correct Content-Type.
- **Timeouts + abort** — per-call timeout plus `AbortSignal` support via `AbortSignal.any` with a polyfill fallback.
- **Upload + download progress** — a single `onRequestProgress` hook. The client transparently switches to `XMLHttpRequest` only when you pass it, since `fetch` has no upload-progress support.
- **`ApiError` class** — structured errors with `.status`, `.details`, `.payload`, `.response`, plus an `isApiError(e)` / `ApiError.is(e)` guard that works across bundles and realms.
- **Framework-agnostic core** — `import { createApiClient } from '@alikhalilll/nuxt-api-provider/core'` to use outside Nuxt.

---

## Table of contents

1. [Install](#install)
2. [Register the module](#register-the-module)
3. [Usage](#usage)
   - [Typed client + composable](#typed-client--composable)
   - [SSR (server-side rendering)](#ssr-server-side-rendering)
   - [`useAsyncData`](#useasyncdata)
   - [GET](#get)
   - [Query parameters](#query-parameters)
   - [POST with JSON](#post-with-json)
   - [PATCH / PUT / DELETE](#patch--put--delete)
   - [Multipart / FormData upload](#multipart--formdata-upload)
   - [`application/x-www-form-urlencoded`](#applicationx-www-form-urlencoded)
   - [Custom headers](#custom-headers)
   - [Per-call timeout](#per-call-timeout)
   - [External `AbortSignal`](#external-abortsignal)
   - [Retry + backoff](#retry--backoff)
   - [Upload / download progress](#upload--download-progress)
   - [Error handling with `ApiError`](#error-handling-with-apierror)
   - [Paginated list](#paginated-list)
   - [Cancel previous request (debounced search)](#cancel-previous-request-debounced-search)
   - [Passing metadata to interceptors](#passing-metadata-to-interceptors)
4. [Interceptors](#interceptors)
   - [Lifecycle](#lifecycle)
   - [Type signatures](#type-signatures)
   - [Authentication header](#authentication-header)
   - [Response transform / unwrap](#response-transform--unwrap)
   - [Error → toast + redirect](#error--toast--redirect)
   - [Runtime registration](#runtime-registration)
5. [Framework-agnostic core](#framework-agnostic-core)
   - [Node / Bun / CLI](#node--bun--cli)
   - [Inside Nitro server routes](#inside-nitro-server-routes)
   - [`ApiClientConfig` reference](#apiclientconfig-reference)
   - [Initial interceptors at construction](#initial-interceptors-at-construction)
   - [Custom fetch (testing / instrumentation)](#custom-fetch-testing--instrumentation)
   - [`/core` helpers](#core-helpers)
6. [Module options reference](#module-options-reference)
7. [`RequestOptions` reference](#requestoptions-reference)
8. [`RetryOptions` reference](#retryoptions-reference)
9. [Exported types](#exported-types)

---

## Install

```bash
pnpm add @alikhalilll/nuxt-api-provider
```

## Register the module

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-api-provider'],
  apiProvider: {
    baseURL: 'https://api.example.com',
    provideName: '$apiProvider', // leading "$" optional — gets stripped
    defaultTimeoutMs: 20_000,
    server: true, // set false to skip SSR (client-only)
    retry: { attempts: 2, delayMs: 500, backoff: 2 },
    // Optional paths to modules with default-exported interceptors.
    onRequestPath: '~/api/on-request',
    onSuccessPath: '~/api/on-success',
    onErrorPath: '~/api/on-error',
  },
});
```

## Usage

### Typed client + composable

`$apiProvider` is augmented onto `NuxtApp` and `ComponentCustomProperties` as an `ApiProviderClient`. Wrap it in a composable to stop destructuring it everywhere:

```ts
// composables/useApi.ts
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/types';

export const useApi = (): ApiProviderClient => useNuxtApp().$apiProvider;
```

```vue
<script setup lang="ts">
interface User {
  id: string;
  email: string;
}

const api = useApi();
const user = await api<User>('/me');
</script>
```

### SSR (server-side rendering)

With `server: true` (the default), `$apiProvider` is available during SSR, so top-level `await` inside a page's `<script setup>` runs on the server and the HTML arrives fully populated.

```vue
<!-- pages/posts/[id].vue -->
<script setup lang="ts">
interface Post {
  id: number;
  title: string;
  body: string;
}

const route = useRoute();
const api = useApi();

// Resolves on the server during SSR, then hydrates on the client.
const post = await api<Post>(`/posts/${route.params.id}`);
</script>

<template>
  <article>
    <h1>{{ post?.title }}</h1>
    <p>{{ post?.body }}</p>
  </article>
</template>
```

If you set `server: false` in `nuxt.config.ts`, `$apiProvider` won't exist during SSR and this pattern will throw — you'd need to move the call into `onMounted` or `useAsyncData(..., { server: false })`.

### `useAsyncData`

`useAsyncData` is the idiomatic way to fetch in Nuxt: it deduplicates per-key, populates the SSR payload, and exposes `pending` / `error` / `refresh`. Capture the client **synchronously** at the top of `<script setup>` — `useNuxtApp()` only works in the synchronous prefix of a setup or a Nuxt-managed callback, so reaching for it after an `await` throws _"A composable that requires access to the Nuxt instance was called outside of …"_.

```vue
<script setup lang="ts">
interface Post {
  id: number;
  title: string;
}

const { $apiProvider } = useNuxtApp(); // capture ONCE, before any await

const { data, pending, error, refresh } = await useAsyncData('posts', () =>
  $apiProvider<Post[]>('/posts')
);
</script>

<template>
  <div v-if="pending">Loading…</div>
  <div v-else-if="error">Failed: {{ error.message }}</div>
  <ul v-else>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>
  <button @click="refresh()">Reload</button>
</template>
```

Keep the handler thin — if you factor the call into a service, pass the client in rather than calling `useNuxtApp()` inside the service:

```ts
// services/posts.ts
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/types';

export const getPost = (api: ApiProviderClient, id: string) =>
  api<{ id: number; title: string }>(`/posts/${id}`);
```

```vue
<script setup lang="ts">
import { getPost } from '~/services/posts';

const { $apiProvider } = useNuxtApp();
const { data } = await useAsyncData('post-1', () => getPost($apiProvider, '1'));
</script>
```

The same function now works from a Nitro route (pass a `createApiClient` instance instead) — see [Framework-agnostic core](#framework-agnostic-core).

### GET

```ts
interface Post {
  id: number;
  title: string;
}
const post = await api<Post>('/posts/1');
```

`Promise<T | undefined>` — you get `undefined` on 204/205 (no body).

### Query parameters

Queries are the third argument. `null`/`undefined`/empty-string are skipped; arrays are repeated as `?tag=a&tag=b`.

```ts
const posts = await api<Post[]>('/posts', null, {
  userId: 1,
  tag: ['news', 'featured'],
  q: '', // skipped
  draft: undefined, // skipped
});
```

### POST with JSON

Plain objects (and arrays) are JSON-encoded; `Content-Type: application/json` is set automatically.

```ts
const created = await api<Post>('/posts', {
  method: 'POST',
  body: { userId: 42, title: 'Hello', body: 'World' },
});
```

### PATCH / PUT / DELETE

```ts
await api<Post>('/posts/1', { method: 'PATCH', body: { title: 'Updated' } });
await api<Post>('/posts/1', { method: 'PUT', body: fullReplacement });
await api('/posts/1', { method: 'DELETE' });
```

### Multipart / FormData upload

`FormData` is passed through and the `Content-Type` header is dropped so the browser sets the correct boundary.

```ts
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('caption', 'my file');

await api<{ url: string }>('/uploads', { method: 'POST', body: form });
```

### `application/x-www-form-urlencoded`

Pass a `URLSearchParams` instance — Content-Type is set for you if missing.

```ts
const body = new URLSearchParams({ grant_type: 'refresh_token', token: rt });
await api<{ access_token: string }>('/oauth/token', { method: 'POST', body });
```

### Custom headers

```ts
await api('/posts/1', {
  headers: { 'X-Trace-Id': crypto.randomUUID() },
});
```

### Per-call timeout

```ts
// This call aborts after 3s regardless of the client-level default.
await api('/slow', { timeoutMs: 3_000 });
```

### External `AbortSignal`

Your signal is combined with the internal timeout signal via `AbortSignal.any` (with a polyfill fallback).

```ts
const ctrl = new AbortController();
const promise = api('/stream', { signal: ctrl.signal });

// ... later
ctrl.abort();
```

### Retry + backoff

Per-client defaults from `nuxt.config.ts` can be overridden per call:

```ts
// Retry up to 3 more times on 503, doubling the delay each time.
await api('/flaky', {
  retry: { attempts: 3, delayMs: 500, backoff: 2, statusCodes: [503] },
});

// Disable retries for this call specifically.
await api('/critical', { retry: { attempts: 0 } });
```

Delay for attempt `n` (0-indexed) is `delayMs * backoff^n`. Default retryable status codes: `[408, 429, 500, 502, 503, 504]`.

### Upload / download progress

Pass `onRequestProgress` to observe both phases of a request. The callback receives `{ phase, loaded, total, ratio }` — `phase` is `'upload'` while the body is being sent and `'download'` while the response is being received. `total` and `ratio` are `null` when the length isn't known (chunked / streaming responses).

```vue
<script setup lang="ts">
const uploaded = ref(0);
const uploadRatio = ref(0);
const downloaded = ref(0);

const form = new FormData();
form.append('file', fileInput.value!.files![0]);

await useApi()('/uploads', {
  method: 'POST',
  body: form,
  retry: { attempts: 0 }, // don't silently re-upload on failure
  timeoutMs: 60_000,
  onRequestProgress: ({ phase, loaded, total, ratio }) => {
    if (phase === 'upload') {
      uploaded.value = loaded;
      if (ratio !== null) uploadRatio.value = ratio;
    } else {
      downloaded.value = loaded;
    }
  },
});
</script>

<template>
  <progress :value="uploadRatio" max="1" />
  <span>{{ uploaded }} bytes</span>
</template>
```

#### How it works

- `fetch` cannot report upload progress in any browser today, so when `onRequestProgress` is set the client transparently swaps its transport to `XMLHttpRequest`. Everything else — interceptors, retry, timeout, headers, body encoding, `AbortSignal`, `ApiError` — continues to work identically.
- The fast path (no progress callback) stays on native `fetch`; there's no perf cost for requests that don't need progress.
- Browser-only: progress callbacks have no meaning on the server and the XHR transport isn't available in Nitro. The module will throw if you try to use it there.

### Error handling with `ApiError`

Every failure throws an `ApiError`. It's the same class for HTTP errors and network errors (`status === 0` means the request never reached a response).

The class implements the generic `IError<TErrors, TOtherKeys>` interface — a reusable contract for typed error shapes:

```ts
import type { IError } from '@alikhalilll/nuxt-api-provider/types';

type LoginError = IError<'email' | 'password', 'hint'>;
```

Discriminate caught errors with `isApiError(e)` (or the equivalent `ApiError.is(e)`) instead of `instanceof`. `instanceof` breaks when the package is duplicated in a bundle, when errors cross realm boundaries (iframes, workers), or when the class is downleveled to ES5 — `isApiError` uses a `Symbol.for(...)` brand and is robust to all three.

```ts
import { isApiError } from '@alikhalilll/nuxt-api-provider/types';

try {
  await api('/users', { method: 'POST', body: { email: 'bad' } });
} catch (e) {
  if (isApiError(e)) {
    console.log(e.status); // 422
    console.log(e.message); // 'Validation failed'
    console.log(e.details.errors); // { email: 'Required' }
    console.log(e.payload); // raw server payload (unknown)
    console.log(e.response); // the Response object, if any
  }
}
```

The `normalizeErrorPayload` helper digs into `errors`, `detail`, `details`, and `data.errors`, flattening arrays and nested objects into `details.errors` for you.

### Paginated list

```ts
async function listPostsPage(page: number) {
  return api<Post[]>('/posts', null, { _page: page, _limit: 10 }) ?? [];
}

const all: Post[] = [];
for (let p = 1; ; p++) {
  const chunk = await listPostsPage(p);
  if (chunk.length === 0) break;
  all.push(...chunk);
}
```

### Cancel previous request (debounced search)

```ts
let current: AbortController | null = null;

async function search(q: string) {
  current?.abort();
  current = new AbortController();
  try {
    return await api<Result[]>('/search', { signal: current.signal }, { q });
  } catch (e) {
    if (isApiError(e) && e.message.includes('abort')) return [];
    throw e;
  }
}
```

### Passing metadata to interceptors

`options.meta` is copied onto `context.meta` and is readable in every interceptor.

```ts
await api<Post>('/analytics', {
  method: 'POST',
  body: event,
  meta: { feature: 'onboarding', silent: true },
});

api.useError((err, ctx) => {
  if (ctx.meta.silent) return; // don't toast silent calls
  toast.error(err.message);
});
```

## Interceptors

There are three kinds of interceptors. Register them via module options (file paths with a default export) or at runtime on the client. Every registration returns an unregister function.

### Lifecycle

```
client(endpoint)
  ├─ runRequestInterceptors(ctx)        ← can mutate ctx or return a new one (chained)
  ├─ build URL · encode body · fetch
  ├─ if !response.ok → throw ApiError
  ├─ retry loop on retryable status / network error
  ├─ runResponseInterceptors(resCtx)    ← can mutate resCtx.data or return a new resCtx (chained)
  └─ on thrown ApiError → runErrorInterceptors(err, ctx)   ← side-effect only
```

`skipInterceptors: true` on a per-call basis bypasses request, response, **and** error interceptors for that one call.

### Type signatures

```ts
// All three live on `@alikhalilll/nuxt-api-provider/types`.

interface RequestContext {
  endpoint: string;
  baseURL: string;
  headers: Record<string, string>;
  queries: Record<string, unknown>;
  options: RequestOptions; // per-call options (headers cleared — they live on ctx.headers)
  meta: Record<string, unknown>;
}

interface ResponseContext<T = unknown> {
  request: RequestContext;
  response: Response;
  data: T | undefined; // already JSON-parsed; mutate or replace
}

type RequestInterceptor = (
  ctx: RequestContext
) => void | RequestContext | Promise<void | RequestContext>;

type ResponseInterceptor = <T = unknown>(
  ctx: ResponseContext<T>
) => void | ResponseContext<T> | Promise<void | ResponseContext<T>>;

type ErrorInterceptor = (err: ApiError, ctx: RequestContext) => void | Promise<void>;
```

Request and response interceptors **chain** — the value returned by interceptor _N_ is what interceptor _N+1_ receives. Returning nothing keeps the previous context. Error interceptors are side-effect only; they can't suppress or rewrite the thrown `ApiError`.

### Authentication header

```ts
// ~/api/on-request.ts
import type { RequestInterceptor } from '@alikhalilll/nuxt-api-provider/types';

const onRequest: RequestInterceptor = (ctx) => {
  const token = useCookie('token').value;
  if (token) ctx.headers.Authorization = `Bearer ${token}`;
};
export default onRequest;
```

```ts
// nuxt.config.ts
apiProvider: {
  baseURL: '...',
  onRequestPath: '~/api/on-request',
}
```

### Response transform / unwrap

Response interceptors are chained the same way as request interceptors. Each one gets the `ResponseContext` from the previous step and may either **mutate it in place** or **return a new context**. Whatever the last interceptor leaves in `ctx.data` is what the caller `await`s.

Common use case — strip a `{ data: T }` envelope so consumers see `T` directly:

```ts
// ~/api/on-success.ts
import type { ResponseInterceptor } from '@alikhalilll/nuxt-api-provider/types';

const unwrapEnvelope: ResponseInterceptor = (ctx) => {
  const payload = ctx.data as { data?: unknown } | undefined;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    ctx.data = payload.data as typeof ctx.data;
  }
};
export default unwrapEnvelope;
```

Or return a brand-new context (handy when you'd rather not mutate):

```ts
const onSuccess: ResponseInterceptor = (ctx) => ({
  ...ctx,
  data: normalize(ctx.data),
});
```

Pure side-effect interceptors return nothing — useful for tracing, analytics, latency logs:

```ts
api.useResponse((ctx) => {
  console.debug(ctx.response.status, ctx.response.headers.get('server-timing'));
});
```

The `ctx.request` field gives you the full `RequestContext` that produced this response (endpoint, baseURL, headers, queries, options, meta) so you can branch on `ctx.request.meta.feature`, the URL, or any header you set in the request interceptor.

### Error → toast + redirect

```ts
// ~/api/on-error.ts
import type { ErrorInterceptor } from '@alikhalilll/nuxt-api-provider/types';

const onError: ErrorInterceptor = (err, ctx) => {
  if (err.status === 401) return navigateTo('/login');
  if (ctx.meta.silent) return;
  useToast().error(err.message);
};
export default onError;
```

### Runtime registration

Useful when your interceptor depends on a composable (i18n, toast, router) that isn't available at module-setup time:

```ts
// plugins/01-api-interceptors.client.ts
export default defineNuxtPlugin(() => {
  const { $apiProvider } = useNuxtApp();
  const { locale } = useI18n();

  const unregister = $apiProvider.useRequest((ctx) => {
    ctx.headers['X-Locale'] = locale.value;
  });

  // Call `unregister()` to remove this interceptor later.
});
```

## Framework-agnostic core

Everything the Nuxt plugin wraps is available as a plain function you can use in Node, Bun, Deno, a CLI, or a test.

### Node / Bun / CLI

```ts
import { createApiClient, isApiError } from '@alikhalilll/nuxt-api-provider/core';

const client = createApiClient({
  baseURL: 'https://api.github.com',
  headers: { Accept: 'application/vnd.github+json' },
  retry: { attempts: 2 },
});

client.useRequest((ctx) => {
  ctx.headers['User-Agent'] = 'my-cli/1.0';
  if (process.env.GITHUB_TOKEN) {
    ctx.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
});

try {
  const repo = await client<{ stargazers_count: number }>('/repos/nuxt/nuxt');
  console.log(repo?.stargazers_count);
} catch (e) {
  if (isApiError(e)) process.exitCode = 1;
  throw e;
}
```

### Inside Nitro server routes

```ts
// server/api/proxy.ts
import { createApiClient } from '@alikhalilll/nuxt-api-provider/core';

const upstream = createApiClient({
  baseURL: 'https://internal.example.com',
  headers: { 'X-Internal-Key': process.env.INTERNAL_KEY! },
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  return upstream('/widgets', null, query);
});
```

### `ApiClientConfig` reference

| Field          | Type                              | Default            | Purpose                                                                |
| -------------- | --------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `baseURL`      | `string`                          | `''`               | Prepended to every relative endpoint.                                  |
| `timeoutMs`    | `number`                          | `20000`            | Default timeout (overridable per call).                                |
| `retry`        | `Partial<RetryOptions>`           | `{}`               | Default retry policy.                                                  |
| `headers`      | `HeadersInit`                     | —                  | Default headers merged into every request.                             |
| `fetch`        | `typeof fetch`                    | `globalThis.fetch` | Inject a custom fetch (test doubles, polyfills, instrumented fetches). |
| `interceptors` | `{ request?, response?, error? }` | `{}`               | Initial interceptor arrays — equivalent to calling `.useX()` later.    |

### Initial interceptors at construction

```ts
const client = createApiClient({
  baseURL: 'https://api.example.com',
  interceptors: {
    request: [
      (ctx) => {
        ctx.headers['X-Trace'] = crypto.randomUUID();
      },
    ],
    response: [
      (ctx) => {
        ctx.data = unwrap(ctx.data);
      },
    ],
    error: [
      (err) => {
        logger.error(err);
      },
    ],
  },
});
```

### Custom fetch (testing / instrumentation)

> **You almost never need this.** Modern Nuxt, browsers, Node 18+, Bun, and Deno all ship a global `fetch`, so leaving `fetch` unset is the right default. It's an escape hatch for environments or use cases the platform `fetch` can't cover.

When you'd actually inject one:

- **Unit tests** that stub the network without an MSW / `nock` layer — return canned `Response` objects.
- **Older Node** (≤ 17) or sandboxes without a global `fetch` — pass `undici` / `node-fetch`.
- **CLI or Nitro edge cases** that need a custom dispatcher (HTTP proxy, mTLS, custom DNS, cookie jar).
- **Transport-layer tracing / metrics** that need to live below the interceptor chain.

```ts
const fakeFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const client = createApiClient({ fetch: fakeFetch });
```

Notes:

- Must match the platform `fetch` signature `(input, init) => Promise<Response>`.
- Bypassed for any call that sets `onRequestProgress` — the client switches to `XMLHttpRequest` for that single request (the only way to observe upload progress), then the rest of the pipeline (interceptors, retry, error mapping) continues unchanged.
- There's **no per-call override** — `fetch` lives on `ApiClientConfig` only. Use a separate `createApiClient` instance if you need different transports for different call sites.

### `/core` helpers

The `/core` entry exports the building blocks the client itself uses. They're stable and useful in tests, custom transports, and adapters.

| Export                    | Signature / purpose                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `createApiClient`         | `(config?: ApiClientConfig) => ApiProviderClient`. The factory.                                               |
| `joinUrl`                 | `(endpoint, baseURL) => string`. Absolute URLs pass through; collapses duplicate slashes.                     |
| `buildQueryString`        | `(params) => string`. `null`/`undefined`/empty + whitespace strings skipped; arrays repeated.                 |
| `normalizeHeaders`        | `(HeadersInit) => Record<string,string>`. Accepts `Headers`, arrays, plain objects.                           |
| `dropContentType`         | `(headers) => headers`. Case-insensitive Content-Type strip — used internally for `FormData`.                 |
| `encodeBody`              | `(headers, body) => { headers, body }`. JSON / FormData / URLSearchParams / passthrough pipeline.             |
| `shouldOmitBody`          | `(method?) => boolean`. `true` for `GET` and `HEAD`.                                                          |
| `safeParseJson`           | `(Response) => Promise<T \| undefined>`. `204`/`205` → `undefined`; non-JSON bodies fall through as **text**. |
| `combineSignals`          | `(internal, external?) => AbortSignal`. `AbortSignal.any` with a polyfill fallback.                           |
| `DEFAULT_RETRY`           | The default `RetryOptions` constant.                                                                          |
| `resolveRetry`            | `(clientDefaults, perCall) => RetryOptions`. Layered merge.                                                   |
| `shouldRetryStatus`       | `(status, options) => boolean`.                                                                               |
| `computeDelay`            | `(attempt, options) => number`. `delayMs * backoff^n`.                                                        |
| `sleep`                   | `(ms, signal?) => Promise<void>`. Abortable.                                                                  |
| `createXhrFetch`          | `(onProgress) => fetch`. The XHR-backed fetch used for upload progress. Browser-only.                         |
| `normalizeErrorPayload`   | `(input, fallback) => { message, details }`. Flattens common server error shapes into `ApiErrorDetails`.      |
| `ApiError` / `isApiError` | The error class and its brand-checked guard (works across realms).                                            |

## Module options reference

| Option             | Type                    | Default          | Purpose                                                         |
| ------------------ | ----------------------- | ---------------- | --------------------------------------------------------------- |
| `baseURL`          | `string`                | `''`             | Prepended to every relative endpoint.                           |
| `provideName`      | `string`                | `'$apiProvider'` | Injected under `$<name>`. Leading `$` is stripped.              |
| `defaultTimeoutMs` | `number`                | `20000`          | Client-wide request timeout.                                    |
| `server`           | `boolean`               | `true`           | Register the plugin on the server. Set `false` for client-only. |
| `retry`            | `Partial<RetryOptions>` | `{}`             | Default retry policy, overridable per call.                     |
| `onRequestPath`    | `string` (optional)     | —                | Path to a module with a default-exported `RequestInterceptor`.  |
| `onSuccessPath`    | `string` (optional)     | —                | Path to a module with a default-exported `ResponseInterceptor`. |
| `onErrorPath`      | `string` (optional)     | —                | Path to a module with a default-exported `ErrorInterceptor`.    |

## `RequestOptions` reference

`RequestOptions` extends the standard `RequestInit` (so `method`, `credentials`, `cache`, `mode`, `redirect`, `referrer`, `keepalive`, `integrity`, etc. all pass through) and adds:

| Field               | Type                                                                                         | Default        | Purpose                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `body`              | object · array · `FormData` · `URLSearchParams` · `Blob` · `ArrayBuffer` · `string` · `null` | —              | Plain objects / arrays are JSON-encoded; everything else passes through with the right `Content-Type`. |
| `timeoutMs`         | `number`                                                                                     | client default | Per-call timeout. Aborts via an internal `AbortController`.                                            |
| `signal`            | `AbortSignal`                                                                                | —              | External abort signal. Combined with the timeout signal via `AbortSignal.any`.                         |
| `retry`             | `Partial<RetryOptions>`                                                                      | client default | Per-call retry override. `{ attempts: 0 }` disables retries.                                           |
| `skipInterceptors`  | `boolean`                                                                                    | `false`        | Bypass request, response, **and** error interceptors for this call.                                    |
| `meta`              | `Record<string, unknown>`                                                                    | `{}`           | Arbitrary data forwarded to interceptors via `ctx.meta`.                                               |
| `onRequestProgress` | `(p: RequestProgress) => void`                                                               | —              | Upload + download progress. Switches transport to `XMLHttpRequest`.                                    |

## `RetryOptions` reference

| Field                 | Type       | Default                          | Purpose                                               |
| --------------------- | ---------- | -------------------------------- | ----------------------------------------------------- |
| `attempts`            | `number`   | `0`                              | Retry attempts **in addition** to the initial call.   |
| `delayMs`             | `number`   | `300`                            | Base delay between retries, in ms.                    |
| `backoff`             | `number`   | `2`                              | Exponent applied per attempt (`delayMs * backoff^n`). |
| `statusCodes`         | `number[]` | `[408, 429, 500, 502, 503, 504]` | Response status codes that trigger a retry.           |
| `retryOnNetworkError` | `boolean`  | `true`                           | Retry on aborted / network failures (no `Response`).  |

## Exported types

```ts
import type {
  ApiProviderClient,
  ApiProviderModuleOptions,
  ApiClientConfig,
  RequestOptions,
  RequestContext,
  ResponseContext,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RetryOptions,
  RequestProgress,
  ProgressPhase,
  ApiError,
  ApiErrorDetails,
  IError,
  isApiError,
} from '@alikhalilll/nuxt-api-provider/types';
```

## License

MIT
