<script setup lang="ts">
import { DrawerRoot, type DrawerRootEmits, type DrawerRootProps } from 'vaul-vue';
import { useForwardPropsEmits } from 'reka-ui';

const props = withDefaults(defineProps<DrawerRootProps>(), {
  shouldScaleBackground: true,
});
const emits = defineEmits<DrawerRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DrawerRoot data-slot="drawer" v-bind="forwarded">
    <slot />
  </DrawerRoot>
</template>
