import type { CacheConfig } from '../core/cache.types';
import type { ApiProviderModuleOptions } from '../types/module-options';

export interface ResolvedApiProviderConfig {
  baseURL: string;
  defaultTimeoutMs: number;
  provideName: string;
  retry: ApiProviderModuleOptions['retry'];
  /** Pure cache config, scrubbed of the Nuxt-only `hydrate` flag. */
  cache: CacheConfig | undefined;
  /** Nuxt-only flag — opt-in SSR → CSR cache hydration via the Nuxt payload. */
  hydrate: boolean;
}

export function createConfigTemplateContents(params: {
  options: ApiProviderModuleOptions;
  normalizedProvideName: string;
}): string {
  const { options, normalizedProvideName } = params;
  const { hydrate, ...cacheRest } = options.cache ?? {};
  const cfg: ResolvedApiProviderConfig = {
    baseURL: options.baseURL,
    defaultTimeoutMs: options.defaultTimeoutMs ?? 20_000,
    provideName: normalizedProvideName,
    retry: options.retry,
    cache: Object.keys(cacheRest).length > 0 ? (cacheRest as CacheConfig) : undefined,
    hydrate: Boolean(hydrate),
  };
  return `export default ${JSON.stringify(cfg)};\n`;
}
