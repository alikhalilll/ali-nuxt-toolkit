import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';

let servicePromise: ReturnType<typeof createCryptoService> | null = null;

export function useServerCrypto() {
  if (!servicePromise) {
    servicePromise = createCryptoService({
      passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? 'dev-only-passphrase',
      iterations: 10_000,
    });
  }
  return servicePromise;
}
