<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { useEventScrollLock } from '../composables/useEventScrollLock';
import type { APopoverOverlayProps } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<APopoverOverlayProps>(), { lockScroll: false });

/**
 * Sticky-safe page-scroll lock.
 *
 * The legacy implementation here set `body.style.overflow = 'hidden'` for the lifetime
 * of the overlay. That visually freezes the page but has a hidden cost: the moment the
 * body's overflow flips to `hidden`, every `position: sticky` descendant on the host page
 * snaps out of its `top` offset and scrolls away with the content. Reports of "the
 * navbar disappears when I open the picker mid-scroll" all trace back to that mutation.
 *
 * We now delegate to {@link useEventScrollLock}, which intercepts wheel / touchmove /
 * scroll-key events at document capture and lets only events inside the popover surface
 * through. The page stays a scrolling container in DOM terms (so `position: sticky` keeps
 * working) but is visually inert while the popover is open. The page scrollbar stays
 * visible — no width shift, no `padding-right` compensation — which also fixes the layout
 * jump some hosts saw when the scrollbar disappeared and reappeared.
 *
 * `allowedScrollContainer` looks for any popover / drawer / responsive-popover content
 * surface in the portal tree. That covers raw `APopover` usage, `AResponsivePopover` on
 * either branch, and `ADrawer` mounted inside a popover overlay — the inner list can
 * always scroll, the page underneath cannot.
 */
useEventScrollLock({
  active: computed(() => !!props.lockScroll),
  allowedScrollContainer: () => {
    if (typeof document === 'undefined') return [];
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        [
          '[data-slot="popover-content"]',
          '[data-slot="drawer-content"]',
          '[data-slot="responsive-popover-content"]',
          '[data-responsive-popover-scroll-container="true"]',
        ].join(', ')
      )
    );
  },
});
</script>

<template>
  <div
    data-slot="popover-overlay"
    aria-hidden="true"
    :class="cn('a-popover__overlay', props.class)"
  />
</template>

<!-- Teleported sibling of the popover content — unscoped to survive the portal. -->
<style>
.a-popover__overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.7);
}
.a-popover__overlay[data-state='open'] {
  animation: a-popover-overlay-in 150ms ease-out;
}
.a-popover__overlay[data-state='closed'] {
  animation: a-popover-overlay-out 100ms ease-in forwards;
}
@keyframes a-popover-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes a-popover-overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .a-popover__overlay[data-state='open'],
  .a-popover__overlay[data-state='closed'] {
    animation: none;
  }
}
</style>
