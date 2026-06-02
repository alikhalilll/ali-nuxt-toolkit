<script setup lang="ts">
const route = useRoute();
const toc = useDocToc();

interface SubPage {
  path: string;
  title: string;
  /**
   * `'page'` — full route (e.g. `/ui/tel-input`). Expands its in-page TOC under it
   * when active.
   * `'anchor'` — same-page section link (e.g. `/ui#install`). No nested TOC.
   */
  kind?: 'page' | 'anchor';
  /**
   * npm package badge under the title — surfaces that each UI component now
   * ships as its own independently-versioned package (e.g. `a-tel-input`).
   */
  pkg?: string;
}

interface SubGroup {
  label: string;
  items: SubPage[];
}

interface ModuleEntry {
  path: string;
  title: string;
  accent: 'pkg-api' | 'pkg-crypto' | 'pkg-auto' | 'pkg-ui';
  groups?: SubGroup[];
}

const modules: ModuleEntry[] = [
  { path: '/api-provider', title: 'api-provider', accent: 'pkg-api' },
  { path: '/crypto', title: 'crypto', accent: 'pkg-crypto' },
  { path: '/auto-middleware', title: 'auto-middleware', accent: 'pkg-auto' },
  {
    path: '/ui',
    title: 'ui',
    accent: 'pkg-ui',
    groups: [
      {
        label: 'Getting started',
        items: [{ path: '/ui#theming', title: 'Theming', kind: 'anchor' }],
      },
      {
        label: 'Components',
        items: [{ path: '/ui/tel-input', title: 'TelInput', kind: 'page', pkg: 'a-tel-input' }],
      },
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

const normalizedRoutePath = computed(() => {
  const p = route.path.replace(/\/+$/, '');
  return p || '/';
});

function isModuleActive(mod: ModuleEntry) {
  const p = normalizedRoutePath.value;
  return p === mod.path || p.startsWith(`${mod.path}/`);
}

function isSubpageActive(sub: SubPage) {
  if (sub.kind === 'anchor') {
    const [base, hash] = sub.path.split('#');
    if (normalizedRoutePath.value !== base) return false;
    return activeId.value === hash;
  }
  return normalizedRoutePath.value === sub.path;
}

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault();
  scrollToHash(id);
}
</script>

<template>
  <aside class="doc-sidebar">
    <nav class="doc-sidebar__inner" aria-label="Documentation navigation">
      <!-- Documentation section -->
      <section class="doc-section">
        <h4 class="doc-section__label">Documentation</h4>
        <ul class="doc-section__list">
          <li>
            <NuxtLink to="/" class="doc-link" exact-active-class="doc-link--active">
              <span class="doc-link__name">Introduction</span>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Packages section -->
      <section class="doc-section">
        <h4 class="doc-section__label">
          <span>Packages</span>
          <span class="doc-section__count">{{ modules.length }}</span>
        </h4>
        <ul class="doc-section__list">
          <li v-for="mod in modules" :key="mod.path" :class="[mod.accent, 'doc-module']">
            <NuxtLink
              :to="mod.path"
              :class="['doc-link', 'doc-link--mono', isModuleActive(mod) ? 'doc-link--active' : '']"
            >
              <span class="doc-link__dot" aria-hidden="true" />
              <span class="doc-link__name">{{ mod.title }}</span>
            </NuxtLink>

            <!-- Grouped subpages — only on active module -->
            <div v-if="mod.groups && isModuleActive(mod)" class="doc-tree">
              <div v-for="group in mod.groups" :key="group.label" class="doc-tree__group">
                <h5 class="doc-tree__label">{{ group.label }}</h5>
                <ul class="doc-tree__list">
                  <template v-for="sub in group.items" :key="sub.path">
                    <li>
                      <NuxtLink
                        :to="sub.path"
                        :title="sub.pkg ? `${sub.title} · @alikhalilll/${sub.pkg}` : sub.title"
                        :class="[
                          'doc-tree__link',
                          isSubpageActive(sub) ? 'doc-tree__link--active' : '',
                        ]"
                      >
                        <span class="doc-tree__name">{{ sub.title }}</span>
                        <span v-if="sub.pkg" class="doc-tree__pkg">{{ sub.pkg }}</span>
                      </NuxtLink>
                    </li>

                    <!-- Nested in-page TOC under the active component page. -->
                    <li
                      v-if="sub.kind !== 'anchor' && isSubpageActive(sub) && flatSections.length"
                      class="doc-tree__nested"
                    >
                      <ul class="doc-toc">
                        <li
                          v-for="section in flatSections"
                          :key="section.id"
                          :class="[
                            'doc-toc__item',
                            section.depth === 3 ? 'doc-toc__item--deep' : '',
                          ]"
                        >
                          <a
                            :href="`#${section.id}`"
                            :class="[
                              'doc-toc__link',
                              activeId === section.id ? 'doc-toc__link--active' : '',
                            ]"
                            @click="scrollTo(section.id, $event)"
                          >
                            {{ section.text }}
                          </a>
                        </li>
                      </ul>
                    </li>
                  </template>
                </ul>
              </div>
            </div>

            <!-- Flat in-page TOC for modules without subgroups. -->
            <ul
              v-else-if="!mod.groups && normalizedRoutePath === mod.path && flatSections.length"
              class="doc-toc doc-toc--flat"
            >
              <li
                v-for="section in flatSections"
                :key="section.id"
                :class="['doc-toc__item', section.depth === 3 ? 'doc-toc__item--deep' : '']"
              >
                <a
                  :href="`#${section.id}`"
                  :class="['doc-toc__link', activeId === section.id ? 'doc-toc__link--active' : '']"
                  @click="scrollTo(section.id, $event)"
                >
                  {{ section.text }}
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </nav>
  </aside>
</template>

<style scoped>
.doc-sidebar {
  position: sticky;
  top: 5rem;
  align-self: flex-start;
  display: none;
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
  padding-right: 0.5rem;
  font-size: 0.875rem;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklab, var(--color-text-muted) 30%, transparent) transparent;
}
@media (min-width: 768px) {
  .doc-sidebar {
    display: block;
  }
}
.doc-sidebar::-webkit-scrollbar {
  width: 6px;
}
.doc-sidebar::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--color-text-muted) 25%, transparent);
  border-radius: 3px;
}
.doc-sidebar::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklab, var(--color-text-muted) 40%, transparent);
}

.doc-sidebar__inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.25rem;
}

/* --- Section ---------------------------------------------------------------
   Each top-level group (Documentation / Packages) renders with a tight
   uppercase label and a flat list of items. Section labels are dim and small
   so they recede; the items themselves carry the eye. */
.doc-section__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
  padding: 0 0.75rem;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.doc-section__count {
  margin-inline-start: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-surface) 80%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  color: var(--color-text-muted);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0;
}
.doc-section__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* --- Generic link ---------------------------------------------------------
   The base row primitive. Hover lifts the text and adds a hairline surface
   tint; the active state gets a 2px left-edge brand bar — the only visual
   weight change. Keeps the sidebar reading as text first, decoration second. */
.doc-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--color-text-dim);
  text-decoration: none;
  transition:
    color 0.16s ease,
    background 0.16s ease;
}
.doc-link:hover {
  color: var(--color-text);
  background: color-mix(in oklab, var(--color-surface) 60%, transparent);
  text-decoration: none;
}
.doc-link--active {
  color: var(--color-text);
  font-weight: 600;
}
.doc-link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 2px;
  background: var(--pkg-color, var(--color-brand));
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px color-mix(in oklab, var(--pkg-color, var(--color-brand)) 50%, transparent);
}
/* Mono variant for the package list — reinforces these are npm names. */
.doc-link--mono {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 13px;
  letter-spacing: -0.012em;
}
.doc-link__dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--pkg-color, var(--color-text-muted));
  transition: box-shadow 0.16s ease;
}
.doc-module:hover .doc-link__dot,
.doc-link--active .doc-link__dot {
  box-shadow: 0 0 8px
    color-mix(in oklab, var(--pkg-color, var(--color-text-muted)) 60%, transparent);
}
.doc-link__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- Tree under an active module ------------------------------------------
   A 1px guide line on the left implies the hierarchy without screaming about
   it. Sub-pages indent off this guide; their active state overlays a 2px
   brand bar exactly on the guide, snapping the eye to the current page. */
.doc-tree {
  margin: 6px 0 4px;
  padding: 2px 0 2px 14px;
  border-left: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  margin-inline-start: 18px;
}
.doc-tree__group {
  margin-top: 0.75rem;
}
.doc-tree__group:first-child {
  margin-top: 0.125rem;
}
.doc-tree__label {
  margin: 0 0 0.25rem;
  padding: 0 0.5rem;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.doc-tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.doc-tree__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 12px;
  margin-left: -14px;
  padding-left: 14px;
  border-radius: 0 6px 6px 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-dim);
  text-decoration: none;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.doc-tree__link:hover {
  color: var(--color-text);
  background: color-mix(in oklab, var(--color-surface) 50%, transparent);
  text-decoration: none;
}
.doc-tree__link--active {
  color: var(--color-text);
  font-weight: 600;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--color-brand) 10%, transparent),
    transparent 70%
  );
}
.doc-tree__link--active::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 5px;
  bottom: 5px;
  width: 2px;
  background: var(--color-brand);
  border-radius: 2px;
  box-shadow: 0 0 10px color-mix(in oklab, var(--color-brand) 50%, transparent);
}
.doc-tree__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-tree__pkg {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 9.5px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  color: var(--color-text-muted);
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.doc-tree__link--active .doc-tree__pkg {
  border-color: color-mix(in oklab, var(--color-brand) 35%, var(--color-border));
  color: color-mix(in oklab, var(--color-brand) 80%, var(--color-text-dim));
}
.doc-tree__nested {
  list-style: none;
}

/* --- In-page TOC ---------------------------------------------------------
   The third level — page anchors. Subtler still: smaller type, no guide,
   relies on indent alone. Active section gets a faint brand wash + brand
   text. No marker square anymore — it was redundant with the wash. */
.doc-toc {
  margin: 4px 0 8px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.doc-toc--flat {
  margin-inline-start: 18px;
  padding-left: 14px;
  border-left: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
}
.doc-toc__item--deep {
  padding-inline-start: 12px;
}
.doc-toc__link {
  position: relative;
  display: block;
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-text-muted);
  text-decoration: none;
  transition:
    color 0.15s ease,
    background 0.15s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-toc__link:hover {
  color: var(--color-text-dim);
  text-decoration: none;
}
.doc-toc__link--active {
  color: var(--color-brand);
  background: color-mix(in oklab, var(--color-brand) 10%, transparent);
  font-weight: 500;
}

@media (prefers-reduced-motion: reduce) {
  .doc-link,
  .doc-link__dot,
  .doc-tree__link,
  .doc-toc__link {
    transition: none !important;
  }
}
</style>
