/**
 * Stubs for Nuxt virtual modules referenced by runtime/plugin.ts. These modules
 * are only resolvable inside a Nuxt build context; the stubs keep `tsc --noEmit`
 * happy during standalone typecheck.
 */

declare module '#app' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineNuxtPlugin(plugin: any): any;
}

declare module '#build/api-provider-config.mjs' {
  import type { RetryOptions } from './core/types';
  const config: {
    baseURL: string;
    defaultTimeoutMs: number;
    provideName: string;
    retry?: Partial<RetryOptions>;
  };
  export default config;
}

declare module '#build/api-provider-handlers.mjs' {
  import type { RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from './core/types';
  export const onRequestHandler: RequestInterceptor;
  export const onSuccessHandler: ResponseInterceptor;
  export const onErrorHandler: ErrorInterceptor;
}
