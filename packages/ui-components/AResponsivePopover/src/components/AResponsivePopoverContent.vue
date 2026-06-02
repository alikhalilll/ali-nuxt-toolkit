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
// The overlay's own lock (when overlay=true) is also event-based since APopover@>=1.x —
// flag it on for any lock mode so raw `<AResponsivePopoverContent :overlay>` consumers
// get the same sticky-safe lock from either path. Harmless if overlay=false.
const overlayLockScroll = computed(() => scrollLockMode.value !== 'none');

const mergedClass = computed(() => [
  props.class,
  isDesktop.value ? props.popoverClass : props.drawerClass,
]);

// Sticky-safe scroll lock. Active in both the desktop popover and the mobile drawer
// whenever the root requested ANY lock mode (`'events'` or `'body'`). The old `'body'`
// mode used to delegate to a `body { overflow: hidden }` mutation in `APopoverOverlay`,
// which silently broke `position: sticky` on the host page (the picker would open and
// the consumer's sticky header would vanish). That mutation is gone — both modes now
// share this event-capture implementation, which intercepts wheel / touchmove / scroll-
// keys at document level and lets only events inside a popover / drawer through. The
// page scrollbar stays visible, sticky positioning keeps working, and the picker's own
// inner list still scrolls via `canConsume()` boundary detection. `vaul-vue`'s pointer-
// based drag-to-dismiss is unaffected because it's pointer events, not touchmove.
useEventScrollLock({
  allowedScrollContainer: () => {
    if (typeof document === 'undefined') return [];
    return Array.from(
      document.querySelectorAll<HTMLElement>('[data-responsive-popover-scroll-container="true"]')
    );
  },
  active: computed(() => !!ctx?.open.value && scrollLockMode.value !== 'none'),
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
