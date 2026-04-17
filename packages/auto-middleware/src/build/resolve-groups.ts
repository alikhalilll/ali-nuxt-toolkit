import type { AutoMiddlewareOptions } from '../types';
import { unique } from '../utils';

/**
 * Expand any `@groupName` references inside each rule's `middlewares` array
 * against `options.groups`. Unknown group references throw at build time so
 * typos don't silently ship.
 */
export function resolveGroupReferences(
  middlewares: string[],
  groups: NonNullable<AutoMiddlewareOptions['groups']>
): string[] {
  const out: string[] = [];
  for (const entry of middlewares) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith('@')) {
      out.push(trimmed);
      continue;
    }
    const groupName = trimmed.slice(1);
    const group = groups[groupName];
    if (!group) {
      throw new Error(
        `[@alikhalilll/nuxt-auto-middleware] Unknown middleware group: "@${groupName}". ` +
          `Declare it under \`groups\` in the module options.`
      );
    }
    for (const m of group) {
      const t = m.trim();
      if (t) out.push(t);
    }
  }
  return unique(out);
}
