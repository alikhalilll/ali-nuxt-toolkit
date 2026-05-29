import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  srcDir: '.',
  css: [
    '@alikhalilll/a-ui-base/tokens.css',
    '@alikhalilll/a-popover/styles.css',
    '@alikhalilll/a-drawer/styles.css',
    '@alikhalilll/a-responsive-popover/styles.css',
    '@alikhalilll/a-input/styles.css',
    '@alikhalilll/a-tel-input/styles.css',
    '~/assets/main.css',
  ],
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
    // UI auto-import: `<ATelInput>` / `<APopover>` / etc. resolve without
    // explicit `import` statements in <script setup>. Each component package
    // ships its own Nuxt module, so a page using only `<ATelInput>` still ships
    // only that component's chunk.
    '@alikhalilll/a-input/nuxt',
    '@alikhalilll/a-popover/nuxt',
    '@alikhalilll/a-drawer/nuxt',
    '@alikhalilll/a-responsive-popover/nuxt',
    '@alikhalilll/a-tel-input/nuxt',
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
