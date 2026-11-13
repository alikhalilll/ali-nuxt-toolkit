import tailwindcss from '@tailwindcss/vite';

const siteUrl =
  process.env.NUXT_PUBLIC_SITE_URL || 'https://alikhalilll.github.io/ali-nuxt-toolkit';
const siteName = 'ali-nuxt-toolkit';
const siteTagline =
  'Nuxt 3 / 4 and Vue 3 packages — skeleton loader, fetch client, crypto, middleware, phone input';
const siteDescription =
  'Production-grade Nuxt 3 / 4 and Vue 3 packages: a content-aware Vue skeleton loader (no CLS, no hand-authored shapes), a typed fetch client with retry and upload progress, AES-256-GCM + PBKDF2 encryption on the Web Crypto API, layout-based route middleware, and a headless international phone input.';
const siteKeywords = [
  // Skeleton loader (headline product)
  'vue skeleton',
  'vue skeleton loader',
  'vue 3 skeleton',
  'nuxt skeleton',
  'nuxt skeleton loader',
  'nuxt 3 skeleton',
  'nuxt 4 skeleton',
  'skeleton loader',
  'skeleton screen',
  'skeleton component',
  'skeleton animation',
  'loading skeleton',
  'content-aware skeleton',
  'auto skeleton',
  'automatic skeleton',
  'measured skeleton',
  'ghost loader',
  'ghost skeleton',
  'shimmer',
  'shimmer effect',
  'pulse',
  'pulse loader',
  'loading placeholder',
  'placeholder loader',
  'cls',
  'zero cls',
  'layout shift',
  'cumulative layout shift',
  'core web vitals',
  // Fetch client
  'nuxt fetch',
  'nuxt api',
  'nuxt api client',
  'typed fetch',
  'typed api client',
  'vue fetch',
  'vue api client',
  'fetch wrapper',
  'ofetch wrapper',
  'request interceptor',
  'response interceptor',
  'interceptors',
  'retry',
  'exponential backoff',
  'upload progress',
  'download progress',
  'request deduplication',
  'stale while revalidate',
  // Crypto
  'nuxt crypto',
  'nuxt encryption',
  'nuxt security',
  'vue crypto',
  'vue encryption',
  'encryption',
  'decryption',
  'aes',
  'aes-gcm',
  'aes-256-gcm',
  'pbkdf2',
  'pbkdf2-sha256',
  'web crypto api',
  'subtle crypto',
  'symmetric encryption',
  'device fingerprint',
  'cookie encryption',
  // Middleware
  'nuxt middleware',
  'nuxt route middleware',
  'auto middleware',
  'layout middleware',
  'page middleware',
  'route guard',
  'navigation guard',
  'declarative middleware',
  'glob middleware',
  'typed middleware',
  // Phone input
  'vue phone input',
  'vue tel input',
  'nuxt phone input',
  'international phone input',
  'intl tel input',
  'phone number input',
  'phone validation',
  'phone formatter',
  'country picker',
  'country code',
  'dial code',
  'e164',
  'libphonenumber',
  'libphonenumber-js',
  // Framework
  'nuxt 3',
  'nuxt 4',
  'nuxt module',
  'nuxt toolkit',
  'nuxt starter',
  'nuxt packages',
  'nuxt library',
  'vue 3',
  'vue 3 toolkit',
  'vue 3 library',
  'vue 3 components',
  'headless components',
  'headless ui',
  'shadcn vue',
  'typescript',
  'ssr',
].join(', ');

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
  modules: [
    '@nuxt/content',
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/a-ghost-skeleton/nuxt',
  ],
  // Note: @alikhalilll/a-ui-base/tokens.css is @imported from the top of docs.css instead of
  // listed here. Vite + pnpm workspaces resolves the same workspace-symlinked CSS via
  // two different canonical paths when it's referenced both as a Nuxt CSS entry AND
  // implicitly via the package's subpath — the second copy lands AFTER docs.css in the
  // <head> cascade and the lib's `.hidden { display: none }` ends up overriding the
  // docs site's `.md\:flex` responsive utility, breaking the desktop nav + sidebars.
  css: ['~/assets/docs.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      siteUrl,
      siteName,
      siteTagline,
      siteDescription,
      siteKeywords,
    },
  },
  nitro: {
    preset: 'github-pages',
    // Pre-compress every public asset to .gz + .br at build time. GitHub Pages auto-serves
    // the negotiated variant when a matching Accept-Encoding hits the request — drops
    // ~30% off favicons, fonts, and the homepage HTML at zero runtime cost.
    compressPublicAssets: { brotli: true, gzip: true },
    prerender: {
      crawlLinks: true,
      // Explicit list of known routes is a belt to crawlLinks' braces — guarantees a
      // generated `.html` for every page even if a link gets temporarily removed during
      // a refactor (and protects against accidental no-prerender regressions).
      routes: [
        '/',
        '/sitemap.xml',
        '/robots.txt',
        '/api-provider',
        '/crypto',
        '/auto-middleware',
        '/ui',
        '/ui/tel-input',
        '/ui/ghost-skeleton',
      ],
      failOnError: false,
    },
  },
  apiProvider: {
    // Docs demos talk to static JSON under /public/api/*. Resolving against the
    // Nuxt app baseURL keeps the demos working both at `/` locally and under
    // the GitHub Pages project subpath (e.g. `/ali-nuxt-toolkit/`).
    baseURL: withBase('/api'),
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
          /*
           * Dual-theme Shiki output. Keys map to selectors Shiki emits as CSS vars:
           *   - `default` is the base (light) theme
           *   - `dark`    activates when an ancestor has `.dark`
           * Switching the `.dark` class on <html> swaps every code block instantly.
           *
           * `github-*-default` (not the older `github-*`) — its palette matches
           * what GitHub.com actually serves today and what the homepage hero
           * showcase uses (`.code-fn=#d2a8ff` etc.), so prose blocks and the hero
           * read with one set of token colours instead of two.
           */
          theme: {
            default: 'github-light-default',
            dark: 'github-dark-default',
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
      title: `${siteName} — ${siteTagline}`,
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: withBase('favicon.svg') },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: withBase('favicon-32x32.png') },
        { rel: 'apple-touch-icon', sizes: '180x180', href: withBase('apple-touch-icon.png') },
        // dns-prefetch is cheaper than preconnect and works in older browsers / proxies
        // that strip the preconnect handshake — small but free win on cold loads.
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'description', content: siteDescription },
        { name: 'keywords', content: siteKeywords },
        { name: 'author', content: 'Ali Khalil' },
        { name: 'theme-color', content: '#0a0a0a' },
        { name: 'color-scheme', content: 'dark light' },
        { name: 'robots', content: 'index, follow' },
        { name: 'googlebot', content: 'index, follow' },
        { name: 'format-detection', content: 'telephone=no' },

        // Open Graph — defaults; per-page templates in [...slug].vue override title/description/url
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: siteName },
        { property: 'og:title', content: `${siteName} — ${siteTagline}` },
        { property: 'og:description', content: siteDescription },
        { property: 'og:url', content: siteUrl },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: socialImage },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: `${siteName} — ${siteTagline}` },

        // Twitter — same note on per-page overrides
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${siteName} — ${siteTagline}` },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: socialImage },
        { name: 'twitter:image:alt', content: `${siteName} — ${siteTagline}` },

        // Pinterest-style rich pin & Discord/Slack unfurl hints (safe no-ops elsewhere)
        { name: 'application-name', content: siteName },
        { name: 'apple-mobile-web-app-title', content: siteName },
      ],
      script: [
        /*
         * Pre-paint theme detection — runs before any CSS or Vue hydration. Reads the saved
         * choice (or prefers-color-scheme) and writes the correct class on <html>, so the page
         * paints in the right theme on first frame instead of flashing dark before swapping
         * to light (or vice versa).
         */
        {
          // Tri-state pre-paint: read stored 'light'|'dark'|'system' and resolve to
          // light/dark before first paint to avoid flash-of-wrong-theme.
          //
          // Reads from both localStorage AND the `ant-docs-theme` cookie (either
          // may be fresher depending on which tab last set the preference) and
          // writes back BOTH the preference and the resolved value to the cookie
          // layer. The server reads these cookies on the next request so SSR can
          // render in the correct mode from the first byte, eliminating the flash
          // for returning visitors — see composables/useColorMode.ts.
          innerHTML: `(function(){try{var k='ant-docs-theme',rk='ant-docs-resolved';function rc(n){return(document.cookie.split('; ').find(function(r){return r.indexOf(n+'=')===0})||'').split('=')[1]||''}function wc(n,v){document.cookie=n+'='+v+';path=/;max-age=31536000;samesite=lax'}var ls='';try{ls=localStorage.getItem(k)||''}catch(e){}var ck=rc(k);var s=ls||ck;var p=(s==='light'||s==='dark'||s==='system')?s:'system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.classList.toggle('light',!d);wc(k,p);wc(rk,d?'dark':'light');}catch(e){document.documentElement.classList.add('dark');}})();`,
          type: 'text/javascript',
          tagPosition: 'head',
        },
        ...analyticsScripts,
      ],
    },
  },
});
