<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopover } from '@/entries/popover';
import { ADrawer } from '@/entries/drawer';
import { provideResponsivePopoverContext } from '../composables/useResponsivePopoverContext';
import type { AResponsivePopoverProps } from '../types';

const props = withDefaults(defineProps<AResponsivePopoverProps>(), {
  breakpoint: '(min-width: 768px)',
  modal: true,
  scrollLock: 'events',
});

const open = defineModel<boolean>('open');

const isDesktop = useMediaQuery(() => props.breakpoint);

/**
 * Pre-imported on both branches — do NOT lazy-load. Switching the component identity at runtime
 * means we still hydrate the right tree client-side.
 */
const Root = computed(() => (isDesktop.value ? APopover : ADrawer));

/**
 * Only `scrollLock='body'` triggers reka-ui's `PopoverContentModal` (and its
 * `useBodyScrollLock`). For `'events'` we install our own document-level event lock in
 * `AResponsivePopoverContent`. For `'none'` nothing locks. Legacy `modal=false` still
 * forces non-modal regardless of `scrollLock`.
 */
const rekaModal = computed(() => {
  if (props.modal === false) return false;
  return props.scrollLock === 'body';
});

provideResponsivePopoverContext({
  open: computed(() => open.value ?? false),
  isDesktop: computed(() => isDesktop.value),
  scrollLock: computed(() => props.scrollLock),
});
</script>

<template>
  <component :is="Root" v-model:open="open" :modal="rekaModal" data-slot="responsive-popover">
    <slot :is-desktop="isDesktop" />
  </component>
</template>
