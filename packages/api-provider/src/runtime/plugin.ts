import { defineNuxtPlugin, useState } from '#app';
import config from '#build/api-provider-config.mjs';
import {
  onErrorHandler,
  onRequestHandler,
  onSuccessHandler,
} from '#build/api-provider-handlers.mjs';

import { createApiClient } from '../core/create-client';
import type { SerializedCache } from '../core/cache.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineNuxtPlugin((nuxtApp: any) => {
  const client = createApiClient({
    baseURL: config.baseURL || '',
    timeoutMs: config.defaultTimeoutMs ?? 20_000,
    retry: config.retry,
    cache: config.cache ?? undefined,
  });

  if (typeof onRequestHandler === 'function') client.useRequest(onRequestHandler);
  if (typeof onSuccessHandler === 'function') client.useResponse(onSuccessHandler);
  if (typeof onErrorHandler === 'function') client.useError(onErrorHandler);

  const key = config.provideName || 'apiProvider';

  // SSR ↔ CSR cache hydration. Opt-in via `cache.hydrate: true` in the module
  // options. `useState` is the Nuxt-supported channel for cross-render state
  // — the server writes the serialised cache into the payload, the client
  // reads it back during plugin init. This is the only Nuxt-specific block in
  // the cache path; the cache itself stays framework-agnostic.
  if (config.hydrate) {
    const stateKey = `apiProvider:${key}:cache`;
    const state = useState<SerializedCache | null>(stateKey, () => null);

    if (import.meta.server) {
      // Wait until rendering is done so every SSR fetch has landed in the cache.
      nuxtApp.hook('app:rendered', () => {
        state.value = client.cache.serialize();
      });
    } else if (state.value) {
      client.cache.hydrate(state.value);
    }
  }

  return { provide: { [key]: client } };
});
