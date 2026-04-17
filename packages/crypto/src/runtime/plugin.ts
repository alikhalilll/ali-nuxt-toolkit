import { defineNuxtPlugin } from '#app';
import config from '#build/crypto-config.mjs';

import { createCryptoService } from '../core/create-service';

export default defineNuxtPlugin(async () => {
  const { passphrase, iterations, keyCacheSize, provideName } = config;

  if (!passphrase && (import.meta as ImportMeta & { dev?: boolean }).dev) {
    // eslint-disable-next-line no-console
    console.warn(
      `[@alikhalilll/nuxt-crypto] Missing passphrase — $${provideName} will throw when used.`
    );
  }

  const service = await createCryptoService({
    passphrase: String(passphrase).trim(),
    iterations,
    keyCacheSize,
  });

  return {
    provide: {
      [provideName]: service,
    },
  };
});
