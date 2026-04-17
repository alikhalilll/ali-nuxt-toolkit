import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    module: 'src/module.ts',
    'core/index': 'src/core/index.ts',
    'types/index': 'src/types/index.ts',
    'runtime/plugin': 'src/runtime/plugin.ts',
  },
  format: ['esm'],
  target: 'es2022',
  dts: {
    entry: {
      module: 'src/module.ts',
      'core/index': 'src/core/index.ts',
      'types/index': 'src/types/index.ts',
    },
  },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  external: [
    '@nuxt/kit',
    '@nuxt/schema',
    'nuxt',
    '#app',
    '#imports',
    '#build/crypto-config.mjs',
    'node:crypto',
  ],
});
