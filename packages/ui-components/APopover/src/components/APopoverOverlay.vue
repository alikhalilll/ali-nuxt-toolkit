<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { APopoverOverlayProps } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<APopoverOverlayProps>(), { lockScroll: false });

let prevBodyOverflow = '';
let prevBodyTouchAction = '';
let prevPaddingRight = '';

function getScrollbarWidth() {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

onMounted(() => {
  if (!props.lockScroll) return;
  if (typeof document === 'undefined') return;
  const body = document.body;
  const sbw = getScrollbarWidth();
  prevBodyOverflow = body.style.overflow;
  prevBodyTouchAction = body.style.touchAction;
  prevPaddingRight = body.style.paddingRight;
  body.style.overflow = 'hidden';
  body.style.touchAction = 'none';
  if (sbw > 0) body.style.paddingRight = `${sbw}px`;
});

onBeforeUnmount(() => {
  if (!props.lockScroll) return;
  if (typeof document === 'undefined') return;
  const body = document.body;
  body.style.overflow = prevBodyOverflow;
  body.style.touchAction = prevBodyTouchAction;
  body.style.paddingRight = prevPaddingRight;
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
