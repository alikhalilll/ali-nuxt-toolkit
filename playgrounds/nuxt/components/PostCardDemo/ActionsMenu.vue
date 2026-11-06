<script setup lang="ts">
// Mirrors PostActionsMenu.vue closed state — the real component wraps a
// <UiButton variant="ghost" size="icon"> inside a <UiAPopover>. Popover
// content only mounts when open, so in the "loading" frame we only ever see
// the trigger button here. Classes copied verbatim from the real impl.
</script>

<template>
  <!--
    `data-ask-block` draws the whole ⋯ button as one 32×32 rounded-md bone
    instead of an SVG-sized media bone centred inside an unpainted button.
    Matches how the real card reads at a glance (a rounded hit area, not a
    free-floating icon).
  -->
  <button
    type="button"
    data-ask-block
    aria-label="Post actions"
    class="text-gray-400 me--2 h-8 w-8 rounded-md hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center cursor-pointer transition-colors"
  >
    <!-- hugeicons:more-vertical-circle-01, inline svg to avoid a @nuxt/icon dep in the playground -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="size-4"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="7" r="0.8" fill="currentColor" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" />
    </svg>
  </button>
</template>
