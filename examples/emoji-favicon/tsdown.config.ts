import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/core/index.ts',
    'vite/index': 'src/vite/index.ts',
    'vue/index': 'src/vue/index.ts',
    'nuxt/index': 'src/nuxt/index.ts',
    'nuxt/runtime/plugin.client': 'src/nuxt/runtime/plugin.client.ts',
    'resolver/index': 'src/resolver/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@nuxt/kit', '#imports', '#app'],
});
