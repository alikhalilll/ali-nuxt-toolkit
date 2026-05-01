import { combineSignals } from './abort';
import { encodeBody, shouldOmitBody } from './body';
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
 * registration.
 */
export function createApiClient(config: ApiClientConfig = {}): ApiProviderClient {
  const baseURL = config.baseURL ?? '';
  const timeoutMs = config.timeoutMs ?? 20_000;
  const defaultFetch = config.fetch ?? globalThis.fetch;
  const defaultHeaders = normalizeHeaders(config.headers);

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

  async function executeOnce<T>(ctx: RequestContext): Promise<T | undefined> {
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

    let response: Response;
    try {
      response = await transport(url, {
        ...ctx.options,
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

    if (ctx.options.skipInterceptors) return data;
    const final = await runResponseInterceptors<T>({ request: ctx, response, data });

    return final.data;
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

    const retryOpts = resolveRetry(config.retry, opts.retry);
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

        if (!opts.skipInterceptors) {
          await runErrorInterceptors(apiError, ctx);
        }
        throw apiError;
      }
    }
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
