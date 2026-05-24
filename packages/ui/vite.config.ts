import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const here = fileURLToPath(new URL('.', import.meta.url));
const r = (p: string) => resolve(here, p);

// Each entry becomes its own subpath import: `@alikhalilll/ui/<name>` →
// `dist/<name>.mjs`. The main entry re-exports everything for users who don't
// care about per-component installs.
//
// .d.ts files are NOT emitted by Vite — see `pnpm build:types`, which runs
// vue-tsc 3.x directly + `scripts/build/fix-dts-imports.mjs` to rewrite the
// `@/*` alias in emitted declarations to sibling-relative paths. vite-plugin-dts
// was dropped because its vue-tsc 2.x output wrapped SFC defaults in
// `__VLS_WithTemplateSlots<…>`, an intersection Volar in consumer projects
// fails to peer through to recover prop types — killing template prop
// autocomplete on `<ATellInput :|`. vue-tsc 3.x emits a plain
// `DefineComponent<__VLS_PublicProps, …>` that Volar reads directly.
export default defineConfig({
  resolve: {
    // Internal alias — mirrors the `@/*` path in tsconfig.json. Component source files
    // import shared utilities and cross-entry helpers via `@/utils` / `@/entries/...`
    // instead of long `../../../` relative chains.
    alias: { '@': here },
  },
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: r('index.ts'),
        'tell-input': r('entries/tell-input/index.ts'),
        input: r('entries/input/index.ts'),
        popover: r('entries/popover/index.ts'),
        drawer: r('entries/drawer/index.ts'),
        'responsive-popover': r('entries/responsive-popover/index.ts'),
        utils: r('utils/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
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
      ],
      output: {
        entryFileNames: '[name].mjs',
        chunkFileNames: 'chunks/[name]-[hash].mjs',
        assetFileNames: (asset) => (asset.name === 'style.css' ? 'styles.css' : (asset.name ?? '')),
      },
    },
    sourcemap: true,
    target: 'es2022',
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
