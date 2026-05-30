import fs from 'node:fs';
import path from 'node:path';

/**
 * Shared tsdown config for the `@alikhalilll/a-*` component packages. Each
 * package's `tsdown.config.ts` becomes:
 *
 *   import { defineConfig } from 'tsdown';
 *   import Vue from 'unplugin-vue/rolldown';
 *   import { componentTsdownConfig } from '../tsdown.shared.mjs';
 *   export default defineConfig(componentTsdownConfig({ plugins: [Vue()], extraExternals: ['reka-ui'] }));
 *
 * Entries are derived from the package's own `exports` map (every subpath whose
 * `import.default` is a `./dist/<x>.js` → entry `<x>` from source `<x>.ts`), so
 * this is generic — no hardcoded `index` / `nuxt` / `resolver` list. The Vue
 * plugin is passed in (not imported here) so `unplugin-vue` resolves from each
 * package's own node_modules.
 *
 * `dts: { vue: true }` lets tsdown's `rolldown-plugin-dts` (wired to vue-tsc)
 * emit a SINGLE rolled-up `.d.ts` per entry in the same pass as the runtime —
 * components are inlined as `DefineComponent`, no `.vue` token survives in any
 * specifier. That avoids both Volar's `.vue`-token routing (the historic source
 * of "no go-to-def" in consumers) and the brittle per-file dts post-processing
 * chain (`fix-dts-imports`, `emit-entry-dcts`, flatten) the build used to need.
 * The remaining `strip-vls-wrapper` step removes the `__VLS_WithSlots` artefact
 * unchanged.
 *
 * `@nuxt/kit` + `@nuxt/schema` must be in `neverBundle` because @nuxt/schema's
 * published dts has malformed re-exports (autoprefixer/cssnano/h3) that crash
 * any dts rollup that tries to inline them — keeping them external means
 * `nuxt/index.d.ts` references them via `import(...)` instead.
 */
// `@alikhalilll/a-ui-base` is intentionally NOT in this list — it's an internal-only
// foundation, so tsdown bundles its JS/types into every component's dist (and each
// component's `styles.src.css` @imports its tokens.css/theme.css so the CSS bundles too).
const COMMON_EXTERNALS = [
  'vue',
  '@vueuse/core',
  '@nuxt/kit',
  '@nuxt/schema',
  'unplugin-vue-components',
];

/** `{ index: 'src/index.ts', 'nuxt/index': 'src/nuxt/index.ts', … }` derived from exports. */
function entriesFromExports() {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const entry = {};
  for (const cond of Object.values(pkg.exports ?? {})) {
    const def = cond && typeof cond === 'object' ? cond.import?.default : undefined;
    if (typeof def !== 'string' || !def.endsWith('.js')) continue;
    const key = def.replace(/^\.\/dist\//, '').replace(/\.js$/, '');
    entry[key] = `src/${key}.ts`;
  }
  return entry;
}

export function componentTsdownConfig({ plugins, extraExternals = [] }) {
  return {
    entry: entriesFromExports(),
    format: ['esm', 'cjs'],
    outDir: 'dist',
    deps: { neverBundle: [...COMMON_EXTERNALS, ...extraExternals] },
    platform: 'neutral',
    target: 'es2022',
    sourcemap: true,
    treeshake: true,
    hash: false,
    outputOptions: { chunkFileNames: '_chunks/[name].js' },
    dts: { vue: true },
    plugins,
    exports: false,
    clean: false,
  };
}
