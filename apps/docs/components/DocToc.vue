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
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
  history.replaceState(history.state, '', `#${id}`);
}
</script>

<template>
  <aside
    v-if="flat.length"
    class="sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto text-sm xl:block"
  >
    <h4 class="mb-3 text-[13px] font-semibold text-text">On This Page</h4>
    <ul class="m-0 list-none p-0">
      <li v-for="link in flat" :key="link.id" :class="[link.depth === 3 ? 'pl-3' : '']">
        <a
          :href="`#${link.id}`"
          :class="[
            'block py-1 text-[13px] leading-snug transition-colors hover:text-text hover:no-underline',
            activeId === link.id ? 'font-medium text-text' : 'text-text-dim',
          ]"
          @click="scrollTo(link.id, $event)"
        >
          {{ link.text }}
        </a>
      </li>
    </ul>
  </aside>
</template>
