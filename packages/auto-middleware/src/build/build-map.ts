import { addTemplate } from '@nuxt/kit';

import type { AutoMiddlewareOptions } from '../types';
import { globToRegExp, unique } from '../utils';
import { resolveGroupReferences } from './resolve-groups';

/** A single compiled rule — each pattern stored as a RegExp source string. */
export interface CompiledRule {
  patterns: string[];
  middlewares: string[];
}

/**
 * Compile the user's rules into a list of `{ patterns, middlewares }` entries
 * ready for runtime matching. Returns the generated template metadata and the
 * union of all middleware names (used to generate a typed registry).
 */
export function buildMap(options: AutoMiddlewareOptions) {
  const groups = options.groups ?? {};
  const compiled: CompiledRule[] = [];

  for (const rule of options.rules) {
    const middlewares = resolveGroupReferences(rule.middlewares, groups);
    if (middlewares.length === 0) continue;

    const patterns = rule.layouts.map((layout) =>
      layout instanceof RegExp ? layout.source : globToRegExp(layout).source
    );

    compiled.push({ patterns, middlewares });
  }

  const allMiddlewares = unique(compiled.flatMap((r) => r.middlewares));

  const mapTpl = addTemplate({
    filename: 'auto-middleware/map.mjs',
    getContents: () => `export const rules = ${JSON.stringify(compiled, null, 2)};\n`,
  });

  return { compiled, allMiddlewares, mapTpl };
}
