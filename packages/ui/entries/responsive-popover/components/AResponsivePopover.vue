<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopover } from '@/entries/popover';
import { ADrawer } from '@/entries/drawer';

const props = withDefaults(
  defineProps<{
    /** CSS media query for the desktop break. Below this width we render a vaul drawer. */
    breakpoint?: string;
    /**
     * When true, the popover (desktop) locks page scroll, traps focus, and renders an overlay.
     * The drawer (mobile) is always modal-like (vaul-vue ships its own overlay + scroll-lock).
     */
    modal?: boolean;
  }>(),
  { breakpoint: '(min-width: 768px)', modal: true }
);

const open = defineModel<boolean>('open');

const isDesktop = useMediaQuery(() => props.breakpoint);

/**
 * Pre-imported on both branches — do NOT lazy-load. Switching the component identity at runtime
 * means we still hydrate the right tree client-side.
 */
const Root = computed(() => (isDesktop.value ? APopover : ADrawer));
</script>

<template>
  <component :is="Root" v-model:open="open" :modal="props.modal" data-slot="responsive-popover">
    <slot :is-desktop="isDesktop" />
  </component>
</template>
