export { createApiClient } from './create-client';
export {
  ApiError,
  isApiError,
  normalizeErrorPayload,
  type ApiErrorDetails,
  type IError,
} from './error';
export { joinUrl } from './url';
export { buildQueryString } from './query';
export { normalizeHeaders, dropContentType } from './headers';
export { encodeBody, shouldOmitBody } from './body';
export { safeParseJson } from './json';
export { combineSignals } from './abort';
export { DEFAULT_RETRY, resolveRetry, shouldRetryStatus, computeDelay, sleep } from './retry';
export { createXhrFetch } from './xhr-fetch';

// Cache surface — framework-agnostic.
export { ApiCache, isFresh, isExpired } from './cache';
export { DEFAULT_CACHE_CONFIG, resolveCacheConfig } from './cache.types';
export { buildCacheKey } from './cache-key';

export type {
  ApiClientConfig,
  ApiProviderClient,
  JsonBody,
  ProgressPhase,
  RequestBody,
  RequestContext,
  RequestInterceptor,
  RequestOptions,
  RequestProgress,
  ResponseContext,
  ResponseInterceptor,
  ErrorInterceptor,
  RetryOptions,
  UnknownRecord,
} from './types';

export type {
  CacheConfig,
  CacheOptions,
  CacheEntry,
  CachePredicate,
  SerializedCache,
} from './cache.types';
