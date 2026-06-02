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
 *   built-in `useBodyScrollLock`, which mutates `body { overflow: hidden }` and so
 *   breaks `position: sticky` on the host page. We never want that — our own
 *   event-based lock in `AResponsivePopoverContent` is sticky-safe and covers both
 *   `'events'` and `'body'` modes. Force `modal=false` on reka-ui regardless of the
 *   caller's `scrollLock` choice. Legacy `props.modal === false` still propagates
 *   (it was explicit).
 *
 *   ADrawer (mobile, vaul-vue): `modal=false` SUPPRESSES THE OVERLAY entirely. Drawers
 *   are modal by convention (a dimmed backdrop is the affordance), so default to modal
 *   unless the caller explicitly turned the whole thing off.
 */
const rekaModal = computed(() => false);
const drawerModal = computed(() => props.modal !== false);

// Always tell vaul to skip its body-style scroll lock — our event-based lock owns the
// scroll-prevention strategy now, and vaul's default `body { overflow: hidden;
// position: fixed }` mutation kills `position: sticky` everywhere on the host page.
// (Was previously gated on `scrollLock !== 'body'`; now `'body'` is also event-based,
// so we apply this unconditionally.)
const drawerNoBodyStyles = computed(() => true);

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
