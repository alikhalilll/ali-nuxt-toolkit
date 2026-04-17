import { defineNuxtPlugin } from '#app';
import config from '#build/api-provider-config.mjs';
import {
  onErrorHandler,
  onRequestHandler,
  onSuccessHandler,
} from '#build/api-provider-handlers.mjs';

import { createApiClient } from '../core/create-client';

export default defineNuxtPlugin(() => {
  const client = createApiClient({
    baseURL: config.baseURL || '',
    timeoutMs: config.defaultTimeoutMs ?? 20_000,
    retry: config.retry,
  });

  if (typeof onRequestHandler === 'function') client.useRequest(onRequestHandler);
  if (typeof onSuccessHandler === 'function') client.useResponse(onSuccessHandler);
  if (typeof onErrorHandler === 'function') client.useError(onErrorHandler);

  const key = config.provideName || 'apiProvider';
  return { provide: { [key]: client } };
});
