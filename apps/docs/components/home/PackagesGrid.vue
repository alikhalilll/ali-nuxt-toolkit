<script setup lang="ts">
/**
 * The "Packages" section beneath the hero — a 4-card grid (each card links to
 * its docs + npm page). Includes a "framework-agnostic core" note at the top
 * since most packages ship a `…/core` subpath.
 */
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

const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24">
    <div class="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-text sm:text-2xl">Packages</h2>
        <p class="mt-1 text-sm text-text-dim">
          Each package is independently installable. Most ship a
          <strong class="text-text">framework-agnostic core</strong>
          at <code class="px-1 py-0.5 text-[12px] font-mono text-text">…/core</code> — usable in any
          JS/TS project; the Nuxt entry just wires the autoimports.
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
</template>

<style scoped>
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

.pkg-card:hover {
  border-color: color-mix(in oklab, var(--pkg-color) 50%, var(--border));
  transform: translateY(-2px);
  box-shadow: 0 12px 32px -16px rgba(0, 0, 0, 0.4);
}

/* Mode badge — sits under the package name. */
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
</style>
