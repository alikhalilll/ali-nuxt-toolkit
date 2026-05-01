---
title: api-provider
description: Strongly-typed fetch client for Nuxt 3/4 with interceptors, retry/backoff, and upload/download progress.
package: '@alikhalilll/nuxt-api-provider'
order: 1
---

# @alikhalilll/nuxt-api-provider

A strongly-typed `fetch` client for Nuxt 3 / 4 with interceptors, retry/backoff, and a framework-agnostic core you can use anywhere.

- **Typed client type** — `ApiProviderClient` is exported so you can annotate your own wrappers and composables.
- **Interceptor chain** — register multiple request/response/error interceptors via `.useRequest`, `.useResponse`, `.useError`.
- **Retry + backoff** — per-client defaults with per-call overrides. Configurable status codes and exponential delay.
- **Smart body encoding** — plain objects → JSON; `FormData` / `URLSearchParams` / `Blob` / `ArrayBuffer` / `string` pass through with correct Content-Type.
- **Timeouts + abort** — per-call timeout plus `AbortSignal` support via `AbortSignal.any` with a polyfill fallback.
- **Upload + download progress** — a single `onRequestProgress` hook. The client transparently switches to `XMLHttpRequest` only when you pass it.
- **`ApiError` class** — structured errors with `.status`, `.details`, `.payload`, `.response`, plus an `isApiError(e)` / `ApiError.is(e)` guard that works across bundles and realms.
- **Framework-agnostic core** — `import { createApiClient } from '@alikhalilll/nuxt-api-provider/core'` to use outside Nuxt.

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
    onRequestPath: '~/api/on-request',
    onSuccessPath: '~/api/on-success',
    onErrorPath: '~/api/on-error',
  },
});
```

## Basic usage

`$apiProvider` is augmented onto `NuxtApp` and `ComponentCustomProperties` as an `ApiProviderClient`. Wrap it in a composable to stop destructuring it everywhere:

```ts
// composables/useApi.ts
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/types';

export const useApi = (): ApiProviderClient => useNuxtApp().$apiProvider;
```

```vue
<script setup lang="ts">
interface Post {
  id: number;
  title: string;
}
const post = await useApi()<Post>('/posts/1');
</script>
```

::DemoApiBasic
::

## SSR (server-side rendering)

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

If you set `server: false` in `nuxt.config.ts`, `$apiProvider` won't exist during SSR and this pattern will throw — move the call into `onMounted` or `useAsyncData(..., { server: false })`.

## `useAsyncData`

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

If you factor the call into a service, pass the client in rather than calling `useNuxtApp()` inside the service:

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

The same function now works from a Nitro route (pass a `createApiClient` instance instead) — see the core section below.

## Query parameters

Queries are the third argument.

- `null` and `undefined` are skipped.
- Empty **and** whitespace-only strings (`''`, `'   '`) are skipped.
- Arrays are repeated: `{ tag: ['a','b'] }` → `?tag=a&tag=b`. `null` / `undefined` / empty entries inside arrays are skipped too.
- Anything else is coerced via `String(...)`, so numbers and booleans are fine.

```ts
const posts = await api<Post[]>('/posts', null, {
  userId: 1,
  tag: ['news', 'featured'],
  q: '   ', // skipped (whitespace)
  draft: undefined, // skipped
});
```

## POST with JSON

Plain objects (and arrays) are JSON-encoded; `Content-Type: application/json` is set automatically.

```ts
const created = await api<Post>('/posts', {
  method: 'POST',
  body: { userId: 42, title: 'Hello', body: 'World' },
});
```

## PATCH / PUT / DELETE

```ts
await api<Post>('/posts/1', { method: 'PATCH', body: { title: 'Updated' } });
await api<Post>('/posts/1', { method: 'PUT', body: fullReplacement });
await api('/posts/1', { method: 'DELETE' });
```

## FormData / multipart

`FormData` is passed through and `Content-Type` is dropped so the browser sets the boundary.

```ts
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('caption', 'my file');

await api<{ url: string }>('/uploads', { method: 'POST', body: form });
```

## URL-encoded

`URLSearchParams` sets `Content-Type: application/x-www-form-urlencoded` when not already present.

```ts
const body = new URLSearchParams({ grant_type: 'refresh_token', token: rt });
await api<{ access_token: string }>('/oauth/token', { method: 'POST', body });
```

## Timeouts and abort

```ts
// Aborts after 3s regardless of the client-level default.
await api('/slow', { timeoutMs: 3_000 });

// External AbortSignal — combined with the internal timeout signal via AbortSignal.any.
const ctrl = new AbortController();
const promise = api('/stream', { signal: ctrl.signal });
ctrl.abort();
```

## Retry and backoff

Per-client defaults from `nuxt.config.ts` can be overridden per call.

```ts
await api('/flaky', {
  retry: { attempts: 3, delayMs: 500, backoff: 2, statusCodes: [503] },
});

// Disable retries for this call specifically.
await api('/critical', { retry: { attempts: 0 } });
```

Delay for attempt `n` (0-indexed) is `delayMs * backoff^n`. Retries fire on either a network error (`status === 0`, controllable via `retryOnNetworkError`) or a response whose status appears in `statusCodes`.

### `RetryOptions` reference

| Field                 | Type       | Default                          | Purpose                                               |
| --------------------- | ---------- | -------------------------------- | ----------------------------------------------------- |
| `attempts`            | `number`   | `0`                              | Retry attempts **in addition** to the initial call.   |
| `delayMs`             | `number`   | `300`                            | Base delay between retries, in ms.                    |
| `backoff`             | `number`   | `2`                              | Exponent applied per attempt (`delayMs * backoff^n`). |
| `statusCodes`         | `number[]` | `[408, 429, 500, 502, 503, 504]` | Response status codes that trigger a retry.           |
| `retryOnNetworkError` | `boolean`  | `true`                           | Retry on aborted / network failures (no `Response`).  |

## Upload / download progress

Pass `onRequestProgress` to observe both phases. The callback receives `{ phase, loaded, total, ratio }`. `phase` is `'upload'` while the body is being sent and `'download'` while the response is being received. `total` and `ratio` are `null` when the length isn't known.

```vue
<script setup lang="ts">
const uploaded = ref(0);
const uploadRatio = ref(0);

await useApi()('/uploads', {
  method: 'POST',
  body: form,
  retry: { attempts: 0 },
  timeoutMs: 60_000,
  onRequestProgress: ({ phase, loaded, ratio }) => {
    if (phase === 'upload') {
      uploaded.value = loaded;
      if (ratio !== null) uploadRatio.value = ratio;
    }
  },
});
</script>
```

::DemoApiProgress
::

::alert{type="info"}
When `onRequestProgress` is set, the client swaps transport to `XMLHttpRequest` (the only way to observe upload progress in a browser). Interceptors, retry, timeout, `AbortSignal`, and `ApiError` still work identically. The fast path (no progress callback) stays on native `fetch`.
::

## Error handling

Every failure throws an `ApiError`. It's the same class for HTTP errors and network errors (`status === 0` means the request never reached a response).

The class implements the generic `IError<TErrors, TOtherKeys>` interface — a framework-agnostic contract you can use to type your own error shapes or narrow the known field names:

```ts
import type { IError } from '@alikhalilll/nuxt-api-provider/types';

type LoginError = IError<'email' | 'password', 'hint'>;
// -> { message: string; details: { errors: { email: string; password: string } } & { hint?: string | Record<string, string> } }
```

Discriminate caught errors with `isApiError(e)` (or the equivalent static `ApiError.is(e)`). Prefer it over `instanceof ApiError`: `instanceof` is unreliable when the package ends up duplicated in a bundle, across realms (iframes, workers), or after downleveling — `isApiError` uses a `Symbol.for(...)` brand that survives all three.

```ts
import { isApiError } from '@alikhalilll/nuxt-api-provider/types';

try {
  await api('/users', { method: 'POST', body: { email: 'bad' } });
} catch (e) {
  if (isApiError(e)) {
    console.log(e.status); // 422
    console.log(e.message); // 'Validation failed'
    console.log(e.details.errors); // { email: 'Required' }
    console.log(e.payload); // raw server payload (object, array, or string)
    console.log(e.response); // the Response object, if any
  }
}
```

The body parser falls through gracefully: `204` / `205` give `undefined`, valid JSON gives the parsed object, and **non-JSON bodies are returned as the raw text** (so `payload` can be `string`). This applies to both successful responses and error payloads.

`normalizeErrorPayload` (re-exported from `/core`) is what turns server payloads into the `{ message, details }` shape attached to the error. It dives into common envelopes — `errors`, `detail`, `details`, and `data.errors` — flattening arrays and nested records into `details.errors`.

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

## Cancel previous request (debounced search)

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

## Paginated list

```ts
async function listPostsPage(page: number) {
  return (await api<Post[]>('/posts', null, { _page: page, _limit: 10 })) ?? [];
}

const all: Post[] = [];
for (let p = 1; ; p++) {
  const chunk = await listPostsPage(p);
  if (chunk.length === 0) break;
  all.push(...chunk);
}
```

## Interceptors

There are three kinds: **request**, **response**, and **error**. Register them via module options (file paths with a default export) or at runtime via `client.useRequest` / `client.useResponse` / `client.useError`. Every registration returns an unregister function.

### Lifecycle

```
client(endpoint)
  ├─ runRequestInterceptors(ctx)        ← chain; mutate ctx or return a new one
  ├─ build URL · encode body · fetch
  ├─ if !response.ok → throw ApiError
  ├─ retry loop on retryable status / network error
  ├─ runResponseInterceptors(resCtx)    ← chain; mutate resCtx.data or return a new resCtx
  └─ on thrown ApiError → runErrorInterceptors(err, ctx)   ← side-effect only
```

`skipInterceptors: true` on a per-call basis bypasses request, response, **and** error interceptors for that single call.

### Type signatures

All three are exported from `@alikhalilll/nuxt-api-provider/types`.

```ts
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

Request and response interceptors **chain** — what interceptor _N_ returns is what interceptor _N+1_ receives. Returning nothing keeps the previous context. Error interceptors are side-effect only; they can't suppress or rewrite the thrown `ApiError`.

### Request — auth header

```ts
// ~/api/on-request.ts
import type { RequestInterceptor } from '@alikhalilll/nuxt-api-provider/types';

const onRequest: RequestInterceptor = (ctx) => {
  const token = useCookie('token').value;
  if (token) ctx.headers.Authorization = `Bearer ${token}`;
};
export default onRequest;
```

### Response — transform / unwrap

Response interceptors chain the same way as request interceptors. Mutate `ctx.data` in place, or return a new context — whatever the last interceptor leaves in `ctx.data` is what the caller `await`s.

Strip a `{ data: T }` envelope so callers see `T` directly:

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

Or return a new context instead of mutating:

```ts
const onSuccess: ResponseInterceptor = (ctx) => ({
  ...ctx,
  data: normalize(ctx.data),
});
```

Pure side-effect (tracing, analytics, latency logging) — return nothing:

```ts
api.useResponse((ctx) => {
  console.debug(ctx.response.status, ctx.response.headers.get('server-timing'));
});
```

`ctx.request` gives you the full `RequestContext` that produced this response (endpoint, baseURL, headers, queries, options, meta), so you can branch on `ctx.request.meta.feature`, the URL, or anything you set in the request interceptor.

### Error — redirect / toast

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

Error interceptors run after retries are exhausted. They cannot suppress the throw — re-raise from the call site if you need recovery.

### Runtime registration

Useful when the interceptor depends on a composable (i18n, toast, router) that isn't available at module-setup time. `useRequest` / `useResponse` / `useError` each return an unregister function.

```ts
export default defineNuxtPlugin(() => {
  const { $apiProvider } = useNuxtApp();
  const { locale } = useI18n();

  const unregister = $apiProvider.useRequest((ctx) => {
    ctx.headers['X-Locale'] = locale.value;
  });
  // call `unregister()` to remove the interceptor later
});
```

### Passing metadata

`options.meta` is copied onto `ctx.meta` and is readable in every interceptor — handy for opting individual calls out of generic behavior:

```ts
await api<Post>('/analytics', {
  method: 'POST',
  body: event,
  meta: { silent: true },
});

api.useError((err, ctx) => {
  if (ctx.meta.silent) return;
  toast.error(err.message);
});
```

### Skipping interceptors

```ts
// Bypass request/response/error interceptors for this call only.
await api('/internal/health', { skipInterceptors: true });
```

## Framework-agnostic core

Everything the Nuxt plugin wraps is available as a plain factory. Works in Node, Bun, Deno, a CLI, or a test.

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

const repo = await client<{ stargazers_count: number }>('/repos/nuxt/nuxt');
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

::alert{type="info"}
**You almost never need this.** Modern Nuxt, browsers, Node 18+, Bun, and Deno all ship a global `fetch`, so leaving `fetch` unset is the right default. It's an escape hatch for environments or use cases the platform `fetch` can't cover.
::

When you'd actually inject one:

- **Unit tests** that stub the network without an MSW / `nock` layer — return canned `Response` objects.
- **Older Node** (≤ 17) or sandboxes without a global `fetch` — pass `undici` / `node-fetch`.
- **CLI or Nitro edge cases** that need a custom dispatcher (HTTP proxy, mTLS, custom DNS, cookie jar).
- **Transport-layer tracing / metrics** that need to live below the interceptor chain.

```ts
const fakeFetch: typeof fetch = async (input, init) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

const client = createApiClient({ fetch: fakeFetch });
```

Notes:

- The function must match the platform `fetch` signature `(input, init) => Promise<Response>`.
- Bypassed for any call that sets `onRequestProgress` — the client switches to `XMLHttpRequest` for that single request (the only way to observe upload progress), then the rest of the pipeline (interceptors, retry, error mapping) continues unchanged.
- There's **no per-call override** — `fetch` lives on `ApiClientConfig` only. Use a separate `createApiClient` instance if you need different transports for different call sites.

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

### `/core` helpers

The `/core` entry exports the small building blocks the client itself uses. They're stable and useful in tests, custom transports, and adapters.

| Export                    | Signature / purpose                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `createApiClient`         | `(config?: ApiClientConfig) => ApiProviderClient`. The factory.                                                       |
| `joinUrl`                 | `(endpoint, baseURL) => string`. Absolute URLs pass through; collapses duplicate slashes.                             |
| `buildQueryString`        | `(params) => string`. Same skip-rules as the third call argument.                                                     |
| `normalizeHeaders`        | `(HeadersInit) => Record<string,string>`. Accepts `Headers`, arrays, plain objects.                                   |
| `dropContentType`         | `(headers) => headers`. Case-insensitive Content-Type strip — used internally for `FormData`.                         |
| `encodeBody`              | `(headers, body) => { headers, body }`. The body-encoding pipeline (JSON / FormData / URLSearchParams / passthrough). |
| `shouldOmitBody`          | `(method?) => boolean`. `true` for `GET` and `HEAD`.                                                                  |
| `safeParseJson`           | `(Response) => Promise<T \| undefined>`. `204`/`205` → `undefined`; non-JSON bodies fall through as **text**.         |
| `combineSignals`          | `(internal, external?) => AbortSignal`. `AbortSignal.any` with a polyfill fallback.                                   |
| `DEFAULT_RETRY`           | The default `RetryOptions` constant.                                                                                  |
| `resolveRetry`            | `(clientDefaults, perCall) => RetryOptions`. Layered merge.                                                           |
| `shouldRetryStatus`       | `(status, options) => boolean`.                                                                                       |
| `computeDelay`            | `(attempt, options) => number`. `delayMs * backoff^n`.                                                                |
| `sleep`                   | `(ms, signal?) => Promise<void>`. Abortable.                                                                          |
| `createXhrFetch`          | `(onProgress) => fetch`. The XHR-backed fetch used for upload progress. Browser-only.                                 |
| `normalizeErrorPayload`   | `(input, fallback) => { message, details }`. Flattens common server error shapes into `ApiErrorDetails`.              |
| `ApiError` / `isApiError` | The error class and its brand-checked guard (works across realms).                                                    |

## Module options

| Option             | Type                    | Default          | Purpose                                                         |
| ------------------ | ----------------------- | ---------------- | --------------------------------------------------------------- |
| `baseURL`          | `string`                | `''`             | Prepended to every relative endpoint.                           |
| `provideName`      | `string`                | `'$apiProvider'` | Injected under `$<name>`. Leading `$` is stripped.              |
| `defaultTimeoutMs` | `number`                | `20000`          | Client-wide request timeout.                                    |
| `server`           | `boolean`               | `true`           | Register the plugin on the server. Set `false` for client-only. |
| `retry`            | `Partial<RetryOptions>` | `{}`             | Default retry policy, overridable per call.                     |
| `onRequestPath`    | `string`                | —                | Path to a module with a default-exported `RequestInterceptor`.  |
| `onSuccessPath`    | `string`                | —                | Path to a module with a default-exported `ResponseInterceptor`. |
| `onErrorPath`      | `string`                | —                | Path to a module with a default-exported `ErrorInterceptor`.    |

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
