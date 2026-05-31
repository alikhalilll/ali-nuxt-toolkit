<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopoverContent, useEventScrollLock } from '@alikhalilll/a-popover';
import { ADrawerContent } from '@alikhalilll/a-drawer';
import { useResponsivePopoverContext } from '../composables/useResponsivePopoverContext';

const props = withDefaults(
  defineProps<{
    breakpoint?: string;
    /** Classes applied on both branches. Avoid width / inset classes here. */
    class?: HTMLAttributes['class'];
    /** Classes applied only when the popover (desktop) branch is rendered. */
    popoverClass?: HTMLAttributes['class'];
    /** Classes applied only when the drawer (mobile) branch is rendered. */
    drawerClass?: HTMLAttributes['class'];
    /**
     * Render the dimmed overlay on the desktop popover branch. Defaults to `false` — popovers
     * on desktop are non-modal-looking by convention. The mobile drawer always has its own
     * overlay (vaul-vue's `DrawerOverlay`) regardless of this prop.
     */
    overlay?: boolean;
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
  }>(),
  {
    breakpoint: '(min-width: 768px)',
    align: 'start',
    sideOffset: 4,
    overlay: false,
  }
);

const ctx = useResponsivePopoverContext();

// Prefer the root's media query (so both layers agree). Fall back to a local one when this
// component is used outside `AResponsivePopover` (unusual but supported).
const fallbackIsDesktop = useMediaQuery(() => props.breakpoint);
const isDesktop = computed(() => ctx?.isDesktop.value ?? fallbackIsDesktop.value);

const scrollLockMode = computed(() => ctx?.scrollLock.value ?? 'events');
const overlayLockScroll = computed(() => scrollLockMode.value === 'body');

const mergedClass = computed(() => [
  props.class,
  isDesktop.value ? props.popoverClass : props.drawerClass,
]);

// Sticky-safe scroll lock — active in both the desktop popover and the mobile drawer when
// the root asked for the event-based strategy. The getter resolves every responsive popover
// content element currently in the DOM (popover or drawer, since both carry the data attr
// below), which lets stacked / responsive surfaces share the lock cleanly. On mobile this
// stops the page underneath the drawer from scrolling while still letting the drawer's
// inner list scroll via `canConsume()` boundary detection; `vaul-vue`'s drag-to-dismiss is
// built on pointer events (not touchmove) and is therefore unaffected.
useEventScrollLock({
  allowedScrollContainer: () => {
    if (typeof document === 'undefined') return [];
    return Array.from(
      document.querySelectorAll<HTMLElement>('[data-responsive-popover-scroll-container="true"]')
    );
  },
  active: computed(() => !!ctx?.open.value && scrollLockMode.value === 'events'),
});
</script>

<template>
  <APopoverContent
    v-if="isDesktop"
    :overlay="props.overlay"
    :overlay-lock-scroll="overlayLockScroll"
    :align="props.align"
    :side-offset="props.sideOffset"
    :class="mergedClass"
    data-slot="responsive-popover-content"
    data-responsive-popover-scroll-container="true"
  >
    <slot />
  </APopoverContent>
  <ADrawerContent
    v-else
    :class="mergedClass"
    data-slot="responsive-popover-content"
    data-responsive-popover-scroll-container="true"
  >
    <slot />
  </ADrawerContent>
</template>
