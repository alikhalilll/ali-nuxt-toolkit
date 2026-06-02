<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { ChevronDownIcon } from '~/components/icons';

const route = useRoute();
const mobileNavOpen = useMobileNavOpen();
const { pref, set: setMode } = useColorMode();

const navLinks = [
  { to: '/api-provider', label: 'api-provider' },
  { to: '/crypto', label: 'crypto' },
  { to: '/auto-middleware', label: 'auto-middleware' },
];

const uiNavItems: { to: string; label: string; pkg?: string }[] = [
  { to: '/ui', label: 'Overview' },
  { to: '/ui/tel-input', label: 'ATelInput', pkg: 'a-tel-input' },
];

const uiNavOpen = ref(false);
const uiNavEl = ref<HTMLElement | null>(null);
const uiIsActive = computed(() => route.fullPath.startsWith('/ui'));
onClickOutside(uiNavEl, () => (uiNavOpen.value = false));

const themeOptions = [
  { value: 'light' as const, label: 'Light', desc: 'Locked light theme' },
  { value: 'dark' as const, label: 'Dark', desc: 'Locked dark theme' },
  { value: 'system' as const, label: 'System', desc: 'Follow OS preference' },
];

const themePopoverOpen = ref(false);
const themePopoverEl = ref<HTMLElement | null>(null);
onClickOutside(themePopoverEl, () => (themePopoverOpen.value = false));

function selectTheme(value: 'light' | 'dark' | 'system') {
  setMode(value);
  themePopoverOpen.value = false;
}

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false;
    uiNavOpen.value = false;
  }
);

// Subtle micro-shift to the header background on scroll — denser blur + a hairline
// shadow once the page has scrolled past the fold, so the bar feels anchored.
const scrolled = ref(false);
function onScroll() {
  scrolled.value = window.scrollY > 4;
}
onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <header
    class="app-header sticky top-0 z-30 w-full"
    :class="scrolled ? 'app-header--scrolled' : 'app-header--top'"
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

        <!-- Brand: 2×2 brand-gradient mark + wordmark. The mark hovers up a touch. -->
        <NuxtLink to="/" class="brand mr-6 flex items-center gap-2.5 hover:no-underline">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient
                  id="brand-grad"
                  x1="0"
                  y1="0"
                  x2="24"
                  y2="24"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="var(--color-brand)" />
                  <stop offset="0.5" stop-color="var(--color-brand-2)" />
                  <stop offset="1" stop-color="var(--color-brand-3)" />
                </linearGradient>
              </defs>
              <!-- Initials on the diagonal — A top-left, K bottom-right. Solid black
                   to match the site favicon exactly. -->
              <rect x="2" y="2" width="9" height="9" rx="2" fill="url(#brand-grad)" />
              <text
                x="6.5"
                y="10"
                text-anchor="middle"
                font-family="ui-monospace, 'JetBrains Mono', monospace"
                font-size="9"
                font-weight="800"
                letter-spacing="-0.3"
                fill="#000000"
              >
                A
              </text>
              <rect
                x="13.25"
                y="2.25"
                width="8.5"
                height="8.5"
                rx="1.85"
                fill="url(#brand-grad)"
                opacity="0.55"
              />
              <rect
                x="2.25"
                y="13.25"
                width="8.5"
                height="8.5"
                rx="1.85"
                fill="url(#brand-grad)"
                opacity="0.55"
              />
              <rect x="13" y="13" width="9" height="9" rx="2" fill="url(#brand-grad)" />
              <text
                x="17.5"
                y="21"
                text-anchor="middle"
                font-family="ui-monospace, 'JetBrains Mono', monospace"
                font-size="9"
                font-weight="800"
                letter-spacing="-0.3"
                fill="#000000"
              >
                K
              </text>
            </svg>
          </span>
          <span class="brand-word">
            <span class="brand-scope">ali-nuxt</span><span class="brand-sep">/</span
            ><span class="brand-name">toolkit</span>
          </span>
        </NuxtLink>
      </div>

      <!-- Inline nav (desktop) — animated underline on hover/active. -->
      <nav class="nav-links hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          active-class="nav-link--active"
        >
          {{ link.label }}
        </NuxtLink>

        <div ref="uiNavEl" class="relative">
          <button
            type="button"
            class="nav-link nav-link--trigger"
            :class="uiIsActive && 'nav-link--active'"
            :aria-expanded="uiNavOpen"
            aria-haspopup="menu"
            @click="uiNavOpen = !uiNavOpen"
          >
            ui
            <ChevronDownIcon
              class="ml-0.5 inline size-3 transition-transform"
              :class="uiNavOpen && 'rotate-180'"
              aria-hidden="true"
            />
          </button>
          <!-- UI mega-menu — glassy panel with a brand monogram per component,
               component name + npm pkg badge, and a "Browse all" footer link. -->
          <div v-if="uiNavOpen" class="ui-mega absolute left-0 top-full mt-3 w-[22rem]" role="menu">
            <div class="ui-mega__eyebrow">
              <span class="ui-mega__eyebrow-dot" aria-hidden="true" />
              <span>@alikhalilll · UI</span>
              <span class="ui-mega__eyebrow-tag">Vue 3 · headless</span>
            </div>
            <div class="ui-mega__grid">
              <NuxtLink
                v-for="item in uiNavItems"
                :key="item.to"
                :to="item.to"
                :title="item.pkg ? `${item.label} · @alikhalilll/${item.pkg}` : item.label"
                class="ui-mega__item"
                active-class="ui-mega__item--active"
                @click="uiNavOpen = false"
              >
                <span class="ui-mega__mark" aria-hidden="true">
                  {{ item.pkg ? item.label.charAt(1).toUpperCase() : '◇' }}
                </span>
                <span class="ui-mega__body">
                  <span class="ui-mega__label">{{ item.label }}</span>
                  <span v-if="item.pkg" class="ui-mega__pkg"> @alikhalilll/{{ item.pkg }} </span>
                  <span v-else class="ui-mega__pkg ui-mega__pkg--muted"> Overview · theming </span>
                </span>
                <span class="ui-mega__chev" aria-hidden="true">→</span>
              </NuxtLink>
            </div>
            <NuxtLink to="/ui" class="ui-mega__footer" @click="uiNavOpen = false">
              Browse all components
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- Right side -->
      <div class="ml-auto flex items-center gap-1.5">
        <!-- Version chip — links to the changeset releases on GitHub. -->
        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit/releases"
          target="_blank"
          rel="noopener"
          class="version-chip hidden items-center gap-1 sm:inline-flex"
          aria-label="Latest releases"
        >
          <span class="version-chip__dot" />
          <span class="version-chip__label">Latest</span>
        </a>

        <!-- Theme switcher — dropdown with Light / Dark / System -->
        <div ref="themePopoverEl" class="relative">
          <button
            type="button"
            aria-label="Theme settings"
            title="Theme settings"
            class="icon-btn"
            :aria-expanded="themePopoverOpen"
            aria-haspopup="menu"
            @click="themePopoverOpen = !themePopoverOpen"
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
          <div
            v-if="themePopoverOpen"
            class="absolute right-0 top-full mt-2 w-44 rounded-md border border-border bg-surface p-1 shadow-lg"
            role="menu"
          >
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              type="button"
              :data-active="opt.value === pref || undefined"
              class="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm text-text-dim transition-colors hover:bg-surface-2 hover:text-text data-[active]:bg-surface-2 data-[active]:text-text"
              @click="selectTheme(opt.value)"
            >
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
          </div>
        </div>

        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit"
          target="_blank"
          rel="noopener"
          aria-label="GitHub repository"
          class="icon-btn"
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
          class="icon-btn"
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

    <!-- Mobile page nav -->
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
          <li>
            <div
              class="mt-1 px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-text-dim uppercase"
            >
              ui
            </div>
            <ul class="m-0 list-none p-0">
              <li v-for="item in uiNavItems" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="mobile-ui-item block rounded-md px-3 py-2 text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
                  active-class="!text-accent-2 font-medium"
                  @click="mobileNavOpen = false"
                >
                  <span class="block leading-tight">{{ item.label }}</span>
                  <!--
                    Package badge mirrors the desktop dropdown — keeps the new split
                    structure obvious on touch devices too.
                  -->
                  <span
                    v-if="item.pkg"
                    class="block font-mono text-[10.5px] leading-tight text-text-muted/70"
                  >
                    @alikhalilll/{{ item.pkg }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
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

<style scoped>
/* Header chrome — translucent at the top of the page, denser blur + a hairline
   brand-tinted shadow once the user has scrolled past the fold. */
.app-header {
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.app-header--top {
  background: color-mix(in oklab, var(--bg) 40%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid transparent;
}
.app-header--scrolled {
  background: color-mix(in oklab, var(--bg) 70%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  box-shadow: 0 1px 0 0 color-mix(in oklab, var(--color-brand) 8%, transparent);
}

/* Brand monogram — 2×2 squares with the brand gradient. Lifts on hover. */
.brand-mark {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in oklab, var(--color-brand) 8%, transparent);
  transition:
    transform 0.25s ease,
    background-color 0.2s ease;
}
.brand-mark svg {
  width: 22px;
  height: 22px;
  filter: drop-shadow(0 2px 6px color-mix(in oklab, var(--color-brand) 25%, transparent));
}
.brand:hover .brand-mark {
  background: color-mix(in oklab, var(--color-brand) 14%, transparent);
  transform: translateY(-1px) rotate(-3deg);
}

/* Wordmark — `ali-nuxt/toolkit` with the slash subtly accented. Collapses
   to icon only on tight screens (the monogram alone still identifies the brand). */
.brand-word {
  display: none;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
@media (min-width: 640px) {
  .brand-word {
    display: inline-flex;
    align-items: baseline;
  }
}
.brand-scope {
  color: var(--text-dim);
  font-weight: 500;
}
.brand-sep {
  color: var(--color-brand);
  margin: 0 1px;
}
.brand-name {
  color: var(--text);
}
.brand:hover .brand-scope {
  color: var(--text);
}

/* Nav links — brand-tinted glassy pill that morphs in on hover, locks in on active.
   Replaces the older animated underline with a richer, more product-feel highlight. */
.nav-links {
  font-size: 14px;
}
.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--text-dim);
  font-weight: 500;
  isolation: isolate;
  transition: color 0.15s ease;
}
.nav-link::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--color-brand) 14%, transparent),
    color-mix(in oklab, var(--color-brand-2) 14%, transparent)
  );
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-brand) 22%, transparent);
  opacity: 0;
  transform: scale(0.92);
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-link:hover {
  color: var(--text);
}
.nav-link:hover::before {
  opacity: 0.65;
  transform: scale(1);
}
.nav-link--active {
  color: var(--text);
}
.nav-link--active::before {
  opacity: 1;
  transform: scale(1);
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--color-brand) 22%, transparent),
    color-mix(in oklab, var(--color-brand-2) 18%, transparent)
  );
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--color-brand) 36%, transparent),
    0 4px 16px -4px color-mix(in oklab, var(--color-brand) 28%, transparent);
}

/* The dropdown trigger reuses .nav-link styling so it sits identically alongside
   the NuxtLink siblings. Strip default button chrome. */
.nav-link--trigger {
  display: inline-flex;
  align-items: center;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.nav-link--trigger:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--color-brand) 50%, transparent);
  outline-offset: 2px;
}

/* UI mega-menu — glassy panel with eyebrow, gradient marks per component,
   and a brand-tinted halo. Replaces the old simple dropdown. */
.ui-mega {
  border-radius: 16px;
  background: color-mix(in oklab, var(--bg) 78%, transparent);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid color-mix(in oklab, var(--color-brand) 18%, var(--border));
  padding: 10px;
  box-shadow:
    0 1px 0 0 color-mix(in oklab, #fff 6%, transparent) inset,
    0 24px 56px -16px color-mix(in oklab, var(--color-brand) 38%, transparent),
    0 6px 16px -6px rgba(0, 0, 0, 0.18);
  z-index: 50;
}
.ui-mega__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 10px;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.ui-mega__eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-2));
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 60%, transparent);
}
.ui-mega__eyebrow-tag {
  margin-inline-start: auto;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid color-mix(in oklab, var(--color-brand) 25%, var(--border));
  color: color-mix(in oklab, var(--color-brand) 80%, var(--text));
  font-size: 9.5px;
}
.ui-mega__grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ui-mega__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  color: var(--text-dim);
  text-decoration: none;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}
.ui-mega__item:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--surface) 60%, transparent);
  text-decoration: none;
  transform: translateX(1px);
}
.ui-mega__item--active {
  color: var(--text);
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--color-brand) 18%, transparent),
    color-mix(in oklab, var(--color-brand-2) 12%, transparent)
  );
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-brand) 32%, transparent);
}
.ui-mega__mark {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-2));
  color: #fff;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.02em;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.25),
    0 4px 10px -2px color-mix(in oklab, var(--color-brand) 40%, transparent);
}
.ui-mega__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.ui-mega__label {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  line-height: 1.15;
  color: var(--text);
}
.ui-mega__pkg {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 10.5px;
  line-height: 1.2;
  color: color-mix(in oklab, var(--text-dim) 85%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ui-mega__pkg--muted {
  color: var(--text-muted, var(--text-dim));
  font-style: italic;
  font-family: inherit;
  font-size: 11px;
}
.ui-mega__chev {
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-4px);
  color: color-mix(in oklab, var(--color-brand) 80%, var(--text));
  font-weight: 600;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.ui-mega__item:hover .ui-mega__chev,
.ui-mega__item--active .ui-mega__chev {
  opacity: 1;
  transform: translateX(0);
}
.ui-mega__footer {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  font-size: 12.5px;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-brand) 78%, var(--text));
  text-decoration: none;
  transition:
    color 0.15s ease,
    background 0.15s ease;
  border-radius: 0 0 12px 12px;
}
.ui-mega__footer:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--color-brand) 8%, transparent);
  text-decoration: none;
}

/* Generic round icon button — used for theme/GitHub/LinkedIn. Subtle glow halo
   on hover, matching the brand. */
.icon-btn {
  display: inline-flex;
  height: 36px;
  width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-dim);
  background: transparent;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.2s ease;
}
.icon-btn:hover {
  color: var(--text);
  background: var(--surface);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-brand) 18%, transparent);
}

/* Version chip — small pulsing dot + version string. Click → GitHub releases. */
.version-chip {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-dim);
  transition:
    border-color 0.2s ease,
    color 0.15s ease;
  text-decoration: none;
}
.version-chip:hover {
  border-color: color-mix(in oklab, var(--color-brand) 40%, var(--border));
  color: var(--text);
  text-decoration: none;
}
.version-chip__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-success);
  box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-success) 70%, transparent);
  animation: version-pulse 2.4s ease-in-out infinite;
}
@keyframes version-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-success) 60%, transparent);
  }
  50% {
    box-shadow: 0 0 0 5px color-mix(in oklab, var(--color-success) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-mark,
  .nav-link::before,
  .ui-mega__item,
  .ui-mega__chev,
  .version-chip__dot {
    transition: none !important;
    animation: none !important;
  }
}
</style>
