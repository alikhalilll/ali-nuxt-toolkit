import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  srcDir: '.',
  css: ['~/assets/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: [
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/nuxt-auto-middleware',
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
