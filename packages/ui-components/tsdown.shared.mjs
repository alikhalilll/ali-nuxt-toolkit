/**
 * Shared tsdown config for every `@alikhalilll/a-*` component package. They all
 * bundle the same three entries (`.`, `./nuxt`, `./resolver`) as ESM+CJS with
 * identical options; only the externalized deps differ. Each package's
 * `tsdown.config.ts` becomes:
 *
 *   import { defineConfig } from 'tsdown';
 *   import Vue from 'unplugin-vue/rolldown';
 *   import { componentTsdownConfig } from '../tsdown.shared.mjs';
 *   export default defineConfig(componentTsdownConfig({ plugins: [Vue()], extraExternals: ['reka-ui'] }));
 *
 * Plain `.mjs` (not `.ts`) so tsdown's native config loader can import it
 * without a `--config-loader` flag. The Vue plugin is passed in (not imported
 * here) so `unplugin-vue` resolves from each package's own node_modules.
 * `dts: false` — declarations come from the vue-tsc source-mirror pipeline.
 * `@` aliases to the package root via `process.cwd()` (tsdown runs per-package).
 */
const COMMON_EXTERNALS = [
  'vue',
  '@vueuse/core',
  '@alikhalilll/a-ui-base',
  '@nuxt/kit',
  'unplugin-vue-components',
];

export function componentTsdownConfig({ plugins, extraExternals = [] }) {
  return {
    entry: {
      index: 'index.ts',
      'nuxt/index': 'nuxt/index.ts',
      'resolver/index': 'resolver/index.ts',
    },
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
