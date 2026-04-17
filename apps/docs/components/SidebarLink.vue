<script setup lang="ts">
defineProps<{ to: string }>();
</script>

<template>
  <NuxtLink
    :to="to"
    class="block rounded px-2.5 py-1.5 leading-snug text-text-dim hover:bg-surface hover:text-text hover:no-underline"
    active-class="!bg-surface-2 !text-accent font-medium"
    exact-active-class="!bg-surface-2 !text-accent font-medium"
  >
    <slot />
  </NuxtLink>
</template>
