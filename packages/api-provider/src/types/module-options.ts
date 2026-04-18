import type { RetryOptions } from '../core/types';

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
  /** Absolute or relative path to a module with a default-exported request interceptor. */
  onRequestPath?: string;
  /** Absolute or relative path to a module with a default-exported response interceptor. */
  onSuccessPath?: string;
  /** Absolute or relative path to a module with a default-exported error interceptor. */
  onErrorPath?: string;
}
