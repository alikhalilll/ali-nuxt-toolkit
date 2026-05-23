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
}

const installCommands = [
  'pnpm add @alikhalilll/nuxt-api-provider',
  'pnpm add @alikhalilll/nuxt-crypto',
  'pnpm add @alikhalilll/nuxt-auto-middleware',
  'pnpm add @alikhalilll/ui',
];
const installIndex = ref(0);
const installCopied = ref(false);
let installTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  installTimer = setInterval(() => {
    installIndex.value = (installIndex.value + 1) % installCommands.length;
  }, 1800);
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
  },
  {
    name: '@alikhalilll/nuxt-crypto',
    docs: '/crypto',
    npm: 'https://www.npmjs.com/package/@alikhalilll/nuxt-crypto',
    description:
      'AES-256-GCM + PBKDF2 via the Web Crypto API, with key caching and pluggable algorithms. Server-only mode keeps the passphrase off the client.',
    accent: 'crypto',
  },
  {
    name: '@alikhalilll/nuxt-auto-middleware',
    docs: '/auto-middleware',
    npm: 'https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware',
    description:
      'Layout → middleware mapping with glob patterns, named groups, per-page overrides, and a typed middleware-name registry.',
    accent: 'auto',
  },
  {
    name: '@alikhalilll/ui',
    docs: '/ui',
    npm: 'https://www.npmjs.com/package/@alikhalilll/ui',
    description:
      'Headless Vue 3 components — ATellInput, APopover, ADrawer, AResponsivePopover, AInput. Each lives behind its own subpath import (`@alikhalilll/ui/tell-input`, …) so you only ship the components you use.',
    accent: 'ui',
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
  docs: string;
}
const showcaseTabs: ShowcaseTab[] = [
  { id: 'ui', short: 'ui', label: '@alikhalilll/ui', docs: '/ui' },
  {
    id: 'api-provider',
    short: 'api',
    label: '@alikhalilll/nuxt-api-provider',
    docs: '/api-provider',
  },
  { id: 'crypto', short: 'crypto', label: '@alikhalilll/nuxt-crypto', docs: '/crypto' },
  {
    id: 'auto-middleware',
    short: 'middleware',
    label: '@alikhalilll/nuxt-auto-middleware',
    docs: '/auto-middleware',
  },
];
const showcaseIndex = ref(0);
const showcaseManual = ref(false);
let showcaseTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  showcaseTimer = setInterval(() => {
    if (showcaseManual.value) return;
    showcaseIndex.value = (showcaseIndex.value + 1) % showcaseTabs.length;
  }, 5000);
});

onBeforeUnmount(() => {
  if (showcaseTimer) clearInterval(showcaseTimer);
});

function selectShowcase(i: number) {
  showcaseIndex.value = i;
  showcaseManual.value = true;
}

const currentShowcase = computed(() => showcaseTabs[showcaseIndex.value]);
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
    <div class="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
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

      <!-- Hero grid: text on the left, live component on the right (lg+) -->
      <div class="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <!-- Left: title, copy, CTAs, install carousel -->
        <div class="text-center lg:text-left">
          <h1
            class="mb-6 text-4xl font-bold tracking-tight text-text sm:text-5xl md:text-6xl"
            style="letter-spacing: -0.03em; line-height: 1.05"
          >
            <span class="word" style="--i: 0"
              ><span class="text-gradient-brand">Strongly-typed</span></span
            >
            <span class="word" style="--i: 1">toolkit</span>
            <span class="word" style="--i: 2">for</span>
            <span class="word" style="--i: 3">Nuxt.</span>
            <br />
            <span class="text-text-dim">
              <span class="word" style="--i: 4">Pick</span>
              <span class="word" style="--i: 5">one,</span>
              <span class="word" style="--i: 6">or</span>
              <span class="word" style="--i: 7">all</span>
              <span class="word" style="--i: 8">four.</span>
            </span>
          </h1>

          <p
            class="reveal mx-auto mb-8 max-w-2xl text-base text-text-dim sm:text-lg lg:mx-0"
            :class="{ 'reveal--in': mounted }"
            style="--reveal-delay: 700ms"
          >
            A typed fetch client with retry and progress. AES-GCM + PBKDF2 crypto. Layout-based
            route middleware. A tree-shakable headless component library. Built for Nuxt 3 / 4 and
            Vue 3 — independently usable, zero overlap.
          </p>

          <div
            class="reveal flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            :class="{ 'reveal--in': mounted }"
            style="--reveal-delay: 850ms"
          >
            <NuxtLink
              to="/api-provider"
              class="cta-primary bg-gradient-brand inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-semibold !text-black shadow-[0_4px_24px_-8px_rgba(96,165,250,0.6)] transition-[filter] hover:brightness-110 hover:no-underline"
            >
              Get Started
            </NuxtLink>
            <a
              href="https://github.com/alikhalilll/ali-nuxt-toolkit"
              target="_blank"
              rel="noopener"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-5 text-sm font-medium text-text transition-colors hover:bg-surface hover:no-underline"
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
              GitHub
            </a>
          </div>

          <!-- Install command (sliding carousel) -->
          <div
            class="reveal mt-10 lg:mx-0 lg:max-w-xl"
            :class="{ 'reveal--in': mounted }"
            style="--reveal-delay: 1000ms"
          >
            <div
              class="install-slider flex items-center gap-3 rounded-md border border-border bg-code-bg px-4 py-2.5 font-mono text-[13px] text-text"
            >
              <span class="text-text-muted" aria-hidden="true">$</span>
              <div class="install-slider__viewport flex-1 text-left" aria-live="polite">
                <div
                  class="install-slider__track"
                  :style="{ transform: `translateY(calc(-${installIndex} * var(--install-line)))` }"
                >
                  <div v-for="cmd in installCommands" :key="cmd" class="install-slider__item">
                    {{ cmd }}
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-text-dim transition-colors hover:bg-surface hover:text-text"
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

            <!-- Dots indicator -->
            <div class="mt-3 flex justify-center gap-1.5 lg:justify-start">
              <button
                v-for="(cmd, i) in installCommands"
                :key="cmd"
                type="button"
                :aria-label="`Show install command ${i + 1}`"
                :aria-current="installIndex === i ? 'true' : undefined"
                class="h-1.5 rounded-full transition-all"
                :class="installIndex === i ? 'w-5 bg-text' : 'w-1.5 bg-surface-2 hover:bg-border'"
                @click="installIndex = i"
              />
            </div>
          </div>
        </div>

        <!-- Right: tabbed package showcase. Rotates through every package so the hero
             represents the whole toolkit, not just the UI lib. -->
        <div
          class="hero-card-wrap reveal"
          :class="{ 'reveal--in': mounted }"
          style="--reveal-delay: 600ms"
        >
          <div class="hero-glow" aria-hidden="true" />
          <div class="hero-card">
            <div class="hero-card__chrome">
              <span class="hero-dot hero-dot--r" />
              <span class="hero-dot hero-dot--y" />
              <span class="hero-dot hero-dot--g" />
              <div class="hero-tabs" role="tablist" aria-label="Package showcase">
                <button
                  v-for="(tab, i) in showcaseTabs"
                  :key="tab.id"
                  type="button"
                  role="tab"
                  :aria-selected="showcaseIndex === i"
                  :class="['hero-tab', showcaseIndex === i && 'hero-tab--active']"
                  @click="selectShowcase(i)"
                >
                  {{ tab.short }}
                </button>
              </div>
            </div>

            <div class="hero-card__body">
              <Transition name="exhibit" mode="out-in">
                <!-- ATellInput live demo -->
                <div v-if="currentShowcase.id === 'ui'" key="ui" class="exhibit">
                  <ClientOnly>
                    <ATellInput v-model:phone="heroPhone" v-model:country="heroCountry" />
                    <template #fallback>
                      <div class="hero-card__skeleton" />
                    </template>
                  </ClientOnly>
                  <p class="hero-card__hint">
                    <span class="hero-card__hint-label">Try:</span>
                    <code>+447911 123 456</code>
                    <span aria-hidden="true">·</span>
                    <code dir="rtl">٠١٠٦٦١٠٥٩٦٣</code>
                  </p>
                </div>

                <!-- nuxt-api-provider — typed fetch with progress -->
                <div v-else-if="currentShowcase.id === 'api-provider'" key="api" class="exhibit">
                  <pre
                    class="exhibit__code"
                  ><span class="ex-com">// Typed fetch · retry · upload + download progress</span>
<span class="ex-kw">const</span> { data, pending, refresh } = <span class="ex-fn">useApi</span>&lt;<span class="ex-type">User</span>&gt;(<span class="ex-str">'/users/1'</span>, {
  retry: <span class="ex-num">3</span>,
  <span class="ex-fn">onProgress</span>: (p) =&gt; loaded.value = p,
});</pre>
                  <div class="exhibit__bar" aria-hidden="true">
                    <span class="exhibit__bar-label">GET /users/1</span>
                    <span class="exhibit__bar-track">
                      <span class="exhibit__bar-fill" />
                    </span>
                    <span class="exhibit__bar-pct">retrying…</span>
                  </div>
                </div>

                <!-- nuxt-crypto — AES-256-GCM round-trip -->
                <div v-else-if="currentShowcase.id === 'crypto'" key="crypto" class="exhibit">
                  <pre
                    class="exhibit__code"
                  ><span class="ex-com">// AES-256-GCM · PBKDF2 · key cache</span>
<span class="ex-kw">const</span> { encrypt, decrypt } = <span class="ex-fn">useCrypto</span>({ passphrase });

<span class="ex-kw">const</span> token = <span class="ex-kw">await</span> <span class="ex-fn">encrypt</span>(<span class="ex-str">'hello, world'</span>);</pre>
                  <div class="exhibit__flow" aria-hidden="true">
                    <span class="exhibit__chip exhibit__chip--in">"hello, world"</span>
                    <span class="exhibit__arrow">→</span>
                    <span class="exhibit__chip exhibit__chip--out exhibit__cipher"
                      >a4b8e9c5f2d1…</span
                    >
                  </div>
                </div>

                <!-- nuxt-auto-middleware — layout → middleware mapping -->
                <div
                  v-else-if="currentShowcase.id === 'auto-middleware'"
                  key="middleware"
                  class="exhibit"
                >
                  <pre
                    class="exhibit__code"
                  ><span class="ex-com">// One mapping. Every page in the layout gets it.</span>
<span class="ex-kw">export default</span> <span class="ex-fn">defineLayoutMiddleware</span>({
  admin:     [<span class="ex-str">'auth'</span>, <span class="ex-str">'requireRole:admin'</span>, <span class="ex-str">'log'</span>],
  dashboard: [<span class="ex-str">'auth'</span>, <span class="ex-str">'log'</span>],
  default:   [<span class="ex-str">'log'</span>],
});</pre>
                  <div class="exhibit__map" aria-hidden="true">
                    <div class="exhibit__row">
                      <span class="exhibit__layout">layout: admin</span>
                      <span class="exhibit__arrow">→</span>
                      <span class="exhibit__mw">auth</span>
                      <span class="exhibit__mw">role:admin</span>
                      <span class="exhibit__mw">log</span>
                    </div>
                    <div class="exhibit__row">
                      <span class="exhibit__layout">layout: dashboard</span>
                      <span class="exhibit__arrow">→</span>
                      <span class="exhibit__mw">auth</span>
                      <span class="exhibit__mw">log</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Footer: package label + Docs link for the active tab. -->
            <div class="hero-card__footer">
              <span class="hero-card__pkg">{{ currentShowcase.label }}</span>
              <NuxtLink :to="currentShowcase.docs" class="hero-card__docs">Docs →</NuxtLink>
            </div>
          </div>

          <!-- Floating feature pills -->
          <span class="hero-pill hero-pill--1">TypeScript-first</span>
          <span class="hero-pill hero-pill--2">Tree-shakable</span>
          <span class="hero-pill hero-pill--3">SSR-safe</span>
          <span class="hero-pill hero-pill--4">Nuxt 3 / 4</span>
        </div>
      </div>
    </div>

    <!-- Packages grid -->
    <div class="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-text sm:text-2xl">Packages</h2>
          <p class="mt-1 text-sm text-text-dim">
            Each package is independently installable. The UI lib ships its components behind their
            own subpath imports, so you only bundle what you actually use.
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
          <p class="mb-5 flex-1 text-sm text-text-dim">{{ pkg.description }}</p>
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
  opacity: 0.35;
  will-change: transform;
  animation: orb-drift 22s ease-in-out infinite alternate;
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
  animation-direction: alternate-reverse;
  animation-duration: 28s;
  opacity: 0.28;
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
  animation-duration: 32s;
  animation-delay: -10s;
  opacity: 0.22;
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

/* Primary CTA: subtle pulsing glow for the first few seconds after mount. */
.cta-primary {
  position: relative;
  animation: cta-pulse 2.4s ease-in-out 1s 2;
}
@keyframes cta-pulse {
  0%,
  100% {
    box-shadow: 0 4px 24px -8px color-mix(in oklab, var(--color-brand) 60%, transparent);
  }
  50% {
    box-shadow:
      0 4px 28px -4px color-mix(in oklab, var(--color-brand) 80%, transparent),
      0 0 0 4px color-mix(in oklab, var(--color-brand) 18%, transparent);
  }
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
    color-mix(in oklab, var(--color-brand) 35%, transparent) 0%,
    transparent 70%
  );
  filter: blur(40px);
  opacity: 0.7;
  pointer-events: none;
  animation: glow-breathe 6s ease-in-out infinite;
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
  gap: 4px;
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
}
.hero-tab {
  position: relative;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.hero-tab:hover {
  color: var(--text-dim);
  background: color-mix(in oklab, var(--surface) 60%, transparent);
}
.hero-tab--active {
  color: var(--color-brand);
  background: color-mix(in oklab, var(--color-brand) 14%, transparent);
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
  font-size: 12px;
  font-weight: 600;
  color: var(--color-brand);
  text-decoration: none;
  white-space: nowrap;
  transition: filter 0.15s ease;
}
.hero-card__docs:hover {
  filter: brightness(1.15);
}

/* Exhibit base — every tab's content sits inside an `.exhibit` so the
   crossfade transition has a single root to animate. */
.exhibit {
  min-height: 175px;
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

.exhibit__code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text);
  background: var(--code-bg);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 0;
  white-space: pre;
  overflow-x: auto;
}
.ex-com {
  color: var(--text-muted);
  font-style: italic;
}
.ex-kw {
  color: var(--color-brand-3);
}
.ex-fn {
  color: var(--color-brand);
}
.ex-str {
  color: var(--color-success);
}
.ex-num {
  color: var(--color-brand-2);
}
.ex-type {
  color: var(--color-brand-2);
}

/* api-provider exhibit — fake progress bar that loops forever. */
.exhibit__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-dim);
}
.exhibit__bar-label {
  color: var(--text-muted);
}
.exhibit__bar-track {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.exhibit__bar-fill {
  display: block;
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  animation: bar-progress 2.6s ease-in-out infinite;
}
@keyframes bar-progress {
  0% {
    width: 0;
  }
  70% {
    width: 100%;
  }
  100% {
    width: 100%;
    opacity: 0;
  }
}
.exhibit__bar-pct {
  color: var(--color-brand-2);
  font-size: 10.5px;
  letter-spacing: 0.04em;
}

/* crypto exhibit — input → cipher chip with a shifting gradient. */
.exhibit__flow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
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

/* auto-middleware exhibit — visual layout → middleware mapping. */
.exhibit__map {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exhibit__row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-family: ui-monospace, monospace;
  font-size: 11px;
}
.exhibit__layout {
  color: var(--text-dim);
}
.exhibit__mw {
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-brand) 12%, transparent);
  color: var(--color-brand);
  font-size: 10.5px;
}

@media (prefers-reduced-motion: reduce) {
  .hero-orb,
  .hero-glow,
  .cta-primary,
  .hero-card__skeleton,
  .exhibit__bar-fill,
  .exhibit__cipher {
    animation: none !important;
  }
  .hero-card {
    transform: none !important;
  }
}
</style>
