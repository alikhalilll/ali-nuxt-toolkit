/**
 * Core, framework-agnostic types for @alikhalilll/nuxt-api-provider.
 */

/** Plain record helper. */
export type UnknownRecord = Record<string, unknown>;

/** JSON-serialisable values accepted as a request body. */
export type JsonBody = UnknownRecord | unknown[];

/** Accepted body shapes: plain object, array, FormData, URLSearchParams, Blob, string, or null. */
export type RequestBody =
  | JsonBody
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | string
  | null
  | undefined;

/** Per-call request options. Superset of the browser `RequestInit`. */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Request body. Objects and arrays are JSON-encoded automatically. */
  body?: RequestBody;
  /** Abort the request after this many milliseconds. Defaults to the client-level timeout. */
  timeoutMs?: number;
  /** Per-call retry config. Set `{ attempts: 0 }` to disable retries for this call. */
  retry?: Partial<RetryOptions>;
  /** Skip running the response/error interceptors for this call. */
  skipInterceptors?: boolean;
  /** Arbitrary data you want to pass down to interceptors via `context.meta`. */
  meta?: UnknownRecord;
  /**
   * Progress callback covering both upload and download phases. When set, the
   * client uses `XMLHttpRequest` under the hood (since `fetch` cannot report
   * upload progress). Retries and interceptors still apply.
   */
  onRequestProgress?: (progress: RequestProgress) => void;
}

/** Phase emitted by the progress hook. */
export type ProgressPhase = 'upload' | 'download';

/** Progress event surfaced to `onRequestProgress`. */
export interface RequestProgress {
  /** Which phase of the request this event describes. */
  phase: ProgressPhase;
  /** Bytes transferred so far for this phase. */
  loaded: number;
  /** Total bytes expected for this phase, or `null` if not known (chunked, etc.). */
  total: number | null;
  /** `loaded / total` as a 0..1 ratio, or `null` when `total` is unknown. */
  ratio: number | null;
}

/** Retry behaviour. All fields optional — sensible defaults applied. */
export interface RetryOptions {
  /** Number of retry attempts (in addition to the initial call). Default 0. */
  attempts: number;
  /** Base delay in ms between retries. Default 300. */
  delayMs: number;
  /** Backoff factor applied to delayMs between attempts. Default 2. */
  backoff: number;
  /** HTTP status codes that should trigger a retry. Default `[408, 429, 500, 502, 503, 504]`. */
  statusCodes: number[];
  /** Retry on network/abort errors (no response). Default `true`. */
  retryOnNetworkError: boolean;
}

/** Mutable context passed to request interceptors. Mutate in place or return a new context. */
export interface RequestContext {
  /** Final endpoint — may be absolute or relative to `baseURL`. */
  endpoint: string;
  /** Base URL configured on the client (read-only hint). */
  baseURL: string;
  /** Merged headers. Mutate to add/remove values. */
  headers: Record<string, string>;
  /** Query parameters. Mutate to add/remove values. */
  queries: Record<string, unknown>;
  /** The per-call options, minus headers/body (headers live on `context.headers`). */
  options: RequestOptions;
  /** Opaque user-supplied data, propagated to response/error interceptors. */
  meta: UnknownRecord;
}

/** Immutable response handed to response and error interceptors. */
export interface ResponseContext<T = unknown> {
  readonly request: RequestContext;
  readonly response: Response;
  readonly data: T | undefined;
}

/** Request interceptor — may mutate the context or return a new one. */
export type RequestInterceptor = (
  context: RequestContext
) => void | RequestContext | Promise<void | RequestContext>;

/** Response interceptor — fires on 2xx responses. */
export type ResponseInterceptor = <T = unknown>(
  context: ResponseContext<T>
) => void | Promise<void>;

/** Error interceptor — fires on non-2xx responses and network errors. */
export type ErrorInterceptor = (
  error: import('./error').ApiError,
  context: RequestContext
) => void | Promise<void>;

/** Top-level client config. */
export interface ApiClientConfig {
  /** Absolute base URL prepended to relative endpoints. */
  baseURL?: string;
  /** Default timeout in ms. Can be overridden per call. Default 20000. */
  timeoutMs?: number;
  /** Default retry policy. Can be overridden per call. */
  retry?: Partial<RetryOptions>;
  /** Default headers merged into every request. */
  headers?: HeadersInit;
  /** Fetch implementation. Defaults to `globalThis.fetch`. */
  fetch?: typeof fetch;
  /** Initial interceptors — can also be added via `client.use*` methods. */
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
    error?: ErrorInterceptor[];
  };
}

/**
 * The callable API provider client type.
 *
 * Consumers can annotate their own helpers with this:
 * ```ts
 * import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider';
 * const api: ApiProviderClient = useNuxtApp().$apiProvider;
 * const user = await api<User>('/me');
 * ```
 */
export interface ApiProviderClient {
  /** Execute a request and parse the JSON response. Returns `undefined` for 204/205. */
  <T = unknown>(
    endpoint: string,
    options?: RequestOptions | null,
    queries?: Record<string, unknown>
  ): Promise<T | undefined>;
  /** Register a request interceptor. Returns an unregister function. */
  useRequest(interceptor: RequestInterceptor): () => void;
  /** Register a response interceptor. Returns an unregister function. */
  useResponse(interceptor: ResponseInterceptor): () => void;
  /** Register an error interceptor. Returns an unregister function. */
  useError(interceptor: ErrorInterceptor): () => void;
  /** Read-only snapshot of the client config. */
  readonly config: Readonly<Required<Pick<ApiClientConfig, 'baseURL' | 'timeoutMs'>> & ApiClientConfig>;
}
