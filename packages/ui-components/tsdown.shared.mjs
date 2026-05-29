import fs from 'node:fs';
import path from 'node:path';

/**
 * Shared tsdown config for the `@alikhalilll/a-*` component packages. They all
 * bundle to ESM+CJS with identical options; only the externalized deps differ.
 * Each package's `tsdown.config.ts` becomes:
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
 * package's own node_modules. `dts: false` — declarations come from vue-tsc.
 */
const COMMON_EXTERNALS = [
  'vue',
  '@vueuse/core',
  '@alikhalilll/a-ui-base',
  '@nuxt/kit',
  'unplugin-vue-components',
];

/** `{ index: 'index.ts', 'nuxt/index': 'nuxt/index.ts', … }` derived from exports. */
function entriesFromExports() {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const entry = {};
  for (const cond of Object.values(pkg.exports ?? {})) {
    const def = cond && typeof cond === 'object' ? cond.import?.default : undefined;
    if (typeof def !== 'string' || !def.endsWith('.js')) continue;
    const key = def.replace(/^\.\/dist\//, '').replace(/\.js$/, '');
    entry[key] = `${key}.ts`;
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
    dts: false,
    plugins,
    exports: false,
    clean: false,
  };
}
