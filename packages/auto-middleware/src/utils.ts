/** Stable, order-preserving dedupe. */
export function unique<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/**
 * Compile a glob pattern to a RegExp. Supports:
 * - `*`  → any run of characters except `/`
 * - `**` → any run of characters
 * - `?`  → any single character except `/`
 *
 * Anything else is treated literally.
 */
export function globToRegExp(pattern: string): RegExp {
  let re = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        re += '.*';
        i += 2;
      } else {
        re += '[^/]*';
        i += 1;
      }
      continue;
    }
    if (ch === '?') {
      re += '[^/]';
      i += 1;
      continue;
    }
    if (/[.+^${}()|[\]\\]/.test(ch!)) {
      re += '\\' + ch;
    } else {
      re += ch;
    }
    i += 1;
  }
  return new RegExp(`^${re}$`);
}
