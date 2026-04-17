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

## Query parameters

Queries are the third argument. `null`/`undefined`/empty-string are skipped; arrays are repeated as `?tag=a&tag=b`.

```ts
const posts = await api<Post[]>('/posts', null, {
  userId: 1,
  tag: ['news', 'featured'],
  q: '', // skipped
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

Delay for attempt `n` (0-indexed) is `delayMs * backoff^n`. Default retryable status codes: `[408, 429, 500, 502, 503, 504]`.

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
    console.log(e.payload); // raw server payload
    console.log(e.response); // the Response object, if any
  }
}
```

## Interceptors

There are three kinds: request, response, and error. Register them via module options (file paths with a default export) or at runtime on the client.

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

### Error redirect

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

Useful when the interceptor depends on a composable (i18n, toast, router) that isn't available at module-setup time. `useRequest`/`useResponse`/`useError` each return an unregister function.

```ts
export default defineNuxtPlugin(() => {
  const { $apiProvider } = useNuxtApp();
  const { locale } = useI18n();

  const unregister = $apiProvider.useRequest((ctx) => {
    ctx.headers['X-Locale'] = locale.value;
  });
});
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

## Module options

| Option             | Type                    | Default          | Purpose                                                         |
| ------------------ | ----------------------- | ---------------- | --------------------------------------------------------------- |
| `baseURL`          | `string`                | `''`             | Prepended to every relative endpoint.                           |
| `provideName`      | `string`                | `'$apiProvider'` | Injected under `$<name>`. Leading `$` is stripped.              |
| `defaultTimeoutMs` | `number`                | `20000`          | Client-wide request timeout.                                    |
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
