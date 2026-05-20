<script setup lang="ts">
const route = useRoute();
const toc = useDocToc();

interface SubPage {
  path: string;
  title: string;
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
        label: 'Components',
        items: [
          { path: '/ui/tell-input', title: 'ATellInput' },
          { path: '/ui/input', title: 'AInput' },
          { path: '/ui/popover', title: 'APopover' },
          { path: '/ui/drawer', title: 'ADrawer' },
          { path: '/ui/responsive-popover', title: 'AResponsivePopover' },
        ],
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
  return normalizedRoutePath.value === sub.path;
}

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault();
  scrollToHash(id);
}
</script>

<template>
  <aside
    class="sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto pr-2 text-sm md:block"
  >
    <h4
      class="mb-1.5 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted first:mt-0"
    >
      Getting Started
    </h4>
    <ul class="m-0 mb-4 list-none p-0">
      <li><SidebarLink to="/">Introduction</SidebarLink></li>
    </ul>

    <h4 class="mb-1.5 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
      Modules
    </h4>
    <ul class="m-0 list-none p-0">
      <li v-for="mod in modules" :key="mod.path" :class="[mod.accent, 'mb-1']">
        <!-- Module link -->
        <NuxtLink
          :to="mod.path"
          :class="[
            'module-link flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[13px] font-semibold transition-colors hover:no-underline',
            isModuleActive(mod) ? 'is-active' : 'text-text hover:bg-surface/60',
          ]"
        >
          <span class="pkg-dot" aria-hidden="true" />
          {{ mod.title }}
        </NuxtLink>

        <!--
          Modules with grouped subpages: render an uppercase group header above each
          set of items. Each item still acts as its own parent — when active, its
          in-page TOC nests under it as a third level (ui → Components → ATellInput → §).
        -->
        <div v-if="mod.groups && isModuleActive(mod)" class="ml-5 mb-3">
          <!--
            Module landing page (/ui itself) — surface its own in-page TOC under the
            module link so the overview also reads as a parent.
          -->
          <ul
            v-if="normalizedRoutePath === mod.path && flatSections.length"
            class="m-0 mt-1 mb-3 list-none border-l border-border/60 p-0"
          >
            <li
              v-for="section in flatSections"
              :key="section.id"
              :class="['-ml-px', section.depth === 3 ? 'pl-3' : '']"
            >
              <a
                :href="`#${section.id}`"
                :class="[
                  'block border-l-2 px-3 py-0.5 text-[12px] leading-snug transition-colors hover:text-text hover:no-underline',
                  activeId === section.id
                    ? 'border-brand/70 text-brand'
                    : 'border-transparent text-text-muted',
                ]"
                @click="scrollTo(section.id, $event)"
              >
                {{ section.text }}
              </a>
            </li>
          </ul>

          <div v-for="group in mod.groups" :key="group.label" class="mt-3 first:mt-1">
            <h5
              class="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {{ group.label }}
            </h5>
            <ul class="m-0 list-none border-l border-border p-0">
              <template v-for="sub in group.items" :key="sub.path">
                <li class="-ml-px">
                  <NuxtLink
                    :to="sub.path"
                    :class="[
                      'block border-l-2 px-3 py-1 text-[13px] leading-snug transition-colors hover:text-text hover:no-underline',
                      isSubpageActive(sub)
                        ? 'border-brand bg-brand/10 font-medium text-brand'
                        : 'border-transparent text-text-dim',
                    ]"
                  >
                    {{ sub.title }}
                  </NuxtLink>
                </li>

                <!-- Nested in-page TOC for the active component page. -->
                <li v-if="isSubpageActive(sub) && flatSections.length" class="-ml-px">
                  <ul class="m-0 mt-1 mb-2 ml-3 list-none border-l border-border/60 p-0">
                    <li
                      v-for="section in flatSections"
                      :key="section.id"
                      :class="['-ml-px', section.depth === 3 ? 'pl-3' : '']"
                    >
                      <a
                        :href="`#${section.id}`"
                        :class="[
                          'block border-l-2 px-3 py-0.5 text-[12px] leading-snug transition-colors hover:text-text hover:no-underline',
                          activeId === section.id
                            ? 'border-brand/70 text-brand'
                            : 'border-transparent text-text-muted',
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

        <!--
          Modules without groups keep the original behaviour: in-page TOC nested
          directly under the module name with the existing scrollspy treatment.
        -->
        <ul
          v-else-if="!mod.groups && normalizedRoutePath === mod.path && flatSections.length"
          class="m-0 mb-3 mt-1 ml-5 list-none border-l border-border p-0"
        >
          <li
            v-for="section in flatSections"
            :key="section.id"
            :class="['-ml-px', section.depth === 3 ? 'pl-3' : '']"
          >
            <a
              :href="`#${section.id}`"
              :class="[
                'block border-l-2 px-3 py-1 text-[13px] leading-snug transition-colors hover:text-text hover:no-underline',
                activeId === section.id
                  ? 'border-brand bg-brand/10 font-medium text-brand'
                  : 'border-transparent text-text-dim',
              ]"
              @click="scrollTo(section.id, $event)"
            >
              {{ section.text }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </aside>
</template>
