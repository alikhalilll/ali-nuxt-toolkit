<script setup lang="ts">
defineProps<{ to: string }>();
</script>

<template>
  <NuxtLink
    :to="to"
    class="block rounded-md px-3 py-1.5 text-[13.5px] leading-snug text-text-dim transition-colors hover:text-text hover:no-underline"
    active-class="!text-text font-medium"
    exact-active-class="!text-text font-medium"
  >
    <slot />
  </NuxtLink>
</template>
