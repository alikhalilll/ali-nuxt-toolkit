<script setup lang="ts">
const toc = useDocToc();
const isOpen = ref(false);

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
const activeSection = computed(
  () => flatSections.value.find((s) => s.id === activeId.value) ?? flatSections.value[0] ?? null
);

const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    isOpen.value = false;
  }
);

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault();
  // Close BEFORE scrolling so the bar's height collapses and the sticky
  // offset shrinks, giving an accurate scroll target.
  isOpen.value = false;
  nextTick(() => scrollToHash(id));
}
</script>

<template>
  <div
    v-if="flatSections.length"
    data-mobile-toc-bar
    class="sticky top-14 z-20 -mx-4 mb-4 border-b border-border bg-bg/85 backdrop-blur-md md:hidden"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface/40"
      :aria-expanded="isOpen"
      aria-label="Toggle on-this-page navigation"
      @click="isOpen = !isOpen"
    >
      <span class="flex min-w-0 items-center gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          On this page
        </span>
        <span class="truncate font-medium text-accent-2">
          {{ activeSection?.text ?? 'Overview' }}
        </span>
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="[
          'flex-shrink-0 text-text-dim transition-transform duration-200',
          isOpen ? 'rotate-180' : '',
        ]"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div v-if="isOpen" class="max-h-[60vh] overflow-y-auto border-t border-border bg-bg px-4 py-3">
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
                ? 'border-accent-2 bg-accent-2/10 font-medium text-accent-2'
                : 'border-transparent text-text-dim',
            ]"
            @click="scrollTo(section.id, $event)"
          >
            {{ section.text }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
