import { defineConfig } from 'tsdown';

/**
 * Build pipeline for `@alikhalilll/nuxt-api-provider`.
 *
 * Powered by rolldown via tsdown. tsdown adds `.d.ts` emission and exports-map
 * awareness on top; everything else (treeshake, code-splitting, transforms) is
 * pure rolldown.
 *
 * Notes:
 *   - `platform: 'neutral'` keeps the runtime/plugin bundle browser-safe — the
 *     Nuxt plugin runs in both client + server contexts.
 *   - `outExtensions: { js: '.mjs', dts: '.d.ts' }` decouples the JS and dts
 *     extensions: `.mjs` matches the existing `exports` map, while `.d.ts`
 *     stays the canonical type extension — Nuxt's `addTemplate` consumer
 *     types resolve a bare `dist/types/index` path which TypeScript expects
 *     to end at `.d.ts` (not `.d.mts`) when probing extensions in `bundler`
 *     moduleResolution.
 *   - Externals use the modern `deps.neverBundle` API; the deprecated top-level
 *     `external` triggers a tsdown warning.
 *   - `#build/...` virtual modules are Nuxt build-time virtuals; they MUST stay
 *     external so the plugin chunk leaves them as bare specifiers for Nuxt to
 *     resolve at app build time.
 */
export default defineConfig({
  entry: {
    module: 'src/module.ts',
    'core/index': 'src/core/index.ts',
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
      '#app',
      '#imports',
      '#build/api-provider-config.mjs',
      '#build/api-provider-handlers.mjs',
    ],
  },
});
