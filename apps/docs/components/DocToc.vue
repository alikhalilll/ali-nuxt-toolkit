<script setup lang="ts">
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
</script>

<template>
  <aside
    v-if="flat.length"
    class="sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto text-[13px] xl:block"
  >
    <h4 class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      On this page
    </h4>
    <ul class="m-0 list-none border-l border-border p-0">
      <li
        v-for="link in flat"
        :key="link.id"
        :class="['-ml-px', link.depth === 3 ? 'pl-4 text-xs' : '']"
      >
        <a
          :href="`#${link.id}`"
          class="block border-l-2 border-transparent px-3 py-1 leading-snug text-text-dim hover:text-text hover:no-underline"
        >
          {{ link.text }}
        </a>
      </li>
    </ul>
  </aside>
</template>
