<script setup lang="ts">
import { ATellInput } from '@alikhalilll/ui';

const {
  public: { siteUrl, siteName, siteDescription },
} = useRuntimeConfig();
const canonical = `${siteUrl}/`;

useSeoMeta({
  title: siteName,
  description: siteDescription,
  ogTitle: siteName,
  ogDescription: siteDescription,
  ogUrl: canonical,
  ogType: 'website',
  twitterTitle: siteName,
  twitterDescription: siteDescription,
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: siteUrl,
        description: siteDescription,
      }),
    },
  ],
});

interface PackageCard {
  name: string;
  docs: string;
  npm: string;
  description: string;
  accent: 'api' | 'crypto' | 'auto' | 'ui';
  /** Where the package runs — `'core'` packages ship a framework-agnostic
   *  subpath (`/core`) usable in any JS/TS project. */
  mode: 'core' | 'vue' | 'nuxt-only';
  modeLabel: string;
}

/** Install command slider — rotates through every package. The viewport shows the
 *  prompt + `pnpm add` + the active package name; the copy button copies the full
 *  command. Tab dots below let you jump between packages manually. */
const installCommands = [
  'pnpm add @alikhalilll/nuxt-api-provider',
  'pnpm add @alikhalilll/nuxt-crypto',
  'pnpm add @alikhalilll/nuxt-auto-middleware',
  'pnpm add @alikhalilll/ui',
];
const installPkgs = [
  '@alikhalilll/nuxt-api-provider',
  '@alikhalilll/nuxt-crypto',
  '@alikhalilll/nuxt-auto-middleware',
  '@alikhalilll/ui',
];
const installShorts = ['api', 'crypto', 'middleware', 'ui'];
const installIndex = ref(0);
const installCopied = ref(false);
let installTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  installTimer = setInterval(() => {
    installIndex.value = (installIndex.value + 1) % installCommands.length;
  }, 4000);
});

onBeforeUnmount(() => {
  if (installTimer) clearInterval(installTimer);
});

async function copyInstall() {
  const cmd = installCommands[installIndex.value];
  if (!cmd) return;
  try {
    await navigator.clipboard.writeText(cmd);
    installCopied.value = true;
    setTimeout(() => (installCopied.value = false), 1500);
  } catch {
    /* ignore */
  }
}

const packages: PackageCard[] = [
  {
    name: '@alikhalilll/nuxt-api-provider',
    docs: '/api-provider',
    npm: 'https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider',
    description:
      'Typed fetch client with interceptors, retry/backoff, timeouts, and a unified upload + download progress hook.',
    accent: 'api',
    mode: 'core',
    modeLabel: 'Nuxt module + framework-agnostic core',
  },
  {
    name: '@alikhalilll/nuxt-crypto',
    docs: '/crypto',
    npm: 'https://www.npmjs.com/package/@alikhalilll/nuxt-crypto',
    description:
      'AES-256-GCM + PBKDF2 via the Web Crypto API, with key caching and pluggable algorithms. Server-only mode keeps the passphrase off the client.',
    accent: 'crypto',
    mode: 'core',
    modeLabel: 'Nuxt module + framework-agnostic core',
  },
  {
    name: '@alikhalilll/nuxt-auto-middleware',
    docs: '/auto-middleware',
    npm: 'https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware',
    description:
      'Layout → middleware mapping with glob patterns, named groups, per-page overrides, and a typed middleware-name registry.',
    accent: 'auto',
    mode: 'nuxt-only',
    modeLabel: 'Nuxt-only (middleware is a Nuxt primitive)',
  },
  {
    name: '@alikhalilll/ui',
    docs: '/ui',
    npm: 'https://www.npmjs.com/package/@alikhalilll/ui',
    description:
      'Headless Vue 3 components — ATellInput, APopover, ADrawer, AResponsivePopover, AInput. Each lives behind its own subpath import (`@alikhalilll/ui/tell-input`, …) so you only ship the components you use.',
    accent: 'ui',
    mode: 'vue',
    modeLabel: 'Vue 3 (Nuxt + non-Nuxt)',
  },
];

// Hero live demo
const heroPhone = ref('');
const heroCountry = ref<number | null>(null);

// Mount-time reveal flag — drives the entrance animation on the hero block.
const mounted = ref(false);
onMounted(() => {
  // requestAnimationFrame so the .reveal class transition fires after first paint.
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

/* -------------------------------------------------------------------------
 * Hero showcase — a tabbed carousel that rotates through every package so
 * the hero gives a one-glance feel for the whole toolkit, not just the UI
 * lib. Auto-advances every 5s; clicking a tab stops the auto-advance.
 * ----------------------------------------------------------------------- */
type ShowcaseId = 'ui' | 'api-provider' | 'crypto' | 'auto-middleware';
interface ShowcaseTab {
  id: ShowcaseId;
  short: string;
  label: string;
  /** The headline function/component for this tab — the active one is shown big. */
  fn: string;
  /** One-line "what it does" string under the function name. */
  tagline: string;
  docs: string;
}
const showcaseTabs: ShowcaseTab[] = [
  {
    id: 'ui',
    short: 'ui',
    label: '@alikhalilll/ui',
    fn: 'ATellInput',
    tagline: 'Live phone input · 197 countries · NANP-aware',
    docs: '/ui',
  },
  {
    id: 'api-provider',
    short: 'api',
    label: '@alikhalilll/nuxt-api-provider',
    fn: 'useApi<T>',
    tagline: 'Typed fetch · retry · upload + download progress',
    docs: '/api-provider',
  },
  {
    id: 'crypto',
    short: 'crypto',
    label: '@alikhalilll/nuxt-crypto',
    fn: 'useCrypto',
    tagline: 'AES-256-GCM · PBKDF2 · key cache',
    docs: '/crypto',
  },
  {
    id: 'auto-middleware',
    short: 'middleware',
    label: '@alikhalilll/nuxt-auto-middleware',
    fn: 'defineLayoutMiddleware',
    tagline: 'layout → middleware · glob patterns · per-page overrides',
    docs: '/auto-middleware',
  },
];
const showcaseIndex = ref(0);
const showcaseManual = ref(false);
const showcasePaused = ref(false);
let showcaseTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  showcaseTimer = setInterval(() => {
    if (showcaseManual.value || showcasePaused.value) return;
    showcaseIndex.value = (showcaseIndex.value + 1) % showcaseTabs.length;
  }, 7000);
});

onBeforeUnmount(() => {
  if (showcaseTimer) clearInterval(showcaseTimer);
});

function selectShowcase(i: number) {
  showcaseIndex.value = i;
  showcaseManual.value = true;
}
function pauseShowcase() {
  showcasePaused.value = true;
}
function resumeShowcase() {
  showcasePaused.value = false;
}

const currentShowcase = computed(() => showcaseTabs[showcaseIndex.value]);

/* -------------------------------------------------------------------------
 * Code-editor showcase content (Nuxt.com-style hero panel). Each tab has a
 * filename, a small file-tree, and a syntax-highlighted code snippet
 * representing typical usage of that package.
 * ----------------------------------------------------------------------- */
interface TreeNode {
  type: 'folder' | 'file';
  label: string;
  indent: number;
  active?: boolean;
}
interface CodeExample {
  filename: string;
  tree: TreeNode[];
  /** HTML-safe code with span classes (`code-com`, `code-kw`, `code-str`, …) for syntax. */
  code: string;
}
const codeExamples: Record<ShowcaseId, CodeExample> = {
  ui: {
    filename: 'app/components/SignupForm.vue',
    tree: [
      { type: 'folder', label: 'app', indent: 0 },
      { type: 'folder', label: 'components', indent: 1 },
      { type: 'file', label: 'SignupForm.vue', indent: 2, active: true },
      { type: 'file', label: 'app.vue', indent: 1 },
      { type: 'file', label: 'nuxt.config.ts', indent: 0 },
    ],
    code:
      '<span class="code-tag">&lt;script setup lang="ts"&gt;</span>\n' +
      '<span class="code-kw">import</span> { <span class="code-fn">ATellInput</span> } <span class="code-kw">from</span> <span class="code-str">\'@alikhalilll/ui\'</span>;\n' +
      '\n' +
      '<span class="code-kw">const</span> phone = <span class="code-fn">ref</span>(<span class="code-str">\'\'</span>);\n' +
      '<span class="code-kw">const</span> country = <span class="code-fn">ref</span>&lt;<span class="code-type">number</span> | <span class="code-type">null</span>&gt;(<span class="code-type">null</span>);\n' +
      '<span class="code-tag">&lt;/script&gt;</span>\n' +
      '\n' +
      '<span class="code-tag">&lt;template&gt;</span>\n' +
      '  <span class="code-tag">&lt;</span><span class="code-fn">ATellInput</span>\n' +
      '    <span class="code-kw">v-model:phone</span>=<span class="code-str">"phone"</span>\n' +
      '    <span class="code-kw">v-model:country</span>=<span class="code-str">"country"</span>\n' +
      '  <span class="code-tag">/&gt;</span>\n' +
      '<span class="code-tag">&lt;/template&gt;</span>',
  },
  'api-provider': {
    filename: 'app/composables/useUser.ts',
    tree: [
      { type: 'folder', label: 'app', indent: 0 },
      { type: 'folder', label: 'composables', indent: 1 },
      { type: 'file', label: 'useUser.ts', indent: 2, active: true },
      { type: 'folder', label: 'pages', indent: 1 },
      { type: 'file', label: 'nuxt.config.ts', indent: 0 },
    ],
    code:
      '<span class="code-com">// Typed fetch · retry · upload + download progress</span>\n' +
      '<span class="code-kw">export const</span> <span class="code-fn">useUser</span> = () =&gt; {\n' +
      '  <span class="code-kw">const</span> { data, pending, refresh } = <span class="code-fn">useApi</span>&lt;<span class="code-type">User</span>&gt;(<span class="code-str">\'/users/1\'</span>, {\n' +
      '    retry: <span class="code-num">3</span>,\n' +
      '    <span class="code-fn">onProgress</span>: (p) =&gt; loaded.value = p,\n' +
      '  });\n' +
      '  <span class="code-kw">return</span> { data, pending, refresh };\n' +
      '};',
  },
  crypto: {
    filename: 'server/api/login.post.ts',
    tree: [
      { type: 'folder', label: 'server', indent: 0 },
      { type: 'folder', label: 'api', indent: 1 },
      { type: 'file', label: 'login.post.ts', indent: 2, active: true },
      { type: 'folder', label: 'app', indent: 0 },
      { type: 'file', label: 'nuxt.config.ts', indent: 0 },
    ],
    code:
      '<span class="code-com">// AES-256-GCM · PBKDF2 · server-only mode</span>\n' +
      '<span class="code-kw">import</span> { <span class="code-fn">useCrypto</span> } <span class="code-kw">from</span> <span class="code-str">\'@alikhalilll/nuxt-crypto/server\'</span>;\n' +
      '\n' +
      '<span class="code-kw">export default</span> <span class="code-fn">defineEventHandler</span>(<span class="code-kw">async</span> (event) =&gt; {\n' +
      '  <span class="code-kw">const</span> { encrypt } = <span class="code-fn">useCrypto</span>({ passphrase });\n' +
      '  <span class="code-kw">const</span> token = <span class="code-kw">await</span> <span class="code-fn">encrypt</span>(<span class="code-str">\'hello, world\'</span>);\n' +
      '  <span class="code-kw">return</span> { token };\n' +
      '});',
  },
  'auto-middleware': {
    filename: 'middleware/auto.global.ts',
    tree: [
      { type: 'folder', label: 'middleware', indent: 0 },
      { type: 'file', label: 'auto.global.ts', indent: 1, active: true },
      { type: 'folder', label: 'layouts', indent: 0 },
      { type: 'file', label: 'admin.vue', indent: 1 },
      { type: 'file', label: 'dashboard.vue', indent: 1 },
    ],
    code:
      '<span class="code-com">// One mapping. Every page in the layout gets it.</span>\n' +
      '<span class="code-kw">export default</span> <span class="code-fn">defineLayoutMiddleware</span>({\n' +
      '  admin:     [<span class="code-str">\'auth\'</span>, <span class="code-str">\'requireRole:admin\'</span>, <span class="code-str">\'log\'</span>],\n' +
      '  dashboard: [<span class="code-str">\'auth\'</span>, <span class="code-str">\'log\'</span>],\n' +
      '  default:   [<span class="code-str">\'log\'</span>],\n' +
      '});',
  },
};
const currentExample = computed(() => codeExamples[currentShowcase.value.id]);
</script>

<template>
  <!-- Animated decorative background — drifting brand orbs. The page's static dot grid
       (rendered globally on `html::after`) shows through naturally. -->
  <div class="hero-bg" aria-hidden="true">
    <div class="hero-orb hero-orb--brand" />
    <div class="hero-orb hero-orb--brand-2" />
    <div class="hero-orb hero-orb--brand-3" />
  </div>

  <section class="relative isolate">
    <!-- Calm centered hero shell. Constrained width, generous vertical rhythm so
         every element has room to land. -->
    <div class="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
      <!-- Announcement pill -->
      <div
        class="reveal mb-10 flex justify-center"
        :class="{ 'reveal--in': mounted }"
        style="--reveal-delay: 0ms"
      >
        <a
          href="https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider"
          target="_blank"
          rel="noopener"
          class="group inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs text-text-dim transition-colors hover:border-brand hover:text-text hover:no-underline"
        >
          <span
            class="bg-gradient-brand rounded-full px-1.5 py-[1px] text-[10px] font-semibold !text-black"
          >
            New
          </span>
          <span>ATellInput is now international + accessible</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform group-hover:translate-x-0.5"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>

      <!-- Calm centered hero stack: title → subtitle → CTAs → install. Showcase
           panel sits as a focal demo below this block. -->
      <div class="mx-auto max-w-3xl text-center">
        <h1
          class="reveal mb-6 text-4xl font-bold tracking-tight text-text sm:text-5xl md:text-[3.5rem]"
          :class="{ 'reveal--in': mounted }"
          style="--reveal-delay: 100ms; letter-spacing: -0.03em; line-height: 1.05"
        >
          The strongly-typed<br />
          <span class="text-gradient-brand">Nuxt toolkit.</span>
        </h1>

        <p
          class="reveal mx-auto mb-9 max-w-xl text-base text-text-dim sm:text-lg"
          :class="{ 'reveal--in': mounted }"
          style="--reveal-delay: 250ms"
        >
          Four focused modules with a framework-agnostic core. Independently installable.
        </p>

        <div
          class="reveal flex flex-wrap items-center justify-center gap-3"
          :class="{ 'reveal--in': mounted }"
          style="--reveal-delay: 350ms"
        >
          <NuxtLink
            to="/api-provider"
            class="cta-primary bg-gradient-brand inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-semibold !text-black shadow-[0_4px_24px_-8px_rgba(96,165,250,0.6)] transition-[filter] hover:brightness-110 hover:no-underline"
          >
            Get Started
          </NuxtLink>
          <a
            href="https://github.com/alikhalilll/ali-nuxt-toolkit"
            target="_blank"
            rel="noopener"
            class="cta-secondary inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface/40 px-6 text-sm font-medium text-text transition-colors hover:border-brand/50 hover:bg-surface hover:no-underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
              />
            </svg>
            <span>GitHub</span>
          </a>
        </div>

        <!-- Install slider — rotates through every package. Terminal-styled row with
             prompt, fixed `pnpm add`, a rotating viewport of the package name, and
             a copy icon. Dots below let you jump between packages. -->
        <div
          class="reveal install mx-auto mt-8 max-w-md"
          :class="{ 'reveal--in': mounted }"
          style="--reveal-delay: 450ms"
        >
          <div class="install__row">
            <span class="install__prompt" aria-hidden="true">$_</span>
            <span class="install__static">pnpm add</span>
            <div class="install__viewport" aria-live="polite">
              <div
                class="install__track"
                :style="{ transform: `translateY(calc(-${installIndex} * var(--install-line)))` }"
              >
                <div v-for="pkg in installPkgs" :key="pkg" class="install__pkg">
                  {{ pkg }}
                </div>
              </div>
            </div>
            <button
              type="button"
              class="install__copy"
              :aria-label="installCopied ? 'Copied' : 'Copy install command'"
              @click="copyInstall"
            >
              <svg
                v-if="!installCopied"
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-success"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
          <!-- Package dots indicator — click to jump to a specific install command. -->
          <div class="install-dots" aria-hidden="true">
            <button
              v-for="(label, i) in installShorts"
              :key="label"
              type="button"
              :aria-label="`Show install for ${label}`"
              :aria-current="installIndex === i ? 'true' : undefined"
              class="install-dot"
              :class="{ 'install-dot--active': installIndex === i }"
              @click="installIndex = i"
            >
              {{ label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Showcase strip — a single focal demo below the hero text. Centered,
           properly framed, wider than the text block so it commands attention
           without overwhelming the page. -->
      <div class="mx-auto mt-16 max-w-5xl sm:mt-20">
        <div
          class="code-panel reveal"
          :class="{ 'reveal--in': mounted }"
          style="--reveal-delay: 500ms"
          @mouseenter="pauseShowcase"
          @mouseleave="resumeShowcase"
        >
          <!-- Top chrome: tabs across the panel, one per package, each with a small
               leading icon (matching Nuxt.com's hero panel pattern). -->
          <div class="code-panel__chrome" role="tablist" aria-label="Package showcase">
            <button
              v-for="(tab, i) in showcaseTabs"
              :key="tab.id"
              type="button"
              role="tab"
              :aria-selected="showcaseIndex === i"
              :class="['code-panel__tab', showcaseIndex === i && 'code-panel__tab--active']"
              @click="selectShowcase(i)"
            >
              <svg
                v-if="tab.id === 'ui'"
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <svg
                v-else-if="tab.id === 'api-provider'"
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.4 0 4.6.9 6.3 2.4" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              <svg
                v-else-if="tab.id === 'crypto'"
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>{{ tab.short }}</span>
            </button>
          </div>

          <!-- Body: code on the left, a live/animated preview on the right. Both
               crossfade together when you switch tabs — code shows the API, the
               preview shows the result. -->
          <div class="code-panel__body">
            <!-- Code (left) -->
            <div class="code-panel__code">
              <div class="code-panel__filename">{{ currentExample.filename }}</div>
              <Transition name="code-fade" mode="out-in">
                <pre
                  :key="`code-${currentShowcase.id}`"
                  class="code-panel__source"
                  v-html="currentExample.code"
                />
              </Transition>
            </div>

            <!-- Visual preview (right) -->
            <div class="code-panel__preview">
              <Transition name="code-fade" mode="out-in">
                <div :key="`vis-${currentShowcase.id}`" class="code-panel__preview-inner">
                  <!-- ui · live ATellInput -->
                  <template v-if="currentShowcase.id === 'ui'">
                    <ClientOnly>
                      <ATellInput v-model:phone="heroPhone" v-model:country="heroCountry" />
                      <template #fallback>
                        <div class="showcase-skeleton" />
                      </template>
                    </ClientOnly>
                    <p class="preview-hint">
                      Try <code>+447911 123 456</code> or
                      <code dir="rtl">٠١٠٦٦١٠٥٩٦٣</code>
                    </p>
                  </template>

                  <!-- api · animated request log -->
                  <ul v-else-if="currentShowcase.id === 'api-provider'" class="req-log">
                    <li class="req-row" style="--i: 0">
                      <span class="req-method req-method--get">GET</span>
                      <span class="req-path">/users/1</span>
                      <span class="req-spacer" />
                      <span class="req-time">24ms</span>
                      <span class="req-status req-status--ok">200</span>
                    </li>
                    <li class="req-row" style="--i: 1">
                      <span class="req-method req-method--post">POST</span>
                      <span class="req-path">/uploads</span>
                      <span class="req-progress"><span class="req-progress__fill" /></span>
                      <span class="req-status req-status--pending">67%</span>
                    </li>
                    <li class="req-row" style="--i: 2">
                      <span class="req-method req-method--get">GET</span>
                      <span class="req-path">/metrics</span>
                      <span class="req-spacer" />
                      <span class="req-time">156ms · retry 1</span>
                      <span class="req-status req-status--ok">200</span>
                    </li>
                  </ul>

                  <!-- crypto · lock + cipher -->
                  <div v-else-if="currentShowcase.id === 'crypto'" class="crypto-vis">
                    <div class="crypto-lock">
                      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          class="crypto-lock__shackle"
                          d="M10 14V10a6 6 0 0 1 12 0v4"
                          stroke="currentColor"
                          stroke-width="2.4"
                          stroke-linecap="round"
                        />
                        <rect
                          x="6"
                          y="14"
                          width="20"
                          height="14"
                          rx="3"
                          fill="currentColor"
                          opacity="0.18"
                        />
                        <rect
                          x="6"
                          y="14"
                          width="20"
                          height="14"
                          rx="3"
                          stroke="currentColor"
                          stroke-width="2.4"
                        />
                        <circle cx="16" cy="20" r="1.6" fill="currentColor" />
                        <path
                          d="M16 21.5v3"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                      </svg>
                    </div>
                    <div class="crypto-flow">
                      <span class="exhibit__chip exhibit__chip--in">"hello, world"</span>
                      <span class="exhibit__arrow">→</span>
                      <span class="exhibit__chip exhibit__chip--out exhibit__cipher"
                        >a4b8e9c5f2d1…</span
                      >
                    </div>
                  </div>

                  <!-- middleware · layout → middleware chain -->
                  <ul v-else class="mw-chain">
                    <li class="mw-row" style="--i: 0">
                      <span class="mw-layout">admin</span>
                      <span class="mw-arrow">→</span>
                      <span class="mw-pill">auth</span>
                      <span class="mw-pill">role:admin</span>
                      <span class="mw-pill">log</span>
                    </li>
                    <li class="mw-row" style="--i: 1">
                      <span class="mw-layout">dashboard</span>
                      <span class="mw-arrow">→</span>
                      <span class="mw-pill">auth</span>
                      <span class="mw-pill">log</span>
                    </li>
                    <li class="mw-row" style="--i: 2">
                      <span class="mw-layout">default</span>
                      <span class="mw-arrow">→</span>
                      <span class="mw-pill">log</span>
                    </li>
                  </ul>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Packages grid -->
    <div class="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-text sm:text-2xl">Packages</h2>
          <p class="mt-1 text-sm text-text-dim">
            Each package is independently installable. Most ship a
            <strong class="text-text">framework-agnostic core</strong>
            at <code class="px-1 py-0.5 text-[12px] font-mono text-text">…/core</code> — usable in
            any JS/TS project; the Nuxt entry just wires the autoimports.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(pkg, i) in packages"
          :key="pkg.name"
          :class="[
            `pkg-${pkg.accent}`,
            'pkg-card reveal group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface/40 p-5 transition-all',
            { 'reveal--in': mounted },
          ]"
          :style="`--reveal-delay: ${1100 + i * 90}ms`"
        >
          <span
            class="absolute inset-x-0 top-0 h-[2px] opacity-60 transition-opacity group-hover:opacity-100"
            :style="{ background: 'var(--pkg-color)' }"
            aria-hidden="true"
          />
          <div class="mb-2 flex items-center gap-2">
            <span class="pkg-dot" aria-hidden="true" />
            <h3 class="font-mono text-[13px] font-semibold text-text">{{ pkg.name }}</h3>
          </div>
          <span :class="['pkg-mode', `pkg-mode--${pkg.mode}`]" :title="pkg.modeLabel">
            <svg
              v-if="pkg.mode === 'core'"
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
            <svg
              v-else-if="pkg.mode === 'vue'"
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 21 2 4h4l6 10.5L18 4h4z" opacity="0.8" />
              <path d="M12 21 6 11l3 5h6l3-5z" opacity="0.4" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m18 16 4-4-4-4" />
              <path d="m6 8-4 4 4 4" />
              <path d="m14.5 4-5 16" />
            </svg>
            {{ pkg.modeLabel }}
          </span>
          <p class="mb-5 mt-3 flex-1 text-sm text-text-dim">{{ pkg.description }}</p>
          <div class="flex items-center gap-4 text-sm">
            <NuxtLink
              :to="pkg.docs"
              class="font-medium transition-colors hover:no-underline"
              :style="{ color: 'var(--pkg-color)' }"
            >
              Docs →
            </NuxtLink>
            <a
              :href="pkg.npm"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 text-text-dim transition-colors hover:text-text hover:no-underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M1.763 0h20.474v20.474H12v3.526H6.316v-3.526H1.763V0zm1.105 19.368h5.684V3.684h13.579v15.684h-8.421V5.526h-3.789v13.842H2.868z"
                />
              </svg>
              npm
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* -------------------------------------------------------------------------
 * Decorative background — soft drifting orbs + a faint dot grid. Lives in a
 * `fixed` layer behind the content so it parallaxes naturally with scroll.
 * Disabled (still rendered, but static) when the user prefers reduced motion.
 * ----------------------------------------------------------------------- */
.hero-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.hero-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.3;
}

.hero-orb--brand {
  width: 520px;
  height: 520px;
  top: -140px;
  left: -120px;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-brand) 90%, transparent) 0%,
    transparent 65%
  );
}

.hero-orb--brand-2 {
  width: 480px;
  height: 480px;
  top: 200px;
  right: -160px;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-brand-2) 80%, transparent) 0%,
    transparent 65%
  );
  opacity: 0.24;
}

.hero-orb--brand-3 {
  width: 420px;
  height: 420px;
  top: 580px;
  left: 40%;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-brand-3) 80%, transparent) 0%,
    transparent 65%
  );
  opacity: 0.18;
}

@keyframes orb-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(40px, -30px, 0) scale(1.06);
  }
  100% {
    transform: translate3d(-30px, 50px, 0) scale(0.96);
  }
}

/* -------------------------------------------------------------------------
 * Generic reveal — fade + lift driven by `mounted` flipping. Delay per
 * element via the `--reveal-delay` custom property.
 * ----------------------------------------------------------------------- */
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}
.reveal--in {
  opacity: 1;
  transform: translateY(0);
}

/* Word-by-word title reveal — staggered via `--i`. */
.word {
  display: inline-block;
  margin-right: 0.18em;
  opacity: 0;
  transform: translateY(14px);
  animation: word-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--i, 0) * 70ms + 120ms);
}
@keyframes word-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cta-primary {
  position: relative;
}

/* -------------------------------------------------------------------------
 * Hero showcase card — wraps the live ATellInput. A faint glow halo,
 * a Mac-style chrome bar, and floating feature pills that drift in.
 * ----------------------------------------------------------------------- */
.hero-card-wrap {
  position: relative;
  margin: 0 auto;
  max-width: 28rem;
}

.hero-glow {
  position: absolute;
  inset: -32px;
  border-radius: 28px;
  background: radial-gradient(
    60% 60% at 50% 50%,
    color-mix(in oklab, var(--color-brand) 25%, transparent) 0%,
    transparent 70%
  );
  filter: blur(40px);
  opacity: 0.55;
  pointer-events: none;
}
@keyframes glow-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.04);
  }
}

.hero-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 24px 60px -24px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
@media (hover: hover) and (min-width: 1024px) {
  .hero-card {
    transform: perspective(1400px) rotateY(-4deg) rotateX(2deg);
  }
  .hero-card:hover {
    transform: perspective(1400px) rotateY(0) rotateX(0);
  }
}

.hero-card__chrome {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-soft);
}
.hero-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}
.hero-dot--r {
  background: #ff6157;
}
.hero-dot--y {
  background: #ffbd2e;
}
.hero-dot--g {
  background: #28c941;
}
.hero-card__label {
  margin-left: auto;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-muted);
}

.hero-card__body {
  padding: 22px 22px 20px;
}

.hero-card__skeleton {
  height: 43px;
  width: 100%;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--surface-2) 0%,
    color-mix(in oklab, var(--surface-2) 70%, var(--surface) 30%) 50%,
    var(--surface-2) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

.hero-card__hint {
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-dim);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.hero-card__hint-label {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
  font-weight: 600;
}
.hero-card__hint code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--code-bg);
  border: 1px solid var(--border-soft);
}

/* Floating feature pills — small chips that drift in around the card. */
.hero-pill {
  position: absolute;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-dim);
  white-space: nowrap;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.4);
  opacity: 0;
  animation: pill-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 1100ms;
}
.hero-pill--1 {
  top: -14px;
  right: 24px;
  animation-delay: 1200ms;
}
.hero-pill--2 {
  bottom: -16px;
  left: 32px;
  animation-delay: 1350ms;
}
.hero-pill--3 {
  top: 42%;
  right: -28px;
  animation-delay: 1500ms;
}
.hero-pill--4 {
  bottom: 28%;
  left: -36px;
  animation-delay: 1650ms;
}
@keyframes pill-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Hide off-side pills on tight screens — they'd clip outside the column. */
@media (max-width: 1023px) {
  .hero-pill--3,
  .hero-pill--4 {
    display: none;
  }
}

/* Package cards now lift slightly on hover, in addition to the existing accent bar. */
.pkg-card:hover {
  border-color: color-mix(in oklab, var(--pkg-color) 50%, var(--border));
  transform: translateY(-2px);
  box-shadow: 0 12px 32px -16px rgba(0, 0, 0, 0.4);
}

/* Mode badge — "Nuxt module + framework-agnostic core" etc. — sits under the
   package name, gives at-a-glance where each package runs. */
.pkg-mode {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  color: var(--text-dim);
  width: fit-content;
}
.pkg-mode--core {
  border-color: color-mix(in oklab, var(--color-success) 35%, var(--border));
  background: color-mix(in oklab, var(--color-success) 8%, var(--surface));
  color: var(--color-success);
}
.pkg-mode--vue {
  border-color: color-mix(in oklab, var(--color-brand-3) 35%, var(--border));
  background: color-mix(in oklab, var(--color-brand-3) 8%, var(--surface));
  color: var(--color-brand-3);
}
.pkg-mode--nuxt-only {
  color: var(--text-muted);
}

/* -------------------------------------------------------------------------
 * Respect users who asked for less motion. Disable drifting/pulsing while
 * keeping the static layout intact (fade-in still applies — it's brief).
 * ----------------------------------------------------------------------- */
/* -------------------------------------------------------------------------
 * Tabbed showcase — replaces the static "ATellInput" label in the chrome bar
 * with one tab per package. The body crossfades between exhibits.
 * ----------------------------------------------------------------------- */
.hero-tabs {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
}
.hero-tab {
  position: relative;
  padding: 6px 10px;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.18s ease;
}
.hero-tab:hover {
  color: var(--text-dim);
}
.hero-tab::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-tab--active {
  color: var(--text);
}
.hero-tab--active::after {
  transform: scaleX(1);
}

/* Auto-advance progress bar — 2px hairline that fills over the 5s window. */
.hero-progress {
  position: relative;
  height: 2px;
  background: color-mix(in oklab, var(--border) 50%, transparent);
  overflow: hidden;
}
.hero-progress::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  transform-origin: left;
  transform: scaleX(0);
  animation: hero-progress 5s linear forwards;
}
.hero-progress--paused::after {
  animation-play-state: paused;
}
@keyframes hero-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* Tab indicator dots outside the card — a quick visual map of all four tabs. */
.hero-card-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
}
.hero-card-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: 0;
  background: color-mix(in oklab, var(--surface-2) 80%, transparent);
  cursor: pointer;
  transition:
    width 0.25s ease,
    background 0.25s ease;
}
.hero-card-dot:hover {
  background: var(--border);
}
.hero-card-dot--active {
  width: 22px;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
}

.hero-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--border-soft);
  background: color-mix(in oklab, var(--surface-2) 60%, transparent);
}
.hero-card__pkg {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero-card__docs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-brand);
  text-decoration: none;
  white-space: nowrap;
  transition:
    filter 0.15s ease,
    gap 0.15s ease;
}
.hero-card__docs:hover {
  filter: brightness(1.15);
  gap: 9px;
  text-decoration: none;
}

/* Exhibit base — every tab's content sits inside an `.exhibit` so the
   crossfade transition has a single root to animate. */
.exhibit {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.exhibit-enter-active,
.exhibit-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.exhibit-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.exhibit-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Exhibit header — function name as the headline, with a small tagline. */
.exhibit__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.exhibit__title {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  color: var(--text-muted);
}
.exhibit__title-fn {
  font-size: 13.5px;
  color: var(--text);
  font-weight: 600;
}
.exhibit__live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-success);
}
.exhibit__live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-success);
  box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-success) 60%, transparent);
  animation: live-pulse 2s ease-in-out infinite;
}
@keyframes live-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-success) 50%, transparent);
  }
  50% {
    box-shadow: 0 0 0 5px color-mix(in oklab, var(--color-success) 0%, transparent);
  }
}

/* The ATellInput needs a touch of breathing room from the header line. */
.exhibit__live-shell {
  margin-top: 2px;
}

/* Generic feature-chip strip pinned at the bottom of every exhibit. Same name
   as the chips used inside the crypto flow — same look, smaller padding when
   inside the `.exhibit__chips` strip. */
.exhibit__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
}
.exhibit__chip {
  display: inline-flex;
  align-items: center;
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: var(--code-bg);
  color: var(--text-dim);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.exhibit__chips .exhibit__chip {
  font-size: 10.5px;
  padding: 3px 8px;
  border-color: var(--border);
  background: color-mix(in oklab, var(--surface) 55%, transparent);
}
.exhibit__chip--out {
  color: var(--color-brand-2);
}
.exhibit__cipher {
  background: linear-gradient(
    90deg,
    var(--color-brand) 0%,
    var(--color-brand-2) 50%,
    var(--color-brand-3) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: cipher-shift 3.2s linear infinite;
}
@keyframes cipher-shift {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 200% 50%;
  }
}
.exhibit__arrow {
  color: var(--color-brand);
  font-weight: 600;
}

/* ─────────────── api-provider · request log ─────────────── */
.req-log {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.req-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--surface) 55%, transparent);
  border: 1px solid var(--border-soft);
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  color: var(--text);
  opacity: 0;
  transform: translateX(-6px);
  animation: req-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--i, 0) * 110ms + 80ms);
}
@keyframes req-in {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.req-method {
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
}
.req-method--get {
  background: color-mix(in oklab, var(--color-success) 18%, transparent);
  color: var(--color-success);
}
.req-method--post {
  background: color-mix(in oklab, var(--color-brand) 18%, transparent);
  color: var(--color-brand);
}
.req-path {
  color: var(--text-dim);
}
.req-spacer {
  flex: 1;
}
.req-progress {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.req-progress__fill {
  display: block;
  height: 100%;
  width: 67%;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  animation: req-pulse 2.4s ease-in-out infinite;
}
@keyframes req-pulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}
.req-time {
  font-size: 10.5px;
  color: var(--text-muted);
}
.req-status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.req-status--ok {
  background: color-mix(in oklab, var(--color-success) 18%, transparent);
  color: var(--color-success);
}
.req-status--pending {
  background: color-mix(in oklab, var(--color-brand) 18%, transparent);
  color: var(--color-brand);
}

/* ─────────────── crypto · lock + cipher ─────────────── */
.crypto-vis {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 14px 0 8px;
}
.crypto-lock {
  color: var(--color-brand);
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 6px 18px color-mix(in oklab, var(--color-brand) 35%, transparent));
}
.crypto-lock svg {
  width: 100%;
  height: 100%;
}
.crypto-lock__shackle {
  transform-origin: 16px 14px;
  animation: lock-shackle 4s ease-in-out infinite;
}
@keyframes lock-shackle {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  20%,
  40% {
    transform: translateY(-3px);
  }
}
.crypto-flow {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ─────────────── auto-middleware · chain ─────────────── */
.mw-chain {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mw-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 9px 12px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--surface) 55%, transparent);
  border: 1px solid var(--border-soft);
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  opacity: 0;
  transform: translateX(-6px);
  animation: req-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--i, 0) * 110ms + 80ms);
}
.mw-layout {
  color: var(--text);
  font-weight: 600;
  min-width: 84px;
}
.mw-arrow {
  color: var(--color-brand);
  font-weight: 700;
}
.mw-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-brand) 14%, transparent);
  color: var(--color-brand);
  font-size: 10.5px;
}

/* =========================================================================
 * Open package showcase (no card frame). Replaces the previous `.hero-card`
 * pattern — content sits freely in the column over the brand-glow halo.
 * ======================================================================= */
.hero-showcase {
  position: relative;
  max-width: 30rem;
  margin: 0 auto;
  padding: 8px 4px 0;
}

/* Tab strip — minimal nav with an animated underline that slides between tabs. */
.showcase-tabs {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  border-bottom: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
}
.showcase-tab {
  position: relative;
  padding: 10px 6px;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
  text-align: center;
  font-weight: 500;
}
.showcase-tab:hover {
  color: var(--text-dim);
}
.showcase-tab--active {
  color: var(--text);
  font-weight: 600;
}
/* Sliding underline — driven by CSS vars `--idx` (active tab index) and
   `--total` (tab count). 8% inset so the bar sits inside the tab width. */
.showcase-tabs__underline {
  position: absolute;
  bottom: -1px;
  left: calc(((var(--idx, 0)) / var(--total, 4)) * 100% + 8%);
  width: calc((100% / var(--total, 4)) - 16%);
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  transition: left 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

/* Auto-advance hairline below the tabs. */
.showcase-progress {
  height: 2px;
  margin-top: -1px;
  background: transparent;
  position: relative;
  overflow: hidden;
}
.showcase-progress::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--color-brand) 70%, transparent),
    color-mix(in oklab, var(--color-brand-2) 70%, transparent)
  );
  transform-origin: left;
  transform: scaleX(0);
  animation: showcase-progress 5s linear forwards;
}
.showcase-progress--paused::after {
  animation-play-state: paused;
}
@keyframes showcase-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* Active package title — function name large + tagline small. Crossfades
   when the active tab changes. */
.showcase-title {
  margin-top: 18px;
  min-height: 52px;
}
.showcase-title__inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.showcase-title__fn {
  margin: 0;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.showcase-title__tag {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-dim);
}
.title-fade-enter-active,
.title-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.title-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.title-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Body — the exhibit content sits openly here, no container. */
.showcase-body {
  margin-top: 16px;
  min-height: 220px;
}

/* Skeleton placeholder for the ATellInput SSR fallback. */
.showcase-skeleton {
  height: 43px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--surface-2) 0%,
    color-mix(in oklab, var(--surface-2) 70%, var(--surface) 30%) 50%,
    var(--surface-2) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

/* Hint line under the live ATellInput. */
.showcase-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--text-dim);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.showcase-hint__label {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
  font-weight: 600;
}
.showcase-hint code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: color-mix(in oklab, var(--surface) 60%, transparent);
  border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
}

/* Footer — package label on the left, Docs CTA on the right. No card border. */
.showcase-foot {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
}
.showcase-foot__pkg {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.showcase-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-brand);
  text-decoration: none;
  transition:
    filter 0.15s ease,
    gap 0.15s ease;
  white-space: nowrap;
}
.showcase-cta:hover {
  filter: brightness(1.15);
  gap: 9px;
  text-decoration: none;
}

/* =========================================================================
 * Open install carousel — matches the showcase aesthetic. No box, just a
 * typography line ($ pnpm add <pkg>) with a sliding-underline tab strip
 * below to switch packages.
 * ======================================================================= */
.install {
  --install-line: 1.4rem;
}
.install__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  background: color-mix(in oklab, var(--surface) 40%, transparent);
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 13px;
}
.install__prompt {
  color: var(--text-muted);
  user-select: none;
}
.install__cmd {
  flex: 1;
  min-width: 0;
  color: var(--text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.install__static {
  color: var(--text-dim);
  user-select: none;
}
.install__viewport {
  flex: 1;
  min-width: 0;
  height: var(--install-line);
  overflow: hidden;
}
.install__track {
  display: flex;
  flex-direction: column;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.install__pkg {
  height: var(--install-line);
  line-height: var(--install-line);
  color: var(--text);
  font-weight: 600;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.install__note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

/* Package indicator dots — small text buttons below the install row. The
   active one pulls forward in brand color. */
.install-dots {
  display: flex;
  gap: 4px;
  margin-top: 10px;
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
}
.install-dot {
  padding: 2px 8px;
  border-radius: 999px;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.install-dot:hover {
  color: var(--text-dim);
}
.install-dot--active {
  color: var(--text);
  background: color-mix(in oklab, var(--color-brand) 14%, transparent);
  font-weight: 600;
}
.install__copy {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.install__copy:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
}

/* Install tab strip — same sliding-underline pattern as the showcase tabs. */
.install-tabs {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 12px;
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
}
.install-tab {
  position: relative;
  padding: 8px 6px;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  text-align: center;
  font-weight: 500;
  transition: color 0.2s ease;
}
.install-tab:hover {
  color: var(--text-dim);
}
.install-tab--active {
  color: var(--text);
  font-weight: 600;
}
.install-tabs__underline {
  position: absolute;
  bottom: -1px;
  left: calc(((var(--idx, 0)) / var(--total, 4)) * 100% + 8%);
  width: calc((100% / var(--total, 4)) - 16%);
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  transition: left 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

/* GitHub text link — sits next to the primary CTA but flat / open, with an
   arrow that nudges on hover. */
.hero-link__arrow {
  transition: transform 0.2s ease;
}
.hero-link:hover .hero-link__arrow {
  transform: translateX(2px);
}

/* =========================================================================
 * Code-editor hero panel (Nuxt.com-style). Dark slate container with tabs
 * across the top, a file tree on the left, and syntax-highlighted code on
 * the right. Filling the hero's right column on lg+, stacking on mobile.
 * ======================================================================= */
.code-panel {
  position: relative;
  width: 100%;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
  background: color-mix(in oklab, var(--code-bg) 80%, var(--bg));
  box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
}

/* Top chrome: a row of small tabs, the active one underlined in brand color. */
.code-panel__chrome {
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 6px 8px 0;
  background: color-mix(in oklab, var(--bg) 70%, var(--code-bg));
  border-bottom: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  /* Only 4 tabs and they always fit — kill both scrollbars. (Setting only
     `overflow-x: auto` implicitly enables `overflow-y: auto`, which can leak
     a vertical scrollbar when the tab content is tall.) */
  overflow: hidden;
}
.code-panel__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    border-color 0.2s ease,
    background 0.15s ease;
  margin-bottom: -1px;
}
.code-panel__tab:hover {
  color: var(--text-dim);
}
.code-panel__tab--active {
  color: var(--text);
  border-bottom-color: var(--color-brand);
  background: color-mix(in oklab, var(--color-brand) 6%, transparent);
}
.code-panel__tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--text-muted) 80%, transparent);
  transition: background 0.15s ease;
}
.code-panel__tab--active .code-panel__tab-dot {
  background: var(--color-brand);
}

/* Body: code (left) + live preview (right). Stacks on mobile. */
.code-panel__body {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  min-height: 320px;
}
@media (max-width: 768px) {
  .code-panel__body {
    grid-template-columns: 1fr;
  }
}

/* File-tree sidebar. Items use a CSS var (`--indent`) for hierarchy depth. */
.code-panel__tree {
  background: color-mix(in oklab, var(--bg) 50%, transparent);
  border-right: 1px solid color-mix(in oklab, var(--border) 40%, transparent);
  padding: 10px 6px;
  font-size: 11.5px;
}
.code-panel__tree ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.code-panel__tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  color: var(--text-dim);
  padding-left: calc(6px + var(--indent, 0) * 10px);
  cursor: default;
}
.code-panel__tree-item--folder {
  color: var(--text);
}
.code-panel__tree-item--folder svg {
  color: var(--color-brand);
}
.code-panel__tree-item--file svg {
  color: var(--text-muted);
}
.code-panel__tree-item--active {
  background: color-mix(in oklab, var(--color-brand) 12%, transparent);
  color: var(--text);
}
.code-panel__tree-item--active svg {
  color: var(--color-brand);
}

/* Live preview pane — sits to the right of the code, showing the actual result
   of each package. Subtle left divider, centered content with breathing room. */
.code-panel__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 24px;
  background: color-mix(in oklab, var(--bg) 30%, transparent);
  border-left: 1px solid color-mix(in oklab, var(--border) 35%, transparent);
  min-width: 0;
  overflow: hidden;
}
@media (max-width: 768px) {
  .code-panel__preview {
    border-left: 0;
    border-top: 1px solid color-mix(in oklab, var(--border) 35%, transparent);
  }
}
.code-panel__preview-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  width: 100%;
}
.preview-hint {
  font-size: 11.5px;
  color: var(--text-muted);
  font-family: ui-monospace, monospace;
  text-align: center;
  margin: 0;
}
.preview-hint code {
  color: var(--text-dim);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
}

/* Code pane. */
.code-panel__code {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.code-panel__filename {
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in oklab, var(--border) 40%, transparent);
  font-size: 11.5px;
  color: var(--text-muted);
}
.code-panel__source {
  flex: 1;
  margin: 0;
  padding: 14px 16px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre;
  overflow-x: auto;
}

/* Syntax colors — same palette as the demo exhibits, used here on the
   syntax-highlighted code blocks. */
.code-com {
  color: var(--text-muted);
  font-style: italic;
}
.code-kw {
  color: var(--color-brand-3);
}
.code-fn {
  color: var(--color-brand);
}
.code-str {
  color: var(--color-success);
}
.code-num {
  color: var(--color-brand-2);
}
.code-type {
  color: var(--color-brand-2);
}
.code-tag {
  color: color-mix(in oklab, var(--color-brand-3) 70%, var(--text));
}

/* Smooth fade when switching tabs. */
.code-fade-enter-active,
.code-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.code-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.code-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .hero-orb,
  .hero-glow,
  .cta-primary,
  .hero-card__skeleton,
  .showcase-skeleton,
  .exhibit__cipher,
  .crypto-lock__shackle,
  .req-progress__fill,
  .req-row,
  .mw-row,
  .showcase-progress::after {
    animation: none !important;
  }
  .req-row,
  .mw-row {
    opacity: 1 !important;
    transform: none !important;
  }
  .showcase-tabs__underline,
  .install-tabs__underline,
  .install__track,
  .hero-link__arrow,
  .code-fade-enter-active,
  .code-fade-leave-active {
    transition: none !important;
  }
}
</style>
