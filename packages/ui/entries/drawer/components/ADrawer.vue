<script setup lang="ts">
import { DrawerRoot } from 'vaul-vue';
import { useForwardPropsEmits } from 'reka-ui';
import type { ADrawerProps, ADrawerEmits } from '../types';

const props = withDefaults(defineProps<ADrawerProps>(), {
  shouldScaleBackground: true,
});
const emits = defineEmits<ADrawerEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DrawerRoot data-slot="drawer" v-bind="forwarded">
    <slot />
  </DrawerRoot>
</template>
