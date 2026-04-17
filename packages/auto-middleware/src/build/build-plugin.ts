import { addTemplate } from '@nuxt/kit';

/**
 * Emit the runtime dispatcher plugin. At navigation time it:
 * 1. Reads the destination page's layout (falling back to `default`).
 * 2. Walks the compiled rules and collects middleware names whose patterns match.
 * 3. Appends any page-meta-declared extras (unless disabled).
 * 4. Lazy-imports each middleware from `~/middleware/<name>.ts` and runs it in order.
 *
 * Return value semantics:
 * - `false`        → stop the chain, let navigation continue.
 * - `true` / void  → continue with the next middleware.
 * - anything else  → treated as a navigation result, stops the chain.
 */
export function buildDispatcherPlugin(params: {
  allMiddlewares: string[];
  mapFilename: string;
  debug: boolean;
  pageMetaField: string | false;
}) {
  const { allMiddlewares, mapFilename, debug, pageMetaField } = params;

  const loaderCases = allMiddlewares
    .map(
      (name) =>
        `case ${JSON.stringify(name)}: { const mod = await import('~/middleware/${name}'); return (mod as { default?: MWFn }).default; }`
    )
    .join('\n    ');

  const metaFieldJson = JSON.stringify(pageMetaField);

  return addTemplate({
    filename: 'auto-middleware/plugin.ts',
    getContents: () => `
import { defineNuxtPlugin, addRouteMiddleware, callWithNuxt, useNuxtApp } from '#app';
import { rules } from '#build/${mapFilename}';

type MWFn = (to: any, from: any) => unknown | Promise<unknown>;

const DEBUG = ${JSON.stringify(debug)};
const META_FIELD: string | false = ${metaFieldJson};

// Re-hydrate regex objects (serialized as { patterns: string[] }).
const compiledRules: Array<{ regex: RegExp[]; middlewares: string[] }> = rules.map((r: { patterns: string[]; middlewares: string[] }) => ({
  regex: r.patterns.map((p) => new RegExp(p)),
  middlewares: r.middlewares,
}));

async function loadMiddleware(name: string): Promise<MWFn | undefined> {
  switch (name) {
    ${loaderCases}
    default:
      return undefined;
  }
}

function log(...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[auto-middleware]', ...args);
  }
}

function resolveMiddlewaresForLayout(layout: string): string[] {
  const out: string[] = [];
  for (const rule of compiledRules) {
    if (rule.regex.some((r) => r.test(layout))) {
      for (const m of rule.middlewares) {
        if (!out.includes(m)) out.push(m);
      }
    }
  }
  return out;
}

export default defineNuxtPlugin(() => {
  addRouteMiddleware('auto-middleware-dispatch', async (to, from) => {
    const pageMeta = to.matched?.[to.matched.length - 1]?.meta as
      | { layout?: string | false; skipAutoMiddleware?: boolean; [k: string]: unknown }
      | undefined;

    if (pageMeta?.layout === false) return;
    if (pageMeta?.skipAutoMiddleware === true) return;

    const layout =
      typeof pageMeta?.layout === 'string' && pageMeta.layout.length > 0
        ? pageMeta.layout
        : 'default';

    const names = resolveMiddlewaresForLayout(layout);

    if (META_FIELD && pageMeta && Array.isArray(pageMeta[META_FIELD])) {
      for (const extra of pageMeta[META_FIELD] as unknown[]) {
        if (typeof extra === 'string' && extra && !names.includes(extra)) {
          names.push(extra);
        }
      }
    }

    if (names.length === 0) return;

    log('layout:', layout, '→', names);

    const nuxtApp = useNuxtApp();
    for (const name of names) {
      const fn = await loadMiddleware(name);
      if (typeof fn !== 'function') {
        log('skip (not found):', name);
        continue;
      }
      const res = await callWithNuxt(nuxtApp, fn as (to: any, from: any) => any, [to, from]);
      if (res === false) {
        log(name, '→ false (stop)');
        return;
      }
      if (res === true || res === undefined) {
        continue;
      }
      log(name, '→ navigation result (stop)');
      return res;
    }
  }, { global: true });
});
`,
  });
}
