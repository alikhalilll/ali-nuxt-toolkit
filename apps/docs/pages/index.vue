<script setup lang="ts">
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
  accent: 'api' | 'crypto' | 'auto';
}

const installCommands = [
  'pnpm add @alikhalilll/nuxt-api-provider',
  'pnpm add @alikhalilll/nuxt-crypto',
  'pnpm add @alikhalilll/nuxt-auto-middleware',
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
];
</script>

<template>
  <section class="relative isolate overflow-hidden">
    <div class="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
      <!-- Announcement pill -->
      <div class="mb-8 flex justify-center">
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
          <span>Nuxt 4 support shipped</span>
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

      <!-- Hero -->
      <div class="mx-auto max-w-3xl text-center">
        <h1
          class="mb-6 text-4xl font-bold tracking-tight text-text sm:text-5xl md:text-6xl"
          style="letter-spacing: -0.03em; line-height: 1.05"
        >
          <span class="text-gradient-brand">Strongly-typed</span> Nuxt modules.<br />
          <span class="text-text-dim">Pick one, or all three.</span>
        </h1>
        <p class="mx-auto mb-8 max-w-2xl text-base text-text-dim sm:text-lg">
          A typed fetch client with retry and progress. AES-GCM + PBKDF2 crypto. Layout-based route
          middleware. Built for Nuxt 3 and 4 — independently usable, zero overlap.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <NuxtLink
            to="/api-provider"
            class="bg-gradient-brand inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-semibold !text-black shadow-[0_4px_24px_-8px_rgba(74,222,128,0.6)] transition-[filter] hover:brightness-110 hover:no-underline"
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
        <div class="mx-auto mt-10 max-w-xl">
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
          <div class="mt-3 flex justify-center gap-1.5">
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
    </div>

    <!-- Packages grid -->
    <div class="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-text sm:text-2xl">Packages</h2>
          <p class="mt-1 text-sm text-text-dim">
            Each package is independently installable. Same ergonomics across all three.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="pkg in packages"
          :key="pkg.name"
          :class="[
            `pkg-${pkg.accent}`,
            'group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface/40 p-5 transition-colors',
          ]"
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
