<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@alikhalilll/a-ui-base';
import APopoverOverlay from './APopoverOverlay.vue';
import type { APopoverContentProps, APopoverContentEmits } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<APopoverContentProps>(), {
  align: 'center',
  sideOffset: 4,
  overlay: false,
  overlayLockScroll: false,
});
const emits = defineEmits<APopoverContentEmits>();
const delegated = reactiveOmit(props, 'class', 'overlay', 'overlayClass', 'overlayLockScroll');
const forwarded = useForwardPropsEmits(delegated, emits);
</script>

<template>
  <PopoverPortal>
    <APopoverOverlay
      v-if="props.overlay"
      :class="props.overlayClass"
      :lock-scroll="props.overlayLockScroll"
    />
    <PopoverContent
      data-slot="popover-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('a-popover__content', props.class)"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>

<!--
  PopoverContent is teleported to <body> by reka-ui's PopoverPortal. `<style scoped>`
  data-attributes don't propagate through teleport, so the dropdown surface is styled
  in this unscoped block. Class names are uniquely prefixed `a-popover__*`.
-->
<style>
.a-popover__content {
  z-index: 60;
  width: 18rem;
  padding: 1rem;
  border-radius: calc(var(--ak-ui-radius) - 2px);
  border: 1px solid hsl(var(--ak-ui-border) / 0.7);
  background: hsl(var(--ak-ui-popover));
  color: hsl(var(--ak-ui-popover-foreground));
  outline: none;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.15),
    0 8px 10px -6px rgba(0, 0, 0, 0.15);
}
.a-popover__content[data-state='open'] {
  animation: a-popover-in 150ms ease-out;
}
.a-popover__content[data-state='closed'] {
  animation: a-popover-out 100ms ease-in forwards;
}
@keyframes a-popover-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes a-popover-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .a-popover__content[data-state='open'],
  .a-popover__content[data-state='closed'] {
    animation: none;
  }
}
</style>
