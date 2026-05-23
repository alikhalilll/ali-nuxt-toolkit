<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import {
  PopoverContent,
  type PopoverContentEmits,
  type PopoverContentProps,
  PopoverPortal,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils';
import APopoverOverlay from './APopoverOverlay.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<
    PopoverContentProps & {
      class?: HTMLAttributes['class'];
      /** Dim the entire viewport behind the popover and block all interaction with the
       *  page (clicks are captured by the overlay; body scroll is locked while open).
       *  Pair with `<APopover :modal="true">` (the default) for the full modal behaviour. */
      overlay?: boolean;
      overlayClass?: HTMLAttributes['class'];
    }
  >(),
  { align: 'center', sideOffset: 4, overlay: false }
);
const emits = defineEmits<PopoverContentEmits>();
const delegated = reactiveOmit(props, 'class', 'overlay', 'overlayClass');
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
    <APopoverOverlay v-if="props.overlay" :class="props.overlayClass" />
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
