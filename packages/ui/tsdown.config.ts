import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';

// Bundles each subpath of `@alikhalilll/ui` into a separate ESM + CJS bundle
// and a single canonical `.d.ts` per entry. The `dts.vue` option enables
// SFC-aware declaration emission via rolldown-plugin-dts — no `__VLS_WithSlots`
// wart, no `@/` alias leakage, no `from '..'` parent-barrel. Replaces the
// hand-rolled vite + vue-tsc + fix-dts-imports + validate-dts chain.
//
// `vue-tsc --noEmit -p tsconfig.json` stays in `scripts.typecheck` as the
// type-correctness gate; tsdown handles emission.
export default defineConfig({
  // Each subpath gets its own folder under `dist/<subpath>/index.{js,cjs,d.ts,d.cts}`
  // — a layout readers can skim (one folder per exports key) instead of a flat
  // soup of 30+ files at the dist root. The package.json `exports` map mirrors
  // these paths verbatim.
  entry: {
    index: 'index.ts',
    'tell-input/index': 'entries/tell-input/index.ts',
    'input/index': 'entries/input/index.ts',
    'popover/index': 'entries/popover/index.ts',
    'drawer/index': 'entries/drawer/index.ts',
    'responsive-popover/index': 'entries/responsive-popover/index.ts',
    'utils/index': 'utils/index.ts',
    'nuxt/index': 'nuxt/index.ts',
    'resolver/index': 'resolver/index.ts',
  },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  // Mirrors the `@/` alias in tsconfig.json so `@/utils` / `@/entries/...`
  // resolve during the bundle. tsdown forwards this to rolldown.
  alias: {
    '@': new URL('.', import.meta.url).pathname,
  },
  // Stay flat: every dep that a consumer is expected to bring is external.
  // Mirrors `vite.config.ts` exactly so chunk layout doesn't drift. Uses the
  // modern `deps.neverBundle` API — top-level `external` is deprecated in
  // tsdown 0.22+.
  deps: {
    neverBundle: [
      'vue',
      '@vueuse/core',
      'reka-ui',
      'vaul-vue',
      'libphonenumber-js',
      'libphonenumber-js/examples.mobile.json',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      // Consumer brings these when they use the matching subpath; do not bundle.
      '@nuxt/kit',
      'unplugin-vue-components',
    ],
  },
  platform: 'neutral',
  target: 'es2022',
  sourcemap: true,
  treeshake: true,
  // Deterministic chunk names — no rolldown content hash. Each shared chunk
  // lives under `dist/_chunks/` (underscore prefix signals "internal", same
  // convention used by vite/rollup app builds) so they're visually separated
  // from the per-subpath entry folders. We deliberately do NOT override
  // `entryFileNames` here — tsdown computes that per-format (`.js` for ESM
  // chunks, `.cjs` for CJS chunks) using the `outExtensions` defaults, and
  // overriding it forces all formats to share one extension which silently
  // drops the CJS output.
  hash: false,
  outputOptions: {
    chunkFileNames: '_chunks/[name].js',
  },
  // Declaration emission is handled separately by `vue-tsc` (see `build:dts`)
  // which produces a per-source mirror under `dist/runtime/` — one `.d.ts` per
  // `.vue` / `.ts` source file, alongside the original source copied via
  // `build:copy-sources`. This mirror pattern is what gives consumer IDEs full
  // Cmd+Click navigation into the actual `.vue` source (via the matching
  // `.d.ts.map`), matching the proven `shadcn-vue` / Nuxt-module convention.
  //
  // We tried tsdown's bundled `dts: { vue: true }` earlier — it produced a
  // single flat `.d.ts` per entry, which Volar resolved but couldn't navigate
  // into. The mirror pattern fixes that without giving up the per-entry JS
  // bundles tsdown still emits below.
  dts: false,
  plugins: [Vue()],
  // We manage `exports` in package.json explicitly. tsdown's auto-export
  // generator would otherwise overwrite our subpath map.
  exports: false,
  clean: false,
});
