/**
 * `sampleFrom(data)` + `fill(text)` — same shape, no sensitive content.
 *
 * Port of `/dev.ts:24-37` (`sampleFrom`) and
 * `the upstream library/snapshot.ts:21-22` (`fill`). Used by the dev warning that
 * suggests a `:sample` prop when data is bound but no sample exists —
 * the engine runs the user's real data through `sampleFrom` and logs a
 * pastable literal.
 *
 * Design goals:
 *   - Preserve array lengths + object keys so the shape of the loading
 *     skeleton stays identical to the loaded state.
 *   - Strip identifying content from strings (letters → `x`, digits → `0`)
 *     so the suggested sample is safe to paste into a shared playground.
 *   - Pass URL-like strings through as empty (they'd otherwise fetch during
 *     the ghost measurement).
 *   - Pass `Date` instances through (the walker reads `.toString()`-shaped
 *     content; a scrambled timestamp would misreport layout size).
 */

const URL_LIKE = /^(https?:|\/|data:|blob:)/;

/** Replace letters with `x`/`X`, digits with `0`; preserve case + punctuation. */
export function fill(value: string): string {
  return value.replace(/[A-Z]/g, 'X').replace(/[a-z]/g, 'x').replace(/\d/g, '0');
}

/**
 * Walk `data` recursively and produce a value with the same shape — the
 * identical set of keys, array lengths, nesting depth — with every string
 * replaced by its `fill()`-ed stand-in (or by `""` when URL-like).
 */
export function sampleFrom(data: unknown): unknown {
  if (typeof data === 'string') return URL_LIKE.test(data) ? '' : fill(data);
  if (Array.isArray(data)) return data.map(sampleFrom);
  if (data instanceof Date) return data;
  if (data && typeof data === 'object') {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, sampleFrom(value)]));
  }
  return data;
}
