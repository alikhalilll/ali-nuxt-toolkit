<script setup lang="ts">
import { DrawerRoot, DrawerRootNested } from 'vaul-vue';
import { useForwardPropsEmits } from 'reka-ui';
import type { ADrawerProps, ADrawerEmits } from '../types';

const props = withDefaults(defineProps<ADrawerProps>(), {
  shouldScaleBackground: true,
  nested: false,
});
const emits = defineEmits<ADrawerEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <!-- When `nested`, use vaul's DrawerRootNested wrapper — it injects the parent
       DrawerRoot's onNestedDrag/Release/OpenChange bridges so the outer drawer's
       dismiss layer + focus trap stay coherent with this inner drawer. Without it,
       the outer drawer would race the inner on pointer-down-outside and swallow
       focus into its trap, breaking overlay-close scoping and input typing. -->
  <DrawerRootNested v-if="nested" data-slot="drawer" v-bind="forwarded">
    <slot />
  </DrawerRootNested>
  <DrawerRoot v-else data-slot="drawer" v-bind="forwarded">
    <slot />
  </DrawerRoot>
</template>
