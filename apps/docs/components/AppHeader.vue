<script setup lang="ts">
import { APopover, APopoverContent, APopoverTrigger } from '@alikhalilll/ui';

const route = useRoute();
const mobileNavOpen = useMobileNavOpen();
const { pref, set: setMode } = useColorMode();

const navLinks = [
  { to: '/api-provider', label: 'api-provider' },
  { to: '/crypto', label: 'crypto' },
  { to: '/auto-middleware', label: 'auto-middleware' },
  { to: '/ui', label: 'ui' },
];

const themeOptions = [
  { value: 'light' as const, label: 'Light', desc: 'Locked light theme' },
  { value: 'dark' as const, label: 'Dark', desc: 'Locked dark theme' },
  { value: 'system' as const, label: 'System', desc: 'Follow OS preference' },
];

const themePopoverOpen = ref(false);

function selectTheme(value: 'light' | 'dark' | 'system') {
  setMode(value);
  themePopoverOpen.value = false;
}

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false;
  }
);
</script>

<template>
  <header
    class="sticky top-0 z-30 w-full border-b border-border/60 bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60"
  >
    <div class="mx-auto flex h-16 max-w-[1400px] items-center px-4 sm:px-6">
      <!-- Logo + mobile toggle -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface hover:text-text md:hidden"
          aria-label="Toggle navigation"
          :aria-expanded="mobileNavOpen"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          <svg
            v-if="!mobileNavOpen"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <NuxtLink to="/" class="mr-6 flex items-center gap-2.5 hover:no-underline">
          <span
            class="bg-gradient-brand inline-flex h-8 w-9 items-center justify-center rounded text-[11px] font-bold tracking-tight !text-black"
            aria-hidden="true"
          >
            ANT
          </span>
          <span class="hidden text-base font-semibold text-text sm:inline">ali-nuxt-toolkit</span>
        </NuxtLink>
      </div>

      <!-- Inline nav (desktop) -->
      <nav class="hidden items-center gap-6 text-base md:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="font-medium text-text-dim transition-colors hover:text-text hover:no-underline"
          active-class="!text-accent-2 font-semibold"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Right side -->
      <div class="ml-auto flex items-center gap-1">
        <!-- Theme switcher — popover with Light / Dark / System -->
        <APopover v-model:open="themePopoverOpen" :modal="false">
          <APopoverTrigger as-child>
            <button
              type="button"
              aria-label="Theme settings"
              title="Theme settings"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface hover:text-text"
            >
              <!-- Sun -->
              <svg
                v-if="pref === 'light'"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <!-- Moon -->
              <svg
                v-else-if="pref === 'dark'"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <!-- Monitor (system) -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
            </button>
          </APopoverTrigger>

          <APopoverContent
            align="end"
            :side-offset="6"
            class="w-44 rounded-md border border-border bg-surface p-1 shadow-lg"
          >
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              type="button"
              :data-active="opt.value === pref || undefined"
              class="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm text-text-dim transition-colors hover:bg-surface-2 hover:text-text data-[active]:bg-surface-2 data-[active]:text-text"
              @click="selectTheme(opt.value)"
            >
              <!-- Per-option icon -->
              <svg
                v-if="opt.value === 'light'"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <svg
                v-else-if="opt.value === 'dark'"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
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
                class="shrink-0"
              >
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>

              <span class="flex-1">{{ opt.label }}</span>

              <!-- Active check -->
              <svg
                v-if="opt.value === pref"
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-brand"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </APopoverContent>
        </APopover>

        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit"
          target="_blank"
          rel="noopener"
          aria-label="GitHub repository"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
            />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/alikhalilll"
          target="_blank"
          rel="noopener"
          aria-label="LinkedIn"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M20.45 20.45h-3.55v-5.56c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.65H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"
            />
          </svg>
        </a>
      </div>
    </div>

    <!-- Mobile page nav — TOC now lives in MobileTocBar below the main header -->
    <div v-if="mobileNavOpen" class="border-t border-border bg-bg md:hidden">
      <nav class="mx-auto max-w-[1400px] px-4 py-3 text-sm">
        <ul class="m-0 list-none p-0">
          <li>
            <NuxtLink
              to="/"
              class="block rounded-md px-3 py-2 text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
              active-class="!text-accent-2 font-medium"
              exact-active-class="!text-accent-2 font-medium"
              @click="mobileNavOpen = false"
            >
              Introduction
            </NuxtLink>
          </li>
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="block rounded-md px-3 py-2 text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
              active-class="!text-accent-2 font-medium"
              @click="mobileNavOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>

        <div class="mt-4 border-t border-border pt-3">
          <a
            href="https://github.com/alikhalilll/ali-nuxt-toolkit"
            target="_blank"
            rel="noopener"
            class="block rounded-md px-3 py-2 text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
            @click="mobileNavOpen = false"
          >
            GitHub →
          </a>
        </div>
      </nav>
    </div>
  </header>
</template>
