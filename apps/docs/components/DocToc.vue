<script setup lang="ts">
/**
 * Right-rail table of contents.
 *
 * Visible on xl screens (≥ 1200px). On narrower viewports it hides — the
 * sidebar carries an inline copy of the same TOC instead.
 */
interface TocLink {
  id: string;
  depth: number;
  text: string;
  children?: TocLink[];
}

const props = defineProps<{
  links?: TocLink[];
}>();

function flatten(nodes: TocLink[] = []): TocLink[] {
  const out: TocLink[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flatten(n.children));
  }
  return out;
}

const flat = computed(() => flatten(props.links ?? []).filter((n) => n.depth <= 3));
const ids = computed(() => flat.value.map((n) => n.id));
const activeId = useActiveHeading(ids);
</script>

<template>
  <aside v-if="flat.length" class="doc-toc">
    <h4 class="doc-toc__heading">
      <span class="doc-toc__heading-dot" aria-hidden="true" />
      On this page
    </h4>
    <nav class="doc-toc__nav">
      <a
        v-for="link in flat"
        :key="link.id"
        :href="`#${link.id}`"
        :class="[
          'doc-toc__link',
          `doc-toc__link--depth-${link.depth}`,
          activeId === link.id && 'is-active',
        ]"
      >
        {{ link.text }}
      </a>
    </nav>
  </aside>
</template>

<style scoped>
.doc-toc {
  display: none;
  position: sticky;
  top: 4rem;
  align-self: start;
  max-height: calc(100vh - 4.5rem);
  overflow-y: auto;
  padding: 1.5rem 0 2rem;
  scrollbar-width: none;
}

@media (min-width: 1200px) {
  .doc-toc {
    display: block;
  }
}

.doc-toc__heading {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.doc-toc__heading-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--color-accent);
}

.doc-toc__nav {
  display: flex;
  flex-direction: column;
  box-shadow: inset 1px 0 0 var(--color-border);
  padding-left: 0.75rem;
}

.doc-toc__link {
  position: relative;
  padding: 0.3rem 0 0.3rem 0.5rem;
  margin-left: -0.75rem;
  padding-left: 1rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  transition: color 120ms ease;
  box-shadow: inset 2px 0 0 transparent;
}
.doc-toc__link--depth-3 {
  padding-left: 1.75rem;
  font-size: 0.75rem;
}
.doc-toc__link:hover {
  color: var(--color-text-dim);
}
.doc-toc__link.is-active {
  color: var(--color-accent);
  box-shadow: inset 2px 0 0 var(--color-accent);
}
</style>
