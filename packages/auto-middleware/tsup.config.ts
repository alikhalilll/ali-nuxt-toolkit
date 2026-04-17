import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    module: 'src/module.ts',
    types: 'src/types.ts',
  },
  format: ['esm'],
  target: 'es2022',
  dts: {
    entry: {
      module: 'src/module.ts',
      types: 'src/types.ts',
    },
  },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  external: ['@nuxt/kit', '@nuxt/schema', 'nuxt'],
});
