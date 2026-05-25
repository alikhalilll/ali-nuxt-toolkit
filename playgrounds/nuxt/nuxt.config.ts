import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  srcDir: '.',
  css: ['@alikhalilll/ui/styles.css', '~/assets/main.css'],
  app: {
    head: {
      htmlAttrs: { class: 'dark' },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  modules: [
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/nuxt-auto-middleware',
    // UI auto-import: `<ATellInput>` / `<APopover>` / etc. resolve without
    // explicit `import` statements in <script setup>. Each is code-split by
    // subpath, so a page using only `<ATellInput>` still ships only the
    // tell-input chunk.
    '@alikhalilll/ui/nuxt',
  ],
  apiProvider: {
    baseURL: 'https://jsonplaceholder.typicode.com',
    provideName: '$apiProvider',
    defaultTimeoutMs: 10_000,
    retry: { attempts: 1, delayMs: 200 },
  },
  crypto: {
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? 'dev-only-passphrase',
    provideName: '$crypto',
    iterations: 10_000,
  },
  runtimeConfig: {
    cryptoFingerprintSalt: process.env.NUXT_CRYPTO_FINGERPRINT_SALT ?? 'dev-only-fingerprint-salt',
  },
  autoMiddleware: {
    groups: {
      auth: ['auth'],
      adminOnly: ['auth', 'verify-role', 'require-admin'],
    },
    rules: [
      { layouts: ['default'], middlewares: ['log-activity'] },
      { layouts: ['dashboard', 'dashboard/*'], middlewares: ['@auth'] },
      { layouts: ['admin'], middlewares: ['@adminOnly'] },
    ],
    debug: true,
  },
});
