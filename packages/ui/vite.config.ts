import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(here, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
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
        assetFileNames: (asset) => (asset.name === 'style.css' ? 'styles.css' : (asset.name ?? '')),
      },
    },
    sourcemap: true,
    target: 'es2022',
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
