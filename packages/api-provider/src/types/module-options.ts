import type { CacheConfig } from '../core/cache.types';
import type { RetryOptions } from '../core/types';

/**
 * Cache configuration as accepted by the Nuxt module. Extends the
 * framework-agnostic `CacheConfig` with the Nuxt-only `hydrate` flag.
 */
export interface ApiProviderModuleCacheOptions extends CacheConfig {
  /**
   * When `true`, the cache produced during SSR is serialised into the Nuxt
   * payload and restored on the client, so the first paint hits the cache
   * instead of refetching. Default: `false`.
   */
  hydrate?: boolean;
}

export interface ApiProviderModuleOptions {
  /** Absolute base URL prepended to every relative endpoint. */
  baseURL: string;
  /**
   * Name under which the client is provided. Accepts `$apiProvider`, `$api`, or
   * `api` — the leading `$` is stripped automatically. Default: `$apiProvider`.
   */
  provideName: string;
  /** Default request timeout in milliseconds. Default: 20000. */
  defaultTimeoutMs?: number;
  /**
   * Register the plugin on the server. Default: `true`.
   * Set to `false` to skip SSR entirely (client-only). When disabled,
   * `$apiProvider` will not exist during SSR — calls inside
   * `useAsyncData(..., { server: true })` will fail.
   */
  server?: boolean;
  /** Default retry policy. Can be overridden per call. */
  retry?: Partial<RetryOptions>;
  /**
   * Cache configuration. Caching is enabled by default with TanStack-Query-
   * style semantics: `staleTime` 30s, `gcTime` 5min, SWR on, only GET/HEAD
   * cached. Set `{ enabled: false }` to disable entirely, or `{ hydrate: true }`
   * to forward the SSR cache to the client via the Nuxt payload.
   */
  cache?: ApiProviderModuleCacheOptions;
  /** Absolute or relative path to a module with a default-exported request interceptor. */
  onRequestPath?: string;
  /** Absolute or relative path to a module with a default-exported response interceptor. */
  onSuccessPath?: string;
  /** Absolute or relative path to a module with a default-exported error interceptor. */
  onErrorPath?: string;
}
