<script setup lang="ts">
const year = new Date().getFullYear();

const social = [
  {
    label: 'GitHub',
    href: 'https://github.com/alikhalilll',
    icon: 'github',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/alikhalilll',
    icon: 'linkedin',
  },
  {
    label: 'Portfolio',
    href: 'https://alikhalilll.github.io/',
    icon: 'portfolio',
  },
  {
    label: 'Repository',
    href: 'https://github.com/alikhalilll/ali-nuxt-toolkit',
    icon: 'repo',
  },
];

const packages = [
  { label: 'api-provider', to: '/api-provider', accent: 'pkg-api' },
  { label: 'crypto', to: '/crypto', accent: 'pkg-crypto' },
  { label: 'auto-middleware', to: '/auto-middleware', accent: 'pkg-auto' },
];
</script>

<template>
  <footer
    class="mt-24 border-t border-border bg-bg/40 backdrop-blur-sm"
    role="contentinfo"
    aria-label="Site footer"
  >
    <div class="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 md:gap-10">
      <!-- Brand -->
      <div>
        <NuxtLink to="/" class="inline-flex items-center gap-2.5 hover:no-underline">
          <span
            class="bg-gradient-brand inline-flex h-9 w-10 items-center justify-center rounded text-xs font-bold tracking-tight !text-black"
            aria-hidden="true"
          >
            ANT
          </span>
          <span class="text-base font-semibold text-text">ali-nuxt-toolkit</span>
        </NuxtLink>
        <p class="mt-3 max-w-xs text-sm text-text-dim">
          Three focused, strongly-typed Nuxt 3 / 4 modules. Crafted with care by a developer who
          loves the details.
        </p>
      </div>

      <!-- Packages -->
      <div>
        <h4 class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Packages
        </h4>
        <ul class="m-0 list-none space-y-2.5 p-0 text-base">
          <li v-for="pkg in packages" :key="pkg.to" :class="pkg.accent">
            <NuxtLink
              :to="pkg.to"
              class="inline-flex items-center gap-2 font-medium text-text-dim transition-colors hover:text-text hover:no-underline"
            >
              <span class="pkg-dot" aria-hidden="true" />
              {{ pkg.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Social + About -->
      <div>
        <h4 class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Connect
        </h4>
        <div class="flex flex-wrap gap-2">
          <a
            v-for="item in social"
            :key="item.label"
            :href="item.href"
            target="_blank"
            rel="noopener"
            :aria-label="item.label"
            class="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface/40 px-3 text-xs text-text-dim transition-colors hover:border-brand/60 hover:text-text hover:no-underline"
          >
            <!-- GitHub -->
            <svg
              v-if="item.icon === 'github'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
              />
            </svg>
            <!-- LinkedIn -->
            <svg
              v-else-if="item.icon === 'linkedin'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M20.45 20.45h-3.55v-5.56c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.65H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"
              />
            </svg>
            <!-- Portfolio / globe -->
            <svg
              v-else-if="item.icon === 'portfolio'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <!-- Repo / box -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M2 7l10-5 10 5-10 5L2 7z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {{ item.label }}
          </a>
        </div>
        <p class="mt-4 text-xs text-text-dim">
          Feedback:
          <a
            href="mailto:alikhalilll.dev@gmail.com"
            class="text-text transition-colors hover:text-brand"
          >
            alikhalilll.dev@gmail.com
          </a>
        </p>
      </div>
    </div>

    <div class="border-t border-border">
      <div
        class="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-4 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <p>
          Built by
          <a
            href="https://github.com/alikhalilll"
            target="_blank"
            rel="noopener"
            class="font-medium text-text transition-colors hover:text-brand"
          >
            Ali Khalil
          </a>
          · Licensed
          <a
            href="https://github.com/alikhalilll/ali-nuxt-toolkit/blob/master/LICENSE"
            target="_blank"
            rel="noopener"
            class="hover:text-text"
          >
            MIT
          </a>
          · © {{ year }}
        </p>
        <p class="text-text-muted">
          Source on
          <a
            href="https://github.com/alikhalilll/ali-nuxt-toolkit"
            target="_blank"
            rel="noopener"
            class="text-text transition-colors hover:text-brand"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>
