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
const ids = computed(() => flat.value.map((n) => n.id));
const activeId = useActiveHeading(ids);

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault();
  scrollToHash(id);
}
</script>

<template>
  <aside
    v-if="flat.length"
    class="sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto text-sm xl:block"
  >
    <h4 class="mb-3 text-[13px] font-semibold text-text">On This Page</h4>
    <ul class="m-0 list-none border-l border-border p-0">
      <li v-for="link in flat" :key="link.id" :class="['-ml-px', link.depth === 3 ? 'pl-3' : '']">
        <a
          :href="`#${link.id}`"
          :class="[
            'block border-l-2 px-3 py-1 text-[13px] leading-snug transition-colors hover:text-text hover:no-underline',
            activeId === link.id
              ? 'border-accent-2 font-medium text-accent-2'
              : 'border-transparent text-text-dim',
          ]"
          @click="scrollTo(link.id, $event)"
        >
          {{ link.text }}
        </a>
      </li>
    </ul>
  </aside>
</template>
