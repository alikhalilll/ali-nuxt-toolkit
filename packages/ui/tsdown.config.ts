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
  entry: {
    index: 'index.ts',
    'tell-input': 'entries/tell-input/index.ts',
    input: 'entries/input/index.ts',
    popover: 'entries/popover/index.ts',
    drawer: 'entries/drawer/index.ts',
    'responsive-popover': 'entries/responsive-popover/index.ts',
    utils: 'utils/index.ts',
    nuxt: 'nuxt/index.ts',
    resolver: 'resolver/index.ts',
  },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  // Mirrors the `@/` alias in tsconfig.json so `@/utils` / `@/entries/...`
  // resolve during the bundle. tsdown forwards this to rolldown.
  alias: {
    '@': new URL('.', import.meta.url).pathname,
  },
  // Stay flat: every dep that a consumer is expected to bring is external.
  // Mirrors `vite.config.ts` exactly so chunk layout doesn't drift.
  external: [
    'vue',
    '@vueuse/core',
    'reka-ui',
    'vaul-vue',
    'libphonenumber-js',
    'libphonenumber-js/examples.mobile.json',
    'lucide-vue-next',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    // Consumer brings these when they use the matching subpath; do not bundle.
    '@nuxt/kit',
    'unplugin-vue-components',
  ],
  platform: 'neutral',
  target: 'es2022',
  sourcemap: true,
  treeshake: true,
  // tsdown handles dts emission via rolldown-plugin-dts under the hood.
  // `vue: true` flips on @vue/language-tools integration for SFC types.
  // `declarationMap: true` emits `.d.ts.map` files whose `sources` reference
  // the original `.vue` / `.ts` — this is what enables Cmd+Click on a prop
  // in a consumer's template to walk into the actual SFC source.
  dts: { vue: true, compilerOptions: { declarationMap: true } },
  plugins: [Vue()],
  // We manage `exports` in package.json explicitly. tsdown's auto-export
  // generator would otherwise overwrite our subpath map.
  exports: false,
  clean: false,
});
