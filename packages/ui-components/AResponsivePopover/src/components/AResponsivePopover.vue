<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopover } from '@alikhalilll/a-popover';
import { ADrawer } from '@alikhalilll/a-drawer';
import { provideResponsivePopoverContext } from '../composables/useResponsivePopoverContext';
import type { AResponsivePopoverProps, AResponsivePopoverSlots } from '../types';

const props = withDefaults(defineProps<AResponsivePopoverProps>(), {
  breakpoint: '(min-width: 768px)',
  modal: true,
  scrollLock: 'events',
});

defineSlots<AResponsivePopoverSlots>();

const open = defineModel<boolean>('open');

const isDesktop = useMediaQuery(() => props.breakpoint);

/**
 * Pre-imported on both branches — do NOT lazy-load. Switching the component identity at runtime
 * means we still hydrate the right tree client-side.
 */
const Root = computed(() => (isDesktop.value ? APopover : ADrawer));

/**
 * Per-branch `modal` resolution — the two roots interpret the prop differently:
 *
 *   APopover (desktop, reka-ui): `modal=true` triggers `PopoverContentModal` + its
 *   `useBodyScrollLock`. We only want that when the caller explicitly opted into the
 *   body-level scroll lock; for `'events'`/`'none'` we install our own lock in
 *   `AResponsivePopoverContent`. Legacy `modal=false` still forces non-modal.
 *
 *   ADrawer (mobile, vaul-vue): `modal=false` SUPPRESSES THE OVERLAY entirely. Drawers
 *   are modal by convention (a dimmed backdrop is the affordance), so default to modal
 *   unless the caller explicitly turned the whole thing off.
 */
const rekaModal = computed(() => {
  if (props.modal === false) return false;
  return props.scrollLock === 'body';
});
const drawerModal = computed(() => props.modal !== false);
const rootModal = computed(() => (isDesktop.value ? rekaModal.value : drawerModal.value));

provideResponsivePopoverContext({
  open: computed(() => open.value ?? false),
  isDesktop: computed(() => isDesktop.value),
  scrollLock: computed(() => props.scrollLock),
});
</script>

<template>
  <component :is="Root" v-model:open="open" :modal="rootModal" data-slot="responsive-popover">
    <slot :is-desktop="isDesktop" />
  </component>
</template>
