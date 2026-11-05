/**
 * Shape persistence — port of `skullet/lib/shapes.ts`.
 *
 * Two-tier store so skeletons survive both reloads (localStorage) and
 * same-session navigations (in-memory session map). The session map is the
 * primary read path — it always has the most recent shape, with the right
 * text and media still in place. localStorage is a fallback for first-time
 * visitors in a new tab; its entries are filler-only (identifying text has
 * been scrambled by `sampleFrom`).
 *
 * Separate schema version (`v: 4`) so entries from v2 (flat `CachedShape`)
 * and v3 (tree `StructuralShape`) in the existing `useSkeletonCache` can't
 * be read back as v4 — a mismatch auto-purges on read.
 *
 * Budgets borrowed from skullet:
 *   - Up to 50 entries total — LRU-evicts the oldest on write.
 *   - Up to 20 KB per entry — larger entries skip localStorage (session
 *     only); the console warns once per key.
 */

import { warnOnce } from './dev';

const STORAGE_KEY = 'a-skel:shapes';
const VERSION = 4;
const MAX_SHAPES = 50;
const MAX_LENGTH = 20_000;

type Stored = Record<string, string>;

/** The in-session store — never purged, lost on reload. */
const session = new Map<string, string>();

/** Save subscriptions by key — used to flush pending saves before a recall. */
const subscribers = new Map<string, Set<() => void>>();

/** Register a callback that saves the current shape for `key`. */
export function trackShape(key: string, save: () => void): () => void {
  let set = subscribers.get(key);
  if (!set) {
    set = new Set();
    subscribers.set(key, set);
  }
  set.add(save);
  return () => {
    const current = subscribers.get(key);
    if (!current) return;
    current.delete(save);
    if (current.size === 0) subscribers.delete(key);
  };
}

/** Run all registered saves for `key` immediately. */
export function flushShapes(key: string): void {
  const set = subscribers.get(key);
  if (!set) return;
  for (const fn of set) {
    try {
      fn();
    } catch {
      /* A single save callback throwing shouldn't break the flush. */
    }
  }
}

/**
 * Write a shape for `key`. Writes always update the session map; writes
 * larger than `MAX_LENGTH` skip localStorage (and log a one-time dev
 * warning); writes smaller mirror to localStorage with LRU eviction.
 */
export function rememberShape(key: string, serialized: string): void {
  session.set(key, serialized);
  if (serialized.length > MAX_LENGTH) {
    warnOnce(
      `shapes:too-large:${key}`,
      `<ASkeleton> shape for "${key}" is ${(serialized.length / 1024).toFixed(1)} KB (max ${MAX_LENGTH / 1024} KB) — kept in session memory only.`
    );
    return;
  }
  if (typeof localStorage === 'undefined') return;
  try {
    const current = read();
    current[key] = serialized;
    /* LRU eviction via key insertion order — JS objects preserve it. */
    const keys = Object.keys(current);
    while (keys.length > MAX_SHAPES) {
      const oldest = keys.shift()!;
      delete current[oldest];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, shapes: current }));
  } catch {
    /* Quota exceeded or privacy mode — fall back to session only. */
  }
}

/** Read a shape by key, session-first then localStorage. */
export function recallShape(key: string): string | null {
  const live = session.get(key);
  if (live !== undefined) return live;
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = read();
    return stored[key] ?? null;
  } catch {
    return null;
  }
}

/** Drop a shape from both tiers. Pass no key to wipe everything. */
export function forgetShapes(key?: string): void {
  if (key === undefined) {
    session.clear();
    subscribers.clear();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  session.delete(key);
  subscribers.delete(key);
  if (typeof localStorage === 'undefined') return;
  try {
    const current = read();
    delete current[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, shapes: current }));
  } catch {
    /* ignore */
  }
}

function read(): Stored {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { v?: number; shapes?: Stored };
    if (parsed.v !== VERSION || !parsed.shapes) {
      /* Stale schema — purge and start fresh so we never read v2/v3
       * entries as v4 strings. */
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return {};
    }
    return parsed.shapes;
  } catch {
    return {};
  }
}

/** Test-only. */
export function resetShapesForTest(): void {
  session.clear();
  subscribers.clear();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
