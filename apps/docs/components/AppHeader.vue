<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core';
import { ChevronDownIcon } from '~/components/icons';

const route = useRoute();
const mobileNavOpen = useMobileNavOpen();
const { pref, set: setMode } = useColorMode();

const navLinks = [
  { to: '/api-provider', label: 'api-provider' },
  { to: '/crypto', label: 'crypto' },
  { to: '/auto-middleware', label: 'auto-middleware' },
];

const uiNavItems: { to: string; label: string; pkg?: string; isNew?: boolean }[] = [
  { to: '/ui', label: 'Overview' },
  { to: '/ui/tel-input', label: 'ATelInput', pkg: 'a-tel-input' },
  { to: '/ui/skeleton', label: 'ASkeleton', pkg: 'a-skeleton', isNew: true },
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

// Sticky-safe scroll lock for the mobile sheet. Mutating `body { overflow }`
// breaks `position: sticky` on the page underneath (header, mobile TOC bar) —
// the moment body becomes a non-scrolling container, every sticky descendant
// snaps out of its sticky offset and scrolls away with the content. Instead
// we intercept wheel / touchmove / scroll-key events at document capture and
// let only events whose target is inside `.mobile-sheet` through. The page
// stays scrollable in DOM terms (sticky works) but visually frozen while open.
const sheetRef = ref<HTMLElement | null>(null);

function isInsideSheet(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false;
  return sheetRef.value?.contains(target) ?? false;
}
function onPageWheel(e: WheelEvent) {
  const t = (e.composedPath()[0] ?? e.target) as EventTarget | null;
  if (!isInsideSheet(t)) e.preventDefault();
}
function onPageTouchMove(e: TouchEvent) {
  const t = (e.composedPath()[0] ?? e.target) as EventTarget | null;
  if (!isInsideSheet(t)) e.preventDefault();
}
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);
function onPageKeyScroll(e: KeyboardEvent) {
  if (!SCROLL_KEYS.has(e.key)) return;
  if (!isInsideSheet(e.target)) e.preventDefault();
}

watch(mobileNavOpen, (open) => {
  if (typeof document === 'undefined') return;
  if (open) {
    document.addEventListener('wheel', onPageWheel, { passive: false, capture: true });
    document.addEventListener('touchmove', onPageTouchMove, { passive: false, capture: true });
    document.addEventListener('keydown', onPageKeyScroll, { capture: true });
  } else {
    document.removeEventListener('wheel', onPageWheel, { capture: true });
    document.removeEventListener('touchmove', onPageTouchMove, { capture: true });
    document.removeEventListener('keydown', onPageKeyScroll, { capture: true });
  }
});
onBeforeUnmount(() => {
  document.removeEventListener('wheel', onPageWheel, { capture: true });
  document.removeEventListener('touchmove', onPageTouchMove, { capture: true });
  document.removeEventListener('keydown', onPageKeyScroll, { capture: true });
});

// ESC closes whichever overlay is open — popovers AND the mobile sheet.
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  if (mobileNavOpen.value) mobileNavOpen.value = false;
  else if (uiNavOpen.value) uiNavOpen.value = false;
  else if (themePopoverOpen.value) themePopoverOpen.value = false;
});

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
          <!-- UI dropdown — tight 18rem panel, refined rows, quiet footer. -->
          <div v-if="uiNavOpen" class="ui-mega absolute left-0 top-full mt-3" role="menu">
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
                <span class="ui-mega__body">
                  <span class="ui-mega__label">
                    {{ item.label }}
                    <span v-if="item.isNew" class="badge-new">NEW</span>
                  </span>
                  <span v-if="item.pkg" class="ui-mega__pkg">@alikhalilll/{{ item.pkg }}</span>
                  <span v-else class="ui-mega__pkg ui-mega__pkg--muted">
                    Overview &middot; theming
                  </span>
                </span>
                <span class="ui-mega__chev" aria-hidden="true">→</span>
              </NuxtLink>
            </div>
            <NuxtLink to="/ui" class="ui-mega__footer" @click="uiNavOpen = false">
              <span>Browse all components</span>
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

    <!-- Mobile sheet — slide-in panel from the right with backdrop blur.
         Teleported to <body> because the parent .app-header uses backdrop-filter,
         which creates a containing block that would trap `position: fixed`
         children and squish the sheet to the header's own height. -->
    <Teleport to="body">
      <Transition name="mobile-fade">
        <div
          v-if="mobileNavOpen"
          class="mobile-sheet__backdrop md:hidden"
          @click="mobileNavOpen = false"
        />
      </Transition>
      <Transition name="mobile-slide">
        <aside
          v-if="mobileNavOpen"
          ref="sheetRef"
          class="mobile-sheet md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div class="mobile-sheet__head">
            <span class="mobile-sheet__brand">
              <span class="mobile-sheet__brand-scope">ali-nuxt</span>
              <span class="mobile-sheet__brand-sep">/</span>
              <span class="mobile-sheet__brand-name">toolkit</span>
            </span>
            <button
              type="button"
              class="mobile-sheet__close"
              aria-label="Close navigation"
              @click="mobileNavOpen = false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="mobile-sheet__body">
            <section class="mobile-sheet__section">
              <h4 class="mobile-sheet__eyebrow">Documentation</h4>
              <ul class="mobile-sheet__list">
                <li>
                  <NuxtLink
                    to="/"
                    class="mobile-sheet__item"
                    active-class="mobile-sheet__item--active"
                    exact-active-class="mobile-sheet__item--active"
                    @click="mobileNavOpen = false"
                  >
                    <span>Introduction</span>
                  </NuxtLink>
                </li>
              </ul>
            </section>

            <section class="mobile-sheet__section">
              <h4 class="mobile-sheet__eyebrow">
                <span>Packages</span>
                <span class="mobile-sheet__count">{{ navLinks.length + 1 }}</span>
              </h4>
              <ul class="mobile-sheet__list">
                <li
                  v-for="link in navLinks"
                  :key="link.to"
                  :class="`pkg-${link.to.replace('/', '').split('-')[0]}`"
                >
                  <NuxtLink
                    :to="link.to"
                    class="mobile-sheet__item mobile-sheet__item--mono"
                    active-class="mobile-sheet__item--active"
                    @click="mobileNavOpen = false"
                  >
                    <span class="mobile-sheet__dot" aria-hidden="true" />
                    <span>{{ link.label }}</span>
                  </NuxtLink>
                </li>
                <li class="pkg-ui">
                  <NuxtLink
                    to="/ui"
                    class="mobile-sheet__item mobile-sheet__item--mono"
                    :class="uiIsActive && 'mobile-sheet__item--active'"
                    @click="mobileNavOpen = false"
                  >
                    <span class="mobile-sheet__dot" aria-hidden="true" />
                    <span>ui</span>
                  </NuxtLink>
                </li>
              </ul>
            </section>

            <section class="mobile-sheet__section">
              <h4 class="mobile-sheet__eyebrow">UI Components</h4>
              <ul class="mobile-sheet__list">
                <li v-for="item in uiNavItems" :key="item.to">
                  <NuxtLink
                    :to="item.to"
                    :title="item.pkg ? `${item.label} · @alikhalilll/${item.pkg}` : item.label"
                    class="mobile-sheet__item mobile-sheet__item--block"
                    active-class="mobile-sheet__item--active"
                    @click="mobileNavOpen = false"
                  >
                    <span class="mobile-sheet__item-title">
                      {{ item.label }}
                      <span v-if="item.isNew" class="badge-new">NEW</span>
                    </span>
                    <span v-if="item.pkg" class="mobile-sheet__badge">{{ item.pkg }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </section>
          </div>

          <footer class="mobile-sheet__foot">
            <div class="mobile-sheet__theme" role="group" aria-label="Theme">
              <button
                v-for="opt in themeOptions"
                :key="opt.value"
                type="button"
                :aria-label="opt.label"
                :aria-pressed="opt.value === pref"
                :class="[
                  'mobile-sheet__theme-btn',
                  opt.value === pref ? 'mobile-sheet__theme-btn--active' : '',
                ]"
                @click="selectTheme(opt.value)"
              >
                <!-- Sun -->
                <svg
                  v-if="opt.value === 'light'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
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
                  v-else-if="opt.value === 'dark'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
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
                <!-- System -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
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
                <span>{{ opt.label }}</span>
              </button>
            </div>

            <div class="mobile-sheet__socials">
              <a
                href="https://github.com/alikhalilll/ali-nuxt-toolkit"
                target="_blank"
                rel="noopener"
                aria-label="GitHub repository"
                class="mobile-sheet__social"
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
              <a
                href="https://www.linkedin.com/in/alikhalilll"
                target="_blank"
                rel="noopener"
                aria-label="LinkedIn"
                class="mobile-sheet__social"
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
                    d="M20.45 20.45h-3.55v-5.56c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.65H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"
                  />
                </svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </footer>
        </aside>
      </Transition>
    </Teleport>
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

/* --- Desktop nav links ----------------------------------------------------
   Restrained, text-first treatment. Hover shifts text from dim → primary +
   adds a hairline surface tint. The active state gets a single sliding
   underline that scales from the centre — the only color signal beyond the
   text itself. Mirrors the restraint of Vercel/Linear/Stripe nav. */
.nav-links {
  font-size: 13.5px;
}
.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--text-dim);
  font-weight: 500;
  letter-spacing: -0.005em;
  text-decoration: none;
  transition:
    color 0.16s ease,
    background 0.16s ease;
}
.nav-link:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  text-decoration: none;
}
.nav-link--active {
  color: var(--text);
}
.nav-link::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 4px;
  height: 1.5px;
  background: var(--color-brand);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-link:hover::after {
  transform: scaleX(0.55);
}
.nav-link--active::after {
  transform: scaleX(1);
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 50%, transparent);
}

/* Dropdown trigger reuses .nav-link so it aligns with NuxtLink siblings.
   Strip default button chrome. */
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

/* --- UI dropdown ----------------------------------------------------------
   Tight 18rem panel. Drops the eyebrow strip and per-item brand monogram
   that the old "mega-menu" carried — for a 2-item list those felt like
   peacocking. Now: list of refined rows + a quiet "Browse all" footer. */
.ui-mega {
  width: 18rem;
  border-radius: 12px;
  background: color-mix(in oklab, var(--bg) 86%, transparent);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
  padding: 6px;
  box-shadow:
    0 1px 0 0 color-mix(in oklab, #fff 5%, transparent) inset,
    0 14px 36px -12px rgba(0, 0, 0, 0.22),
    0 4px 10px -4px rgba(0, 0, 0, 0.1);
  z-index: 50;
}
.ui-mega__grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ui-mega__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text-dim);
  text-decoration: none;
  transition:
    background 0.16s ease,
    color 0.16s ease;
}
.ui-mega__item:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--surface) 70%, transparent);
  text-decoration: none;
}
.ui-mega__item--active {
  color: var(--text);
  background: color-mix(in oklab, var(--color-brand) 10%, transparent);
}
.ui-mega__item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--color-brand);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 50%, transparent);
}
.ui-mega__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.ui-mega__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.005em;
  line-height: 1.2;
  color: var(--text);
}
.ui-mega__pkg {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 10.5px;
  line-height: 1.2;
  color: var(--text-muted, var(--text-dim));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ui-mega__pkg--muted {
  font-family: inherit;
  font-size: 10.5px;
  color: var(--text-muted, var(--text-dim));
}
.ui-mega__chev {
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-3px);
  color: var(--color-brand);
  font-size: 13px;
  font-weight: 600;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.ui-mega__item:hover .ui-mega__chev,
.ui-mega__item--active .ui-mega__chev {
  opacity: 1;
  transform: translateX(0);
}
.ui-mega__footer {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
  text-decoration: none;
  border-radius: 0 0 8px 8px;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.ui-mega__footer:hover {
  color: var(--color-brand);
  background: color-mix(in oklab, var(--color-brand) 6%, transparent);
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

/* --- Mobile sheet ---------------------------------------------------------
   Slide-in panel from the right with a blurred backdrop. Replaces the
   inline accordion that used to push page content down. Body scroll is
   locked while open (handled in <script>). Z-index sits above the header
   (z-30) and the picker portal (z-50) gives the close button focus. */
.mobile-sheet__backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: color-mix(in oklab, var(--bg) 55%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.mobile-sheet {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(88vw, 360px);
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border-left: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
  box-shadow: -24px 0 64px -16px rgba(0, 0, 0, 0.28);
  overscroll-behavior: contain;
}

/* Sheet header. Brand wordmark left, close button right. */
.mobile-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
}
.mobile-sheet__brand {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.mobile-sheet__brand-scope {
  color: var(--text-dim);
  font-weight: 500;
}
.mobile-sheet__brand-sep {
  color: var(--color-brand);
  margin: 0 1px;
}
.mobile-sheet__brand-name {
  color: var(--text);
}
.mobile-sheet__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.mobile-sheet__close:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--surface) 60%, transparent);
}
.mobile-sheet__close:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--color-brand) 60%, transparent);
  outline-offset: 2px;
}

/* Sheet body — scrollable section list. */
.mobile-sheet__body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.mobile-sheet__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mobile-sheet__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 2px;
  padding: 0 12px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted, var(--text-dim));
}
.mobile-sheet__count {
  margin-inline-start: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--surface) 70%, transparent);
  border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--text-muted, var(--text-dim));
}
.mobile-sheet__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mobile-sheet__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--text);
  text-decoration: none;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.mobile-sheet__item:hover {
  background: color-mix(in oklab, var(--surface) 55%, transparent);
  text-decoration: none;
}
.mobile-sheet__item--mono {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 13px;
  letter-spacing: -0.01em;
}
.mobile-sheet__item--block {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.mobile-sheet__item-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--text);
}
.mobile-sheet__badge {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.2;
  color: var(--text-muted, var(--text-dim));
}
.mobile-sheet__dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--pkg-color, var(--text-muted));
  transition: box-shadow 0.15s ease;
}
.mobile-sheet__item:hover .mobile-sheet__dot {
  box-shadow: 0 0 8px color-mix(in oklab, var(--pkg-color, var(--text-muted)) 60%, transparent);
}
.mobile-sheet__item--active {
  color: var(--color-brand);
  background: color-mix(in oklab, var(--color-brand) 10%, transparent);
}
.mobile-sheet__item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: var(--color-brand);
  border-radius: 0 2px 2px 0;
}
.mobile-sheet__item--active .mobile-sheet__dot {
  background: var(--color-brand);
  opacity: 1;
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 50%, transparent);
}
.mobile-sheet__item--active .mobile-sheet__badge {
  color: color-mix(in oklab, var(--color-brand) 80%, var(--text-dim));
}

/* Sheet footer — theme segmented control + social icons. */
.mobile-sheet__foot {
  border-top: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mobile-sheet__theme {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: color-mix(in oklab, var(--surface) 60%, transparent);
  border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
}
.mobile-sheet__theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 7px;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
  transition:
    color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}
.mobile-sheet__theme-btn:hover {
  color: var(--text);
}
.mobile-sheet__theme-btn--active {
  color: var(--text);
  background: var(--bg);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 0 0 1px color-mix(in oklab, var(--color-brand) 24%, var(--border));
}
.mobile-sheet__socials {
  display: flex;
  gap: 8px;
}
.mobile-sheet__social {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-dim);
  text-decoration: none;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}
.mobile-sheet__social:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--surface) 60%, transparent);
  border-color: color-mix(in oklab, var(--color-brand) 30%, var(--border));
  text-decoration: none;
}

/* Sheet transitions — slide-from-right + backdrop fade. */
.mobile-slide-enter-active,
.mobile-slide-leave-active {
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.mobile-slide-enter-from,
.mobile-slide-leave-to {
  transform: translateX(100%);
}
.mobile-fade-enter-active,
.mobile-fade-leave-active {
  transition: opacity 0.24s ease;
}
.mobile-fade-enter-from,
.mobile-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .brand-mark,
  .nav-link,
  .nav-link::after,
  .ui-mega__item,
  .ui-mega__chev,
  .version-chip__dot,
  .mobile-slide-enter-active,
  .mobile-slide-leave-active,
  .mobile-fade-enter-active,
  .mobile-fade-leave-active {
    transition: none !important;
    animation: none !important;
  }
}
</style>
