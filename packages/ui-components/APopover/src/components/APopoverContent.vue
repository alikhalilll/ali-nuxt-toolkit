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
    <!--
      Overlay is a sibling of PopoverContent inside the same portal. Reka-ui's
      DismissableLayer treats any pointer-down outside the content as a dismiss,
      so clicking the overlay closes the popover for free. The overlay component
      locks body scroll on mount and restores it on unmount.
    -->
    <APopoverOverlay
      v-if="props.overlay"
      :class="props.overlayClass"
      :lock-scroll="props.overlayLockScroll"
    />
    <PopoverContent
      data-slot="popover-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[60] w-72 rounded-md border border-border/70 p-4 shadow-xl shadow-black/15 outline-none',
          props.class
        )
      "
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
