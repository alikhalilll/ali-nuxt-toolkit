<script setup lang="ts">
import { computed, provide, watch } from 'vue';
import { setDebug, skeletonCSS } from '../core';
import {
  GHOST_SKELETON_CONFIG_KEY,
  GHOST_SKELETON_BOOT_KEY,
} from '../composables/useGhostSkeleton';
import type { AGhostSkeletonProviderProps } from '../types';

defineOptions({
  name: 'AGhostSkeletonProvider',
});

const props = defineProps<AGhostSkeletonProviderProps>();

provide(GHOST_SKELETON_CONFIG_KEY, props);
provide(GHOST_SKELETON_BOOT_KEY, { sent: false });

watch(
  () => props.debug,
  (debug) => {
    if (debug !== undefined && typeof window !== 'undefined') setDebug(debug);
  },
  { immediate: true }
);

const css = computed(() => skeletonCSS(props));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
  <component :is="'style'" v-if="css" :nonce="nonce" v-text="css" />
  <slot />
</template>
