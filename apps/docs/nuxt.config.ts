import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  srcDir: '.',
  modules: [
    '@nuxt/content',
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
  ],
  css: ['~/assets/docs.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  apiProvider: {
    baseURL: 'https://jsonplaceholder.typicode.com',
    provideName: '$apiProvider',
    defaultTimeoutMs: 10_000,
    retry: { attempts: 1, delayMs: 200 },
  },
  crypto: {
    passphrase: 'docs-demo-passphrase',
    provideName: '$crypto',
    iterations: 10_000,
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-dark',
            dark: 'github-dark',
          },
          langs: ['ts', 'js', 'vue', 'bash', 'json', 'html', 'css'],
        },
      },
    },
  },
  app: {
    head: {
      title: 'ali-nuxt-toolkit',
      meta: [
        {
          name: 'description',
          content:
            'Strongly-typed Nuxt modules for API, crypto, and layout-based middleware.',
        },
      ],
    },
  },
});
