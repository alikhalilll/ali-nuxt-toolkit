import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

const here = fileURLToPath(new URL('.', import.meta.url));
const r = (p: string) => resolve(here, p);

// Each entry becomes its own subpath import: `@alikhalilll/ui/<name>` →
// `dist/<name>.mjs`. The main entry re-exports everything for users who don't
// care about per-component installs.
export default defineConfig({
  resolve: {
    // Internal alias — mirrors the `@/*` path in tsconfig.json. Component source files
    // import shared utilities and cross-entry helpers via `@/utils` / `@/entries/...`
    // instead of long `../../../` relative chains.
    alias: { '@': here },
  },
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
      include: [
        'index.ts',
        'entries/**/index.ts',
        'entries/**/components/*.vue',
        'entries/**/components/*.ts',
        'entries/**/composables/*.ts',
        'entries/**/utils/*.ts',
        'utils/**/*.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    }),
  ],
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
