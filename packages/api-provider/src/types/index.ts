export type { ApiProviderModuleOptions } from './module-options';

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
} from '../core/types';

export type {
  CacheConfig,
  CacheOptions,
  CacheEntry,
  CachePredicate,
  SerializedCache,
} from '../core/cache.types';

export { ApiCache, isFresh, isExpired } from '../core/cache';
export { DEFAULT_CACHE_CONFIG } from '../core/cache.types';
export { buildCacheKey } from '../core/cache-key';

export { ApiError, isApiError, type ApiErrorDetails, type IError } from '../core/error';
