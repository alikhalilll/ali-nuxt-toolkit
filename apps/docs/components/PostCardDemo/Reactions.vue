<script setup lang="ts">
// Mirrors PostReactions.vue — reaction button with heart icon + count.
// Classes copied verbatim; the icon is a tiny inline SVG so we don't need
// @nuxt/icon in the playground. `numberWithCommas` substituted for toLocaleString.
defineProps<{
  count: number;
  isReacted?: boolean;
}>();
</script>

<template>
  <!--
    `data-ask-block` tells the smart-skeleton walker to draw this whole
    button as one bone at its own bounding box + border-radius, instead of
    recursing into the SVG + count. Mirrors the handcrafted
    `<ASkeletonBlock :w="48" :h="16" class="rounded-full" />` footer pill in
    muslim-academy-platform's `PostCardSkeleton.vue`.
  -->
  <button
    type="button"
    data-ask-block
    class="group text-sm rounded-full flex gap-1.5 transition-colors items-center"
    :class="isReacted ? 'text-red-500' : 'text-gray-600 hover:text-red-500'"
  >
    <span
      class="reaction-pop inline-flex transition-transform"
      :class="isReacted ? 'scale-110' : 'group-hover:scale-110'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        :fill="isReacted ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2"
        class="size-4 transition-all"
        :class="isReacted ? 'text-red-500' : ''"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
    </span>
    <span>{{ count.toLocaleString() }}</span>
  </button>
</template>
