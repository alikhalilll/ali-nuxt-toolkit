<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { cn } from '@/utils';
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
  // Compensate for the missing scrollbar so the layout doesn't jump.
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
    :class="
      cn(
        // `fixed inset-0` covers the entire viewport; `pointer-events-auto` captures every
        // click so it can never reach the page underneath. `z-50` keeps us above any normal
        // page chrome; the popover content sits at `z-[60]`.
        'fixed inset-0 z-50 bg-black/70 pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        props.class
      )
    "
  />
</template>
