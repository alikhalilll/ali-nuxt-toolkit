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

// Suppress vaul-vue's body-style scroll lock (which sets `body { overflow:hidden;
// position:fixed }` and breaks `position: sticky` everywhere on the page) whenever
// the caller is using the sticky-safe event lock — the desktop popover branch is
// already sticky-safe via `useEventScrollLock`, and we want the mobile drawer to
// behave identically. Only the legacy `'body'` strategy keeps vaul's default lock.
const drawerNoBodyStyles = computed(() => props.scrollLock !== 'body');

provideResponsivePopoverContext({
  open: computed(() => open.value ?? false),
  isDesktop: computed(() => isDesktop.value),
  scrollLock: computed(() => props.scrollLock),
});
</script>

<template>
  <APopover v-if="isDesktop" v-model:open="open" :modal="rekaModal" data-slot="responsive-popover">
    <slot :is-desktop="true" />
  </APopover>
  <ADrawer
    v-else
    v-model:open="open"
    :modal="drawerModal"
    :no-body-styles="drawerNoBodyStyles"
    data-slot="responsive-popover"
  >
    <slot :is-desktop="false" />
  </ADrawer>
</template>
