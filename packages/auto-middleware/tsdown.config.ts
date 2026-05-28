import { defineConfig } from 'tsdown';

/**
 * Build pipeline for `@alikhalilll/nuxt-auto-middleware`.
 *
 * Powered by rolldown via tsdown. See sibling `api-provider/tsdown.config.ts`
 * for the rationale on platform/fixedExtension/deps choices.
 */
export default defineConfig({
  entry: {
    module: 'src/module.ts',
    types: 'src/types.ts',
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
    neverBundle: ['@nuxt/kit', '@nuxt/schema', 'nuxt'],
  },
});
