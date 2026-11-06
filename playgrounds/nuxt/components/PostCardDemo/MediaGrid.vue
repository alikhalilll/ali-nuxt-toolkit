<script setup lang="ts">
// Mirrors PostCard/MediaGrid.vue. Real impl uses <UiASharedImg> + <video> and
// a tileClassAt(i) helper driven by item count. Empty media → renders
// nothing, which is the common case in the feed.
interface MediaItem {
  type: 'image' | 'video';
  url: string;
}
const props = defineProps<{ media?: MediaItem[] }>();

function tileClassAt(i: number): string {
  const n = props.media?.length ?? 0;
  if (n === 1) return 'col-span-2 aspect-video';
  if (n === 2) return 'aspect-square';
  if (n === 3) return i === 0 ? 'col-span-2 aspect-video' : 'aspect-square';
  return 'aspect-square';
}
</script>

<template>
  <div v-if="media && media.length" class="gap-1.5 grid grid-cols-2">
    <button
      v-for="(item, i) in media"
      :key="item.url"
      type="button"
      class="p-0 rounded-xl bg-transparent block transition-transform relative overflow-hidden hover:opacity-95"
      :class="tileClassAt(i)"
      :aria-label="item.type === 'video' ? 'Open video' : 'Open image'"
    >
      <span class="rounded-xl h-full w-full overflow-hidden block">
        <img
          v-if="item.type === 'image'"
          :src="item.url"
          alt=""
          class="h-full w-full object-cover"
        />
        <video
          v-else
          :src="item.url"
          class="rounded-xl h-full w-full object-cover"
          preload="metadata"
          muted
          playsinline
        />
      </span>
      <span
        v-if="item.type === 'video'"
        class="text-white m-auto rounded-full bg-black/50 grid size-12 pointer-events-none inset-0 place-items-center absolute"
        aria-hidden="true"
        >▶</span
      >
    </button>
  </div>
</template>
