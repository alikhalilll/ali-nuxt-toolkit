<script setup lang="ts">
import { computed, provide, watch } from 'vue';
import { setDebug, skeletonCSS } from '../core';
import {
  SMART_SKELETON_CONFIG_KEY,
  SMART_SKELETON_BOOT_KEY,
} from '../composables/useSmartSkeleton';
import type { ASmartSkeletonProviderProps } from '../types';

defineOptions({
  name: 'ASmartSkeletonProvider',
});

const props = defineProps<ASmartSkeletonProviderProps>();

provide(SMART_SKELETON_CONFIG_KEY, props);
provide(SMART_SKELETON_BOOT_KEY, { sent: false });

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
