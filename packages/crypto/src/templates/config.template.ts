import type { CryptoModuleOptions } from '../types/module-options';

export interface ResolvedCryptoConfig {
  passphrase: string;
  iterations: number;
  keyCacheSize: number;
  provideName: string;
}

export function createConfigTemplateContents(params: {
  options: CryptoModuleOptions;
  normalizedProvideName: string;
}): string {
  const { options, normalizedProvideName } = params;
  const cfg: ResolvedCryptoConfig = {
    passphrase: options.passphrase,
    iterations: options.iterations ?? 100_000,
    keyCacheSize: options.keyCacheSize ?? 64,
    provideName: normalizedProvideName,
  };
  return `export default ${JSON.stringify(cfg)};\n`;
}
