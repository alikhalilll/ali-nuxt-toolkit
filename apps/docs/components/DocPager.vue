<script setup lang="ts">
interface PagerEntry {
  path: string;
  title: string;
}

const route = useRoute();

const order: PagerEntry[] = [
  { path: '/', title: 'Introduction' },
  { path: '/api-provider', title: 'api-provider' },
  { path: '/crypto', title: 'crypto' },
  { path: '/auto-middleware', title: 'auto-middleware' },
  { path: '/ui', title: 'ui' },
  { path: '/ui/smart-skeleton', title: 'ASmartSkeleton' },
  { path: '/ui/tel-input', title: 'ATelInput' },
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
  <nav v-if="hasAny" class="doc-pager" aria-label="Pagination">
    <NuxtLink v-if="prev" :to="prev.path" class="doc-pager__link doc-pager__link--prev">
      <span class="doc-pager__hint">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Previous
      </span>
      <span class="doc-pager__title">{{ prev.title }}</span>
    </NuxtLink>
    <span v-else aria-hidden="true" />

    <NuxtLink v-if="next" :to="next.path" class="doc-pager__link doc-pager__link--next">
      <span class="doc-pager__hint">
        Next
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
      <span class="doc-pager__title">{{ next.title }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.doc-pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  box-shadow: inset 0 1px 0 var(--color-border);
}

.doc-pager__link {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem 1.125rem;
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: inherit;
  transition:
    color 150ms ease,
    background 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}
.doc-pager__link:hover {
  background: var(--color-surface-hover);
  box-shadow: inset 0 0 0 1px var(--accent-muted);
  transform: translateY(-1px);
}
.doc-pager__link--next {
  align-items: flex-end;
  text-align: right;
}

.doc-pager__hint {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.doc-pager__link svg {
  transition: transform 150ms ease;
}
.doc-pager__link--prev:hover svg {
  transform: translateX(-2px);
}
.doc-pager__link--next:hover svg {
  transform: translateX(2px);
}

.doc-pager__title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-dim);
  transition: color 150ms ease;
}
.doc-pager__link:hover .doc-pager__title {
  color: var(--color-accent);
}

@media (max-width: 560px) {
  .doc-pager {
    grid-template-columns: 1fr;
  }
}
</style>
