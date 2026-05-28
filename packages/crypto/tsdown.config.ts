import { defineConfig } from 'tsdown';

/**
 * Build pipeline for `@alikhalilll/nuxt-crypto`.
 *
 * Powered by rolldown via tsdown. See sibling `api-provider/tsdown.config.ts`
 * for the rationale on platform/fixedExtension/deps choices — all four packages
 * follow the same shape so the pipeline behaves identically across them.
 */
export default defineConfig({
  entry: {
    module: 'src/module.ts',
    'core/index': 'src/core/index.ts',
    'server/index': 'src/server/index.ts',
    'types/index': 'src/types/index.ts',
    'runtime/plugin': 'src/runtime/plugin.ts',
  },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  outExtensions: () => ({ js: '.mjs', dts: '.d.ts' }),
  sourcemap: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  dts: true,
  exports: false,
  deps: {
    neverBundle: [
      '@nuxt/kit',
      '@nuxt/schema',
      'nuxt',
      'h3',
      '#app',
      '#imports',
      '#build/crypto-config.mjs',
      'node:crypto',
    ],
  },
});
