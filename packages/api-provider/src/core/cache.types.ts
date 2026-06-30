/**
 * Cache types — framework-agnostic. Loosely modelled on TanStack Query's
 * `staleTime` / `gcTime` semantics, adapted to an imperative fetch client.
 *
 * - `staleTime`  : how long a stored entry is considered fresh. Reads inside
 *                  this window return cached data with no network hit.
 * - `gcTime`     : how long a stale entry is kept in memory after its last
 *                  use. Reads inside the stale window return cached data and,
 *                  when `swr` is enabled, fire a background refetch.
 * - `swr`        : when stale, hand back cached data and silently refresh in
 *                  the background. Mirrors stale-while-revalidate.
 * - `dedupe`     : identical concurrent calls share a single in-flight
 *                  promise. Independent of `staleTime`/`gcTime`.
 */

/** Client-wide cache configuration. All fields optional — defaults applied. */
export interface CacheConfig {
  /** Master switch. Default `true`. */
  enabled?: boolean;
  /** Window during which cached data is considered fresh, in ms. Default `30_000`. */
  staleTime?: number;
  /** How long an entry survives after its last use, in ms. Default `300_000`. */
  gcTime?: number;
  /** When stale, return cached and refetch in the background. Default `true`. */
  swr?: boolean;
  /** Methods eligible for caching. Default `['GET', 'HEAD']`. */
  cacheableMethods?: readonly string[];
  /** Share in-flight promises across identical concurrent calls. Default `true`. */
  dedupe?: boolean;
  /** Upper bound on stored entries. Default `500`. */
  maxEntries?: number;
}

/** Per-call cache overrides. `false` disables caching for this call only. */
export interface CacheOptions extends Partial<CacheConfig> {
  /**
   * Explicit cache key. Wins over the auto-derived key. Strings are used as
   * given; arrays are deeply hashed in a stable, order-sensitive way.
   */
  key?: string | readonly unknown[];
  /**
   * Force the network even when fresh data exists. The response replaces the
   * cached entry on success. Equivalent to TanStack's `refetchQueries`.
   */
  refetch?: boolean;
}

/** One stored cache entry. */
export interface CacheEntry<T = unknown> {
  /** Parsed response body. `undefined` for 204/205. */
  data: T | undefined;
  /** Absolute ms epoch when this entry was stored. */
  storedAt: number;
  /** Absolute ms epoch at which the entry transitions from fresh → stale. */
  staleAt: number;
  /** Absolute ms epoch after which the entry is eligible for garbage collection. */
  expiresAt: number;
  /** HTTP status the entry was stored with (for debugging). */
  status: number;
}

/** Predicate for `cache.invalidate`. Receives key + entry, returns whether to drop. */
export type CachePredicate = (key: string, entry: CacheEntry) => boolean;

/** Serialised cache snapshot — stable shape for transport / persistence. */
export interface SerializedCache {
  /** Schema version. Bump when the shape changes. */
  v: 1;
  /** Insertion-ordered list of `[key, entry]` pairs. */
  entries: Array<[string, CacheEntry<unknown>]>;
}

/** Defaults applied when fields are missing from `CacheConfig`. */
export const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = Object.freeze({
  enabled: true,
  staleTime: 30_000,
  gcTime: 300_000,
  swr: true,
  cacheableMethods: Object.freeze(['GET', 'HEAD']) as readonly string[],
  dedupe: true,
  maxEntries: 500,
});

/** Merge a user `CacheConfig` over the defaults. Pure. */
export function resolveCacheConfig(input?: CacheConfig): Required<CacheConfig> {
  if (!input) return DEFAULT_CACHE_CONFIG;
  return {
    enabled: input.enabled ?? DEFAULT_CACHE_CONFIG.enabled,
    staleTime: input.staleTime ?? DEFAULT_CACHE_CONFIG.staleTime,
    gcTime: input.gcTime ?? DEFAULT_CACHE_CONFIG.gcTime,
    swr: input.swr ?? DEFAULT_CACHE_CONFIG.swr,
    cacheableMethods: input.cacheableMethods ?? DEFAULT_CACHE_CONFIG.cacheableMethods,
    dedupe: input.dedupe ?? DEFAULT_CACHE_CONFIG.dedupe,
    maxEntries: input.maxEntries ?? DEFAULT_CACHE_CONFIG.maxEntries,
  };
}
