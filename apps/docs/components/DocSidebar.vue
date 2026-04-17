<script setup lang="ts">
const route = useRoute();
const toc = useDocToc();

interface PageEntry {
  path: string;
  label: string;
  group: string;
}

const pages: PageEntry[] = [
  { path: '/', label: 'Introduction', group: 'Getting Started' },
  { path: '/api-provider', label: 'Guide', group: 'api-provider' },
  { path: '/crypto', label: 'Guide', group: 'crypto' },
  { path: '/auto-middleware', label: 'Guide', group: 'auto-middleware' },
];

const groupedPages = computed(() => {
  const groups = new Map<string, PageEntry[]>();
  for (const p of pages) {
    const list = groups.get(p.group) ?? [];
    list.push(p);
    groups.set(p.group, list);
  }
  return [...groups.entries()];
});

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

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
  history.replaceState(history.state, '', `#${id}`);
}
</script>

<template>
  <aside
    class="sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto pr-2 text-sm md:block"
  >
    <template v-for="[group, list] in groupedPages" :key="group">
      <h4 class="mb-1.5 mt-6 px-3 text-[13px] font-semibold text-text first:mt-0">
        {{ group }}
      </h4>
      <ul class="m-0 list-none p-0">
        <template v-for="page in list" :key="page.path">
          <li>
            <SidebarLink :to="page.path">{{ page.label }}</SidebarLink>
          </li>
          <li v-if="normalizedRoutePath === page.path && flatSections.length">
            <ul class="m-0 mb-2 ml-5 list-none border-l border-border p-0">
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
                      ? 'border-text font-medium text-text'
                      : 'border-transparent text-text-dim',
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
    </template>
  </aside>
</template>
