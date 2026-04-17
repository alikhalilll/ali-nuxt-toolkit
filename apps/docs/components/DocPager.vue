<script setup lang="ts">
interface PagerEntry {
  path: string;
  title: string;
  description?: string;
}

const route = useRoute();

const order: PagerEntry[] = [
  { path: '/', title: 'Introduction', description: 'Overview of the toolkit' },
  { path: '/api-provider', title: 'api-provider', description: 'Typed fetch client' },
  { path: '/crypto', title: 'crypto', description: 'AES-GCM + PBKDF2' },
  { path: '/auto-middleware', title: 'auto-middleware', description: 'Layout-based middleware' },
];

const normalizedPath = computed(() => {
  const p = route.path.replace(/\/+$/, '');
  return p || '/';
});

const currentIndex = computed(() =>
  order.findIndex((entry) => entry.path === normalizedPath.value)
);

const prev = computed(() => {
  const i = currentIndex.value;
  if (i <= 0) return null;
  return order[i - 1] ?? null;
});

const next = computed(() => {
  const i = currentIndex.value;
  if (i < 0 || i >= order.length - 1) return null;
  return order[i + 1] ?? null;
});

const hasAny = computed(() => prev.value !== null || next.value !== null);
</script>

<template>
  <nav
    v-if="hasAny"
    class="doc-pager mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
    aria-label="Pagination"
  >
    <NuxtLink
      v-if="prev"
      :to="prev.path"
      class="group flex flex-col items-start gap-1 rounded-lg border border-border bg-surface/30 px-4 py-3 transition-colors hover:border-accent-2/60 hover:bg-surface hover:no-underline sm:col-start-1"
    >
      <span
        class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-text-muted"
      >
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
          class="transition-transform group-hover:-translate-x-0.5"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Previous
      </span>
      <span class="text-[15px] font-semibold text-text transition-colors group-hover:text-accent-2">
        {{ prev.title }}
      </span>
      <span v-if="prev.description" class="text-xs text-text-dim">{{ prev.description }}</span>
    </NuxtLink>
    <span v-else class="hidden sm:block" aria-hidden="true" />

    <NuxtLink
      v-if="next"
      :to="next.path"
      class="group flex flex-col items-end gap-1 rounded-lg border border-border bg-surface/30 px-4 py-3 text-right transition-colors hover:border-accent-2/60 hover:bg-surface hover:no-underline sm:col-start-2"
    >
      <span
        class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-text-muted"
      >
        Next
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
      </span>
      <span class="text-[15px] font-semibold text-text transition-colors group-hover:text-accent-2">
        {{ next.title }}
      </span>
      <span v-if="next.description" class="text-xs text-text-dim">{{ next.description }}</span>
    </NuxtLink>
  </nav>
</template>
