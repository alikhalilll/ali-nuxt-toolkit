import type { ApiProviderModuleOptions } from '../types/module-options';

export interface ResolvedApiProviderConfig {
  baseURL: string;
  defaultTimeoutMs: number;
  provideName: string;
  retry: ApiProviderModuleOptions['retry'];
}

export function createConfigTemplateContents(params: {
  options: ApiProviderModuleOptions;
  normalizedProvideName: string;
}): string {
  const { options, normalizedProvideName } = params;
  const cfg: ResolvedApiProviderConfig = {
    baseURL: options.baseURL,
    defaultTimeoutMs: options.defaultTimeoutMs ?? 20_000,
    provideName: normalizedProvideName,
    retry: options.retry,
  };
  return `export default ${JSON.stringify(cfg)};\n`;
}
