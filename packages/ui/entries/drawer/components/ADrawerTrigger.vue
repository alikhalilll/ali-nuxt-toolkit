<script setup lang="ts">
import { DrawerTrigger, type DrawerTriggerProps } from 'vaul-vue';
import { useForwardProps } from 'reka-ui';

const props = defineProps<DrawerTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DrawerTrigger data-slot="drawer-trigger" v-bind="forwarded">
    <slot />
  </DrawerTrigger>
</template>
