import {
  DEFAULT_CACHE_CONFIG,
  resolveCacheConfig,
  type CacheConfig,
  type CacheEntry,
  type CachePredicate,
  type SerializedCache,
} from './cache.types';

/**
 * Framework-agnostic request cache.
 *
 * Backed by a single `Map` that doubles as an insertion-ordered LRU: every
 * read or write re-inserts the key, so iteration order matches recency.
 * Eviction kicks in lazily — on `set` when `size > maxEntries`, and on `get`
 * when a fetched entry has crossed its `expiresAt` threshold.
 *
 * Dependency surface is intentionally tiny: `Date.now()` and the standard
 * `Map`. No DOM, no Nuxt, no globals — safe in Node, Bun, browsers, and
 * Nitro alike.
 */
export class ApiCache {
  private readonly config: Required<CacheConfig>;
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(config?: CacheConfig) {
    this.config = resolveCacheConfig(config);
  }

  /** Read-only view of the merged config. */
  getConfig(): Required<CacheConfig> {
    return this.config;
  }

  /**
   * Look up an entry. Returns `undefined` for misses and for entries whose
   * `expiresAt` has elapsed (which are removed as a side effect). Successful
   * reads bump the entry to the most-recently-used position.
   */
  get<T>(key: string): CacheEntry<T> | undefined {
    const entry = this.entries.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    // Bump recency.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry;
  }

  /** Insert or replace an entry. Triggers LRU eviction if over budget. */
  set<T>(key: string, data: T | undefined, status: number): CacheEntry<T> {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      storedAt: now,
      staleAt: now + this.config.staleTime,
      expiresAt: now + this.config.gcTime,
      status,
    };
    // Bump recency by re-inserting.
    this.entries.delete(key);
    this.entries.set(key, entry as CacheEntry<unknown>);
    this.evictIfNeeded();
    return entry;
  }

  /** Remove a single entry. Returns `true` if something was deleted. */
  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  /** Drop every stored entry. In-flight requests are not affected. */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Drop every entry that matches the predicate. Returns the number of
   * entries removed. Useful in error/response interceptors to invalidate
   * caches after a mutation:
   *
   *   client.cache.invalidate((key) => key.startsWith('GET:') && ...)
   */
  invalidate(predicate: CachePredicate): number {
    let count = 0;
    for (const [key, entry] of this.entries) {
      if (predicate(key, entry)) {
        this.entries.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Iterate over `[key, entry]` pairs. */
  entriesIter(): IterableIterator<[string, CacheEntry<unknown>]> {
    return this.entries.entries();
  }

  /** Current entry count. */
  get size(): number {
    return this.entries.size;
  }

  /**
   * Serialise the store to a transport-friendly snapshot. Only stored
   * entries are included; in-flight promises are dropped because they
   * cannot cross the wire.
   */
  serialize(): SerializedCache {
    return { v: 1, entries: Array.from(this.entries.entries()) };
  }

  /**
   * Restore a previously-serialised snapshot. Entries whose `expiresAt`
   * has already elapsed are skipped. Existing entries with the same key
   * are replaced (last-write-wins).
   */
  hydrate(snapshot: SerializedCache | null | undefined): void {
    if (!snapshot || snapshot.v !== 1 || !Array.isArray(snapshot.entries)) return;
    const now = Date.now();
    for (const [key, entry] of snapshot.entries) {
      if (!entry || now >= entry.expiresAt) continue;
      this.entries.delete(key);
      this.entries.set(key, entry);
    }
    this.evictIfNeeded();
  }

  // ---------------------------------------------------------------------------
  // In-flight registry — shared promises for identical concurrent calls. Kept
  // separate from stored entries because a pending request has no `data` yet
  // and shouldn't appear in `serialize()` output.
  // ---------------------------------------------------------------------------

  /** Look up an in-flight promise. */
  getInFlight<T>(key: string): Promise<T | undefined> | undefined {
    return this.inFlight.get(key) as Promise<T | undefined> | undefined;
  }

  /** Register an in-flight promise. */
  setInFlight<T>(key: string, p: Promise<T | undefined>): void {
    this.inFlight.set(key, p as Promise<unknown>);
  }

  /** Remove an in-flight promise. Call from both the resolve and reject paths. */
  clearInFlight(key: string): void {
    this.inFlight.delete(key);
  }

  // ---------------------------------------------------------------------------

  private evictIfNeeded(): void {
    const max = this.config.maxEntries;
    if (max <= 0) return;
    while (this.entries.size > max) {
      // `Map` iteration is insertion-ordered, so the first key is the LRU.
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.delete(oldest.value);
    }
  }
}

/** Whether an entry is still within its fresh window. */
export function isFresh(entry: CacheEntry, now: number = Date.now()): boolean {
  return now < entry.staleAt;
}

/** Whether an entry has crossed its GC horizon. */
export function isExpired(entry: CacheEntry, now: number = Date.now()): boolean {
  return now >= entry.expiresAt;
}

export { DEFAULT_CACHE_CONFIG, resolveCacheConfig };
