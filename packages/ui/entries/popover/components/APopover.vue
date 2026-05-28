<script setup lang="ts">
import { PopoverRoot, useForwardPropsEmits } from 'reka-ui';
import type { APopoverProps, APopoverEmits } from '../types';

/**
 * Defaults `modal` to `true` so the popover locks page scroll, traps focus, and an overlay
 * (rendered by APopoverContent when `overlay` is set) actually dims the page.
 * Pass `:modal="false"` for tooltip-style non-modal popovers.
 */
const props = withDefaults(defineProps<APopoverProps>(), { modal: true });
const emits = defineEmits<APopoverEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverRoot v-slot="slotProps" data-slot="popover" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </PopoverRoot>
</template>
