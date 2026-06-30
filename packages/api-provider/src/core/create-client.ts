import { combineSignals } from './abort';
import { encodeBody, shouldOmitBody } from './body';
import { ApiCache, isExpired, isFresh } from './cache';
import { buildCacheKey } from './cache-key';
import { resolveCacheConfig, type CacheOptions } from './cache.types';
import { ApiError, normalizeErrorPayload } from './error';
import { normalizeHeaders } from './headers';
import { safeParseJson } from './json';
import { buildQueryString } from './query';
import { computeDelay, resolveRetry, shouldRetryStatus, sleep } from './retry';
import type {
  ApiClientConfig,
  ApiProviderClient,
  ErrorInterceptor,
  RequestContext,
  RequestInterceptor,
  RequestOptions,
  ResponseContext,
  ResponseInterceptor,
} from './types';
import { joinUrl } from './url';
import { createXhrFetch } from './xhr-fetch';

/**
 * Create a framework-agnostic API client.
 *
 * The returned object is directly callable — `await client('/users')` — and
 * exposes `.useRequest`, `.useResponse`, `.useError` for interceptor
 * registration, plus `.cache` for cache control.
 */
export function createApiClient(config: ApiClientConfig = {}): ApiProviderClient {
  const baseURL = config.baseURL ?? '';
  const timeoutMs = config.timeoutMs ?? 20_000;
  const defaultFetch = config.fetch ?? globalThis.fetch;
  const defaultHeaders = normalizeHeaders(config.headers);
  const cache = new ApiCache(config.cache);
  const cacheDefaults = cache.getConfig();

  const requestInterceptors: RequestInterceptor[] = [...(config.interceptors?.request ?? [])];
  const responseInterceptors: ResponseInterceptor[] = [...(config.interceptors?.response ?? [])];
  const errorInterceptors: ErrorInterceptor[] = [...(config.interceptors?.error ?? [])];

  async function runRequestInterceptors(ctx: RequestContext): Promise<RequestContext> {
    let current = ctx;
    for (const interceptor of requestInterceptors) {
      const result = await interceptor(current);
      if (result) current = result;
    }
    return current;
  }

  async function runResponseInterceptors<T>(ctx: ResponseContext<T>): Promise<ResponseContext<T>> {
    let current = ctx;
    for (const interceptor of responseInterceptors) {
      const result = await interceptor(current);
      if (result) current = result;
    }
    return current;
  }

  async function runErrorInterceptors(error: ApiError, ctx: RequestContext): Promise<void> {
    for (const interceptor of errorInterceptors) {
      try {
        await interceptor(error, ctx);
      } catch {
        // Interceptor failures must never mask the original error.
      }
    }
  }

  async function executeOnce<T>(
    ctx: RequestContext
  ): Promise<{ data: T | undefined; status: number }> {
    const url = buildUrl(ctx);
    const headers = ctx.headers;
    const { headers: finalHeaders, body } = encodeBody(
      headers,
      shouldOmitBody(ctx.options.method) ? undefined : ctx.options.body
    );

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new DOMException('Request timeout', 'TimeoutError')),
      ctx.options.timeoutMs ?? timeoutMs
    );

    const external = (ctx.options.signal ?? null) as AbortSignal | null;
    const signal = combineSignals(controller.signal, external);

    // Swap the transport when the caller wants progress events.
    // `fetch` has no upload-progress support; XHR does.
    const transport = ctx.options.onRequestProgress
      ? createXhrFetch(ctx.options.onRequestProgress)
      : defaultFetch;

    // Strip our custom fields before handing the init to fetch. The browser
    // rejects unknown shapes for known fields (notably `cache`, which expects
    // a `RequestCache` union — a `CacheOptions` object or `false` would make
    // the request fail with "provisional headers shown" and never leave the
    // tab). The other extras (`timeoutMs`, `retry`, etc.) fetch tolerates,
    // but stripping them keeps the wire payload clean.
    const {
      cache: _cache,
      timeoutMs: _timeoutMs,
      retry: _retry,
      skipInterceptors: _skipInterceptors,
      meta: _meta,
      onRequestProgress: _onRequestProgress,
      ...fetchInit
    } = ctx.options;

    let response: Response;
    try {
      response = await transport(url, {
        ...fetchInit,
        headers: finalHeaders,
        body,
        signal,
      } as RequestInit);
    } catch (e: unknown) {
      clearTimeout(timer);
      throw toNetworkError(e);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const payload = await safeParseJson<unknown>(response);
      const { message, details } = normalizeErrorPayload(
        payload,
        response.statusText || 'Request failed'
      );
      throw new ApiError({ message, status: response.status, details, payload, response });
    }

    const data = await safeParseJson<T>(response);

    if (ctx.options.skipInterceptors) {
      return { data, status: response.status };
    }
    const final = await runResponseInterceptors<T>({ request: ctx, response, data });

    return { data: final.data, status: response.status };
  }

  async function runWithRetries<T>(
    ctx: RequestContext
  ): Promise<{ data: T | undefined; status: number }> {
    const retryOpts = resolveRetry(config.retry, ctx.options.retry);
    let attempt = 0;

    while (true) {
      try {
        return await executeOnce<T>(ctx);
      } catch (e: unknown) {
        const apiError = ApiError.is(e) ? e : toNetworkError(e);

        const isNetwork = apiError.status === 0;
        const retryable =
          attempt < retryOpts.attempts &&
          ((isNetwork && retryOpts.retryOnNetworkError) ||
            (!isNetwork && shouldRetryStatus(apiError.status, retryOpts)));

        if (retryable) {
          await sleep(computeDelay(attempt, retryOpts));
          attempt++;
          continue;
        }

        if (!ctx.options.skipInterceptors) {
          await runErrorInterceptors(apiError, ctx);
        }
        throw apiError;
      }
    }
  }

  /**
   * Cache layer. Order of operations:
   *
   *   1. Resolve effective cache settings (client defaults + per-call overrides).
   *   2. If caching doesn't apply (disabled, non-cacheable method), passthrough.
   *   3. Look up an in-flight promise for the same key — share if found.
   *   4. Look up the stored entry:
   *        - fresh + !refetch  → return cached, no network
   *        - stale + swr       → return cached, fire background refetch
   *        - expired / missing → network, store result
   */
  async function runWithCache<T>(ctx: RequestContext): Promise<T | undefined> {
    const perCall = ctx.options.cache;
    if (perCall === false || cacheDefaults.enabled === false) {
      const { data } = await runWithRetries<T>(ctx);
      return data;
    }

    const effective = resolveCacheConfig({
      ...cacheDefaults,
      ...(typeof perCall === 'object' && perCall ? perCall : {}),
    });

    if (!effective.enabled) {
      const { data } = await runWithRetries<T>(ctx);
      return data;
    }

    const method = (ctx.options.method || 'GET').toUpperCase();
    if (!effective.cacheableMethods.some((m) => m.toUpperCase() === method)) {
      const { data } = await runWithRetries<T>(ctx);
      return data;
    }

    const override =
      perCall && typeof perCall === 'object' ? (perCall as CacheOptions).key : undefined;
    const refetch =
      perCall && typeof perCall === 'object' ? Boolean((perCall as CacheOptions).refetch) : false;

    const key = buildCacheKey({
      method,
      url: buildUrl(ctx),
      body: shouldOmitBody(method) ? undefined : ctx.options.body,
      override,
    });

    // Step 1 — share an in-flight promise if one exists for this key.
    if (effective.dedupe && !refetch) {
      const pending = cache.getInFlight<T>(key);
      if (pending) return pending;
    }

    // Step 2 — consult the store.
    const entry = cache.get<T>(key);
    if (entry && !refetch) {
      if (isFresh(entry)) {
        return entry.data;
      }
      if (effective.swr && !isExpired(entry)) {
        // Stale-while-revalidate: hand back cached data immediately, refresh
        // the entry in the background. Errors are swallowed — the caller
        // already has data and the failure surfaces on the next miss.
        if (!cache.getInFlight<T>(key)) {
          const bg = runWithRetries<T>(ctx)
            .then(({ data, status }) => {
              cache.set<T>(key, data, status);
              return data;
            })
            .catch(() => entry.data)
            .finally(() => cache.clearInFlight(key));
          cache.setInFlight<T>(key, bg);
        }
        return entry.data;
      }
    }

    // Step 3 — fresh network call, store result, share the in-flight promise.
    const networkPromise = runWithRetries<T>(ctx)
      .then(({ data, status }) => {
        cache.set<T>(key, data, status);
        return data;
      })
      .finally(() => cache.clearInFlight(key));

    if (effective.dedupe) {
      cache.setInFlight<T>(key, networkPromise);
    }
    return networkPromise;
  }

  const client = async function apiClient<T = unknown>(
    endpoint: string,
    options?: RequestOptions | null,
    queries?: Record<string, unknown>
  ): Promise<T | undefined> {
    const opts: RequestOptions = options ?? {};

    const initialCtx: RequestContext = {
      endpoint,
      baseURL,
      headers: { ...defaultHeaders, ...normalizeHeaders(opts.headers) },
      queries: { ...(queries ?? {}) },
      options: { ...opts, headers: undefined },
      meta: { ...(opts.meta ?? {}) },
    };

    const ctx = opts.skipInterceptors ? initialCtx : await runRequestInterceptors(initialCtx);

    return runWithCache<T>(ctx);
  } as ApiProviderClient;

  client.useRequest = (interceptor) => {
    requestInterceptors.push(interceptor);
    return () => {
      const idx = requestInterceptors.indexOf(interceptor);
      if (idx >= 0) requestInterceptors.splice(idx, 1);
    };
  };
  client.useResponse = (interceptor) => {
    responseInterceptors.push(interceptor);
    return () => {
      const idx = responseInterceptors.indexOf(interceptor);
      if (idx >= 0) responseInterceptors.splice(idx, 1);
    };
  };
  client.useError = (interceptor) => {
    errorInterceptors.push(interceptor);
    return () => {
      const idx = errorInterceptors.indexOf(interceptor);
      if (idx >= 0) errorInterceptors.splice(idx, 1);
    };
  };

  Object.defineProperty(client, 'config', {
    value: Object.freeze({ ...config, baseURL, timeoutMs }),
    enumerable: true,
    writable: false,
  });
  Object.defineProperty(client, 'cache', {
    value: cache,
    enumerable: true,
    writable: false,
  });

  return client;
}

function buildUrl(ctx: RequestContext): string {
  const base = joinUrl(ctx.endpoint, ctx.baseURL);
  const qs = buildQueryString(ctx.queries);
  if (!qs) return base;
  return base.includes('?') ? `${base}&${qs}` : `${base}?${qs}`;
}

function toNetworkError(e: unknown): ApiError {
  if (ApiError.is(e)) return e;
  const message = e instanceof Error ? e.message || 'Network error' : 'Network error';
  return new ApiError({ message, status: 0, details: { errors: {} }, payload: e });
}
