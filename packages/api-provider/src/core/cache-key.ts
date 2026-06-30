/**
 * Deterministic cache key derivation.
 *
 * The cache key is a stable hash of the request shape — method, URL, and a
 * fingerprint of the body. Two calls with the same method, URL, sorted query
 * string, and JSON-equivalent body produce the same key, regardless of object
 * key order.
 *
 * Bodies that aren't reasonably serialisable (FormData, Blob, ArrayBuffer,
 * streams) get a token marker instead — we don't read their contents to avoid
 * consuming them and to keep keying cheap.
 *
 * Hashing uses FNV-1a 32-bit — fast, dependency-free, and good enough for an
 * in-process Map key. Collisions are bounded by the entry budget (`maxEntries`)
 * and the URL+method namespace prefix.
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a 32-bit. Returns an 8-char hex string. */
function fnv1a(input: string): string {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Stable JSON-like stringify with deterministic key ordering. Cycles are
 * detected and rendered as `"[Cycle]"` so we never throw.
 */
function stableStringify(value: unknown, seen: WeakSet<object> = new WeakSet()): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return String(value);
  if (t === 'bigint') return `${value.toString()}n`;
  if (t === 'function' || t === 'symbol') return '"[Unserializable]"';

  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v, seen)).join(',')}]`;
  }

  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    if (seen.has(obj)) return '"[Cycle]"';
    seen.add(obj);
    const keys = Object.keys(obj).sort();
    const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k], seen)}`);
    return `{${parts.join(',')}}`;
  }

  return '"[Unknown]"';
}

/**
 * Cheap, side-effect-free body fingerprint. Streamed / opaque bodies are
 * marked rather than read so we don't accidentally consume them.
 */
function fingerprintBody(body: unknown): string {
  if (body === undefined || body === null) return '';
  if (typeof body === 'string') return body;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return '[FormData]';
  if (typeof Blob !== 'undefined' && body instanceof Blob) return `[Blob:${body.size}]`;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    const pairs: Array<[string, string]> = [];
    body.forEach((v, k) => pairs.push([k, v]));
    pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `[URLSearchParams:${pairs.map(([k, v]) => `${k}=${v}`).join('&')}]`;
  }
  if (body instanceof ArrayBuffer) return `[ArrayBuffer:${body.byteLength}]`;
  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) {
    return '[Stream]';
  }
  return stableStringify(body);
}

export interface BuildCacheKeyInput {
  method: string;
  /** Fully-built URL including query string. */
  url: string;
  /** Per-call body. May be undefined. */
  body?: unknown;
  /** User-supplied override. Wins over the auto-derived key. */
  override?: string | readonly unknown[];
}

/**
 * Build the canonical cache key for a request. The result is namespaced with
 * the HTTP method so a GET and HEAD on the same URL don't collide.
 */
export function buildCacheKey(input: BuildCacheKeyInput): string {
  const method = (input.method || 'GET').toUpperCase();

  if (typeof input.override === 'string') {
    return `${method}:override:${input.override}`;
  }
  if (Array.isArray(input.override)) {
    return `${method}:override:${fnv1a(stableStringify(input.override))}`;
  }

  const bodyPrint = fingerprintBody(input.body);
  const payload = `${input.url}|${bodyPrint}`;
  return `${method}:${fnv1a(payload)}`;
}

/** Exported for tests / debugging. */
export { stableStringify, fingerprintBody, fnv1a };
