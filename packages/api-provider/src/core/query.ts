/**
 * Serialise an object to a `URLSearchParams` query string.
 *
 * - `null` / `undefined` values are skipped.
 * - Empty strings are skipped.
 * - Arrays are repeated: `{ tag: ['a','b'] }` → `tag=a&tag=b`.
 * - Other values are coerced via `String()`.
 */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const q = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        if (typeof item === 'string' && item.trim() === '') continue;
        q.append(key, String(item));
      }
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') continue;
    q.append(key, String(value));
  }
  return q.toString();
}
