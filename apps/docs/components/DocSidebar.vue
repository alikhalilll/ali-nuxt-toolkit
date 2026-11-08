<script setup lang="ts">
/**
 * Left-column navigation — enhanced.
 *
 * Groups of pages, each with a small dot in the heading. Active page gets
 * a 2px accent left-bar + subtle surface fill so you can spot it at a glance.
 * In-page TOC lives in the right rail (DocToc) on wide screens; on narrower
 * ones it collapses into the sidebar under the active page.
 */
const route = useRoute();
const toc = useDocToc();

interface PageLink {
  path: string;
  title: string;
}

interface Group {
  heading: string;
  pages: PageLink[];
}

const groups: Group[] = [
  {
    heading: 'Core',
    pages: [
      { path: '/api-provider', title: 'api-provider' },
      { path: '/crypto', title: 'crypto' },
      { path: '/auto-middleware', title: 'auto-middleware' },
    ],
  },
  {
    heading: 'UI',
    pages: [
      { path: '/ui', title: 'Overview' },
      { path: '/ui/smart-skeleton', title: 'ASmartSkeleton' },
      { path: '/ui/tel-input', title: 'ATelInput' },
    ],
  },
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

const normalizedPath = computed(() => {
  const p = route.path.replace(/\/+$/, '');
  return p || '/';
});

function isPageActive(page: PageLink) {
  return normalizedPath.value === page.path;
}
</script>

<template>
  <aside class="doc-sidebar">
    <nav aria-label="Documentation">
      <div v-for="group in groups" :key="group.heading" class="doc-sidebar__group">
        <h3 class="doc-sidebar__heading">
          <span class="doc-sidebar__heading-dot" aria-hidden="true" />
          {{ group.heading }}
        </h3>
        <template v-for="page in group.pages" :key="page.path">
          <NuxtLink
            :to="page.path"
            :class="['doc-sidebar__link', isPageActive(page) && 'is-active']"
          >
            <span class="doc-sidebar__link-bar" aria-hidden="true" />
            <span>{{ page.title }}</span>
          </NuxtLink>
          <!-- Inline TOC under the active page — shown on narrow screens only
               (the right-rail DocToc takes over on xl). -->
          <div v-if="isPageActive(page) && flatSections.length" class="doc-sidebar__toc">
            <a
              v-for="s in flatSections"
              :key="s.id"
              :href="`#${s.id}`"
              :class="[
                'doc-sidebar__toc-link',
                `doc-sidebar__toc-link--depth-${s.depth}`,
                activeId === s.id && 'is-active',
              ]"
            >
              {{ s.text }}
            </a>
          </div>
        </template>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.doc-sidebar {
  position: sticky;
  top: 4rem;
  align-self: start;
  max-height: calc(100vh - 4.5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.5rem 0 2rem;
  scrollbar-width: none;
}

.doc-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.doc-sidebar__group {
  display: flex;
  flex-direction: column;
}

.doc-sidebar__heading {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.doc-sidebar__heading-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--color-accent);
}

.doc-sidebar__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-dim);
  border-radius: 0.375rem;
  transition:
    color 150ms ease,
    background 150ms ease;
}
.doc-sidebar__link-bar {
  position: absolute;
  left: 0;
  top: 25%;
  bottom: 25%;
  width: 2px;
  border-radius: 2px;
  background: transparent;
  transition: background 150ms ease;
}
.doc-sidebar__link:hover {
  color: var(--color-text);
  background: var(--color-surface);
}
.doc-sidebar__link.is-active {
  color: var(--color-text);
  background: var(--color-surface);
  font-weight: 500;
}
.doc-sidebar__link.is-active .doc-sidebar__link-bar {
  background: var(--color-accent);
}

.doc-sidebar__toc {
  display: flex;
  flex-direction: column;
  padding: 0.375rem 0 0.5rem 1rem;
  margin-left: 0.5rem;
  box-shadow: inset 1px 0 0 var(--color-border);
}

.doc-sidebar__toc-link {
  padding: 0.25rem 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  transition: color 120ms ease;
}
.doc-sidebar__toc-link--depth-3 {
  padding-left: 0.75rem;
  font-size: 0.75rem;
}
.doc-sidebar__toc-link:hover {
  color: var(--color-text-dim);
}
.doc-sidebar__toc-link.is-active {
  color: var(--color-accent);
}

/* On xl screens the right-rail DocToc owns the in-page TOC — hide the
   sidebar copy so we don't double-render it. */
@media (min-width: 1200px) {
  .doc-sidebar__toc {
    display: none;
  }
}

@media (max-width: 860px) {
  .doc-sidebar {
    position: static;
    max-height: none;
    padding: 1rem 0;
  }
  .doc-sidebar nav {
    gap: 1.25rem;
  }
  .doc-sidebar__toc {
    display: none;
  }
}
</style>
