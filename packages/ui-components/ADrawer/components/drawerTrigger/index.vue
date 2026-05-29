<script setup lang="ts">
import { DrawerTrigger } from 'vaul-vue';
import { useForwardProps } from 'reka-ui';
import type { ADrawerTriggerProps } from '../../types';

const props = defineProps<ADrawerTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DrawerTrigger data-slot="drawer-trigger" v-bind="forwarded">
    <slot />
  </DrawerTrigger>
</template>
