<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'reka-ui';
import { PopoverRoot, useForwardPropsEmits } from 'reka-ui';

/**
 * Defaults `modal` to `true` so the popover locks page scroll, traps focus, and an overlay
 * (rendered by APopoverContent when `overlay` is set) actually dims the page.
 * Pass `:modal="false"` for tooltip-style non-modal popovers.
 */
const props = withDefaults(defineProps<PopoverRootProps>(), { modal: true });
const emits = defineEmits<PopoverRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverRoot v-slot="slotProps" data-slot="popover" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </PopoverRoot>
</template>
