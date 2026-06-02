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
  /**
   * Optional grouped child pages. Each group renders an uppercase header above
   * its items, and each item still acts as its own parent (with a nested in-page
   * TOC when active).
   */
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
        // /ui is now intro + theming only — install/setup live on each
        // component page (and each page has its own `#install` anchor).
        label: 'Getting started',
        items: [{ path: '/ui#theming', title: 'Theming', kind: 'anchor' }],
      },
      {
        // The `A` prefix is dropped in the sidebar — the "Components" group context
        // already implies the @alikhalilll/a-* component family. Page H1s + imports
        // still carry the prefix (ATelInput, AInput, …). Keeps long labels readable.
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
    // Anchor items are active when we're on the owning page AND scrollspy is on that section.
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
  <aside
    class="doc-sidebar sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto pr-2 text-sm md:block"
  >
    <h4 class="doc-sidebar__eyebrow first:mt-0">Getting Started</h4>
    <ul class="m-0 mb-4 list-none p-0">
      <li><SidebarLink to="/">Introduction</SidebarLink></li>
    </ul>

    <h4 class="doc-sidebar__eyebrow">Modules</h4>
    <ul class="m-0 flex list-none flex-col gap-2 p-0">
      <li v-for="mod in modules" :key="mod.path" :class="[mod.accent, 'doc-card']">
        <!-- Module link with gradient brand mark + name. -->
        <NuxtLink
          :to="mod.path"
          :class="['doc-card__link', isModuleActive(mod) ? 'doc-card__link--active' : '']"
        >
          <span class="doc-card__mark" aria-hidden="true">
            {{ mod.title.charAt(0).toUpperCase() }}
          </span>
          <span class="doc-card__name">{{ mod.title }}</span>
          <span class="doc-card__chev" aria-hidden="true">→</span>
        </NuxtLink>

        <!-- Grouped subpages (only the active module expands). -->
        <div v-if="mod.groups && isModuleActive(mod)" class="doc-card__expand">
          <div v-for="group in mod.groups" :key="group.label" class="doc-group">
            <h5 class="doc-group__label">
              <span>{{ group.label }}</span>
              <span class="doc-group__rule" aria-hidden="true" />
            </h5>
            <ul class="doc-group__list">
              <template v-for="sub in group.items" :key="sub.path">
                <li>
                  <NuxtLink
                    :to="sub.path"
                    :title="sub.pkg ? `${sub.title} · @alikhalilll/${sub.pkg}` : sub.title"
                    :class="['doc-subpage', isSubpageActive(sub) ? 'doc-subpage--active' : '']"
                  >
                    <span class="doc-subpage__marker" aria-hidden="true" />
                    <span class="doc-subpage__body">
                      <span class="doc-subpage__title">{{ sub.title }}</span>
                      <span v-if="sub.pkg" class="doc-subpage__pkg">
                        a-*/{{ sub.pkg.replace(/^a-/, '') }}
                      </span>
                    </span>
                  </NuxtLink>
                </li>

                <!-- Nested in-page TOC — only for the active component page. -->
                <li v-if="sub.kind !== 'anchor' && isSubpageActive(sub) && flatSections.length">
                  <ul class="doc-toc-rail">
                    <li
                      v-for="section in flatSections"
                      :key="section.id"
                      :class="[
                        'doc-toc-rail__item',
                        section.depth === 3 ? 'doc-toc-rail__item--deep' : '',
                      ]"
                    >
                      <a
                        :href="`#${section.id}`"
                        :class="[
                          'doc-toc-rail__link',
                          activeId === section.id ? 'doc-toc-rail__link--active' : '',
                        ]"
                        @click="scrollTo(section.id, $event)"
                      >
                        <span class="doc-toc-rail__square" aria-hidden="true" />
                        {{ section.text }}
                      </a>
                    </li>
                  </ul>
                </li>
              </template>
            </ul>
          </div>
        </div>

        <!-- Modules without subgroups — show in-page TOC directly. -->
        <ul
          v-else-if="!mod.groups && normalizedRoutePath === mod.path && flatSections.length"
          class="doc-toc-rail doc-toc-rail--flat"
        >
          <li
            v-for="section in flatSections"
            :key="section.id"
            :class="['doc-toc-rail__item', section.depth === 3 ? 'doc-toc-rail__item--deep' : '']"
          >
            <a
              :href="`#${section.id}`"
              :class="[
                'doc-toc-rail__link',
                activeId === section.id ? 'doc-toc-rail__link--active' : '',
              ]"
              @click="scrollTo(section.id, $event)"
            >
              <span class="doc-toc-rail__square" aria-hidden="true" />
              {{ section.text }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.doc-sidebar__eyebrow {
  margin: 1rem 0 0.5rem;
  padding: 0 0.75rem;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

/* Module card — bordered gradient surface. Active state borrows the per-package
   color set on the parent .pkg-* utility (var(--pkg-color)). */
.doc-card {
  position: relative;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--color-surface) 50%, transparent),
    transparent 65%
  );
  padding: 6px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.doc-card:has(.doc-card__link--active) {
  border-color: color-mix(in oklab, var(--pkg-color) 36%, var(--color-border));
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--pkg-color) 30%, transparent),
    0 12px 28px -16px color-mix(in oklab, var(--pkg-color) 30%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--pkg-color) 10%, transparent),
    transparent 75%
  );
}
.doc-card__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
  text-decoration: none;
  transition: background 0.15s ease;
}
.doc-card__link:hover {
  background: color-mix(in oklab, var(--pkg-color) 8%, transparent);
  text-decoration: none;
}
.doc-card__link--active {
  color: var(--pkg-color);
}
.doc-card__mark {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--pkg-color) 90%, white),
    color-mix(in oklab, var(--pkg-color) 60%, transparent)
  );
  color: #fff;
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.25),
    0 3px 8px -2px color-mix(in oklab, var(--pkg-color) 40%, transparent);
}
.doc-card__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.doc-card__chev {
  opacity: 0;
  transform: translateX(-3px);
  color: color-mix(in oklab, var(--pkg-color) 70%, var(--color-text));
  font-weight: 600;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.doc-card__link:hover .doc-card__chev,
.doc-card__link--active .doc-card__chev {
  opacity: 1;
  transform: translateX(0);
}
.doc-card__expand {
  margin-top: 6px;
  padding: 4px 4px 4px 8px;
}

/* Group label — uppercase eyebrow + a thin hairline rule that fills the rest of the row. */
.doc-group {
  margin-top: 0.75rem;
}
.doc-group:first-child {
  margin-top: 0.25rem;
}
.doc-group__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  padding: 0 0.25rem;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.doc-group__rule {
  flex: 1;
  height: 1px;
  background: color-mix(in oklab, var(--color-border) 50%, transparent);
}
.doc-group__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Sub-page row — flag + name + small pkg badge, brand-tinted active. */
.doc-subpage {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 10px;
  border-radius: 8px;
  color: var(--color-text-dim);
  text-decoration: none;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.doc-subpage:hover {
  color: var(--color-text);
  background: color-mix(in oklab, var(--pkg-color) 6%, transparent);
  text-decoration: none;
}
.doc-subpage__marker {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: color-mix(in oklab, var(--color-border) 80%, transparent);
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}
.doc-subpage--active {
  color: var(--pkg-color);
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--pkg-color) 14%, transparent),
    transparent 80%
  );
}
.doc-subpage--active .doc-subpage__marker {
  background: var(--pkg-color);
  box-shadow: 0 0 10px 0 color-mix(in oklab, var(--pkg-color) 60%, transparent);
}
.doc-subpage__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.doc-subpage__title {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-subpage__pkg {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 10px;
  line-height: 1.2;
  color: color-mix(in oklab, var(--color-text-muted) 90%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-subpage--active .doc-subpage__pkg {
  color: color-mix(in oklab, var(--pkg-color) 70%, var(--color-text-dim));
}

/* In-page TOC rail — dotted vertical guide with brand-square active marker. */
.doc-toc-rail {
  margin: 4px 0 8px;
  padding: 0;
  list-style: none;
  border-left: 1px dashed color-mix(in oklab, var(--color-border) 70%, transparent);
  margin-inline-start: 12px;
}
.doc-toc-rail--flat {
  margin-inline-start: 22px;
  margin: 4px 0 12px 22px;
}
.doc-toc-rail__item {
  position: relative;
  margin: 0;
}
.doc-toc-rail__item--deep {
  padding-inline-start: 10px;
}
.doc-toc-rail__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 10px 3px 12px;
  font-size: 12px;
  line-height: 1.3;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: 6px;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.doc-toc-rail__link:hover {
  color: var(--color-text);
  text-decoration: none;
}
.doc-toc-rail__square {
  position: absolute;
  inset-inline-start: -4.5px;
  top: 50%;
  width: 7px;
  height: 7px;
  margin-top: -3.5px;
  border-radius: 2px;
  background: transparent;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}
.doc-toc-rail__link--active {
  color: var(--color-brand);
  background: color-mix(in oklab, var(--color-brand) 10%, transparent);
  font-weight: 500;
}
.doc-toc-rail__link--active .doc-toc-rail__square {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-2));
  box-shadow: 0 0 10px 0 color-mix(in oklab, var(--color-brand) 50%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .doc-card,
  .doc-card__link,
  .doc-card__chev,
  .doc-subpage,
  .doc-subpage__marker,
  .doc-toc-rail__link,
  .doc-toc-rail__square {
    transition: none !important;
  }
}
</style>
