<script setup lang="ts">
const route = useRoute();
const mobileNavOpen = useMobileNavOpen();
const toc = useDocToc();

const navLinks = [
  { to: '/api-provider', label: 'api-provider' },
  { to: '/crypto', label: 'crypto' },
  { to: '/auto-middleware', label: 'auto-middleware' },
];

const flatSections = computed(() => {
  const out: { id: string; text: string; depth: number }[] = [];
  const walk = (nodes: typeof toc.value) => {
    if (!nodes) return;
    for (const n of nodes) {
      if (n.depth <= 3) out.push({ id: n.id, text: n.text, depth: n.depth });
      if (n.children?.length) walk(n.children);
    }
  };
  walk(toc.value);
  return out;
});

const sectionIds = computed(() => flatSections.value.map((s) => s.id));
const activeId = useActiveHeading(sectionIds);

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false;
  }
);

function scrollToSection(id: string, e: MouseEvent) {
  e.preventDefault();
  mobileNavOpen.value = false;
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
  history.replaceState(history.state, '', `#${id}`);
}
</script>

<template>
  <header
    class="sticky top-0 z-30 w-full border-b border-border/60 bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60"
  >
    <div class="mx-auto flex h-14 max-w-[1400px] items-center px-4 sm:px-6">
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

        <NuxtLink to="/" class="mr-6 flex items-center gap-2 hover:no-underline">
          <span
            class="inline-flex h-6 w-7 items-center justify-center rounded border border-text text-[9px] font-bold tracking-tight text-text"
            aria-hidden="true"
          >
            ANT
          </span>
          <span class="hidden text-sm font-semibold text-text sm:inline">ali-nuxt-toolkit</span>
        </NuxtLink>
      </div>

      <!-- Inline nav (desktop) -->
      <nav class="hidden items-center gap-5 text-sm md:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-text-dim transition-colors hover:text-text hover:no-underline"
          active-class="!text-text font-medium"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Right side -->
      <div class="ml-auto flex items-center gap-1">
        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
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
        </a>
      </div>
    </div>

    <!-- Mobile dropdown -->
    <div v-if="mobileNavOpen" class="border-t border-border bg-bg md:hidden">
      <nav class="mx-auto max-w-[1400px] px-4 py-3 text-sm">
        <ul class="m-0 list-none p-0">
          <li>
            <NuxtLink
              to="/"
              class="block rounded-md px-3 py-2 text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
              active-class="!text-text font-medium"
              exact-active-class="!text-text font-medium"
              @click="mobileNavOpen = false"
            >
              Introduction
            </NuxtLink>
          </li>
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="block rounded-md px-3 py-2 text-text-dim transition-colors hover:bg-surface hover:text-text hover:no-underline"
              active-class="!text-text font-medium"
              @click="mobileNavOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>

        <template v-if="flatSections.length">
          <h4 class="mb-1 mt-4 px-3 text-[12px] font-semibold text-text">On this page</h4>
          <ul class="m-0 list-none border-l border-border p-0">
            <li
              v-for="section in flatSections"
              :key="section.id"
              :class="['-ml-px', section.depth === 3 ? 'pl-3' : '']"
            >
              <a
                :href="`#${section.id}`"
                :class="[
                  'block border-l-2 px-3 py-1.5 text-[13px] leading-snug transition-colors hover:text-text hover:no-underline',
                  activeId === section.id
                    ? 'border-text text-text'
                    : 'border-transparent text-text-dim',
                ]"
                @click="scrollToSection(section.id, $event)"
              >
                {{ section.text }}
              </a>
            </li>
          </ul>
        </template>

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
