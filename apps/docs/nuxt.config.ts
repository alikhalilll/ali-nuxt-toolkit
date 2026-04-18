import tailwindcss from '@tailwindcss/vite';

const siteUrl =
  process.env.NUXT_PUBLIC_SITE_URL || 'https://alikhalilll.github.io/ali-nuxt-toolkit';
const siteName = 'ali-nuxt-toolkit';
const siteDescription =
  'Three focused, strongly-typed Nuxt 3/4 modules: a typed fetch client with retry and progress, AES-GCM + PBKDF2 crypto, and layout-based route middleware.';

const baseURL = process.env.NUXT_APP_BASE_URL || '/';
const withBase = (path: string) => `${baseURL}${path}`.replace(/\/+/g, '/');
const absoluteUrl = (path: string) => `${siteUrl.replace(/\/$/, '')}${withBase(path)}`;
const socialImage = absoluteUrl('og-image.png');

// Cloudflare Web Analytics — unlimited, cookieless, no banner required.
// Set NUXT_PUBLIC_CF_ANALYTICS_TOKEN (see .env.example) to enable tracking.
// Unset = no script injected, so local dev stays silent.
const cfAnalyticsToken = process.env.NUXT_PUBLIC_CF_ANALYTICS_TOKEN?.trim();
const analyticsScripts = cfAnalyticsToken
  ? [
      {
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        defer: true,
        'data-cf-beacon': JSON.stringify({ token: cfAnalyticsToken }),
      },
    ]
  : [];

export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  srcDir: '.',
  modules: ['@nuxt/content', '@alikhalilll/nuxt-api-provider', '@alikhalilll/nuxt-crypto'],
  css: ['~/assets/docs.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      siteUrl,
      siteName,
      siteDescription,
    },
  },
  nitro: {
    preset: 'github-pages',
    prerender: {
      crawlLinks: true,
      routes: ['/', '/sitemap.xml', '/robots.txt'],
      failOnError: false,
    },
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
    baseURL,
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: siteName,
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: withBase('favicon.svg') },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: withBase('favicon-32.png') },
        { rel: 'apple-touch-icon', sizes: '180x180', href: withBase('apple-touch-icon.png') },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: siteDescription },
        {
          name: 'keywords',
          content:
            'nuxt, nuxt 3, nuxt 4, nuxt modules, typescript, fetch, api client, interceptors, retry, upload progress, crypto, aes-gcm, pbkdf2, web crypto, middleware, auto middleware, vue',
        },
        { name: 'author', content: 'Ali Khalil' },
        { name: 'theme-color', content: '#0b0d10' },
        { name: 'color-scheme', content: 'dark light' },
        { name: 'robots', content: 'index, follow' },
        { name: 'googlebot', content: 'index, follow' },
        { name: 'format-detection', content: 'telephone=no' },

        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: siteName },
        { property: 'og:title', content: siteName },
        { property: 'og:description', content: siteDescription },
        { property: 'og:url', content: siteUrl },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: socialImage },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: `${siteName} logo` },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: siteName },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: socialImage },
        { name: 'twitter:image:alt', content: `${siteName} logo` },
      ],
      script: analyticsScripts,
    },
  },
});
