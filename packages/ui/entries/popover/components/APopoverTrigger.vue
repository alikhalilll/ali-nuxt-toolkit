<script setup lang="ts">
import { PopoverTrigger, useForwardProps } from 'reka-ui';
import type { APopoverTriggerProps } from '../types';

const props = defineProps<APopoverTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <PopoverTrigger data-slot="popover-trigger" v-bind="forwarded">
    <slot />
  </PopoverTrigger>
</template>
