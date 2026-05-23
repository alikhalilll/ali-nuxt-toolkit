<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { DrawerContent, DrawerPortal } from 'vaul-vue';
import type { DialogContentEmits, DialogContentProps } from 'reka-ui';
import { reactiveOmit } from '@vueuse/core';
import { useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils';
import ADrawerOverlay from './ADrawerOverlay.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>();
const emits = defineEmits<DialogContentEmits>();
const delegated = reactiveOmit(props, 'class');
const forwarded = useForwardPropsEmits(delegated, emits);
</script>

<template>
  <DrawerPortal>
    <ADrawerOverlay />
    <DrawerContent
      data-slot="drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] shadow-2xl shadow-black/30 outline-none',
          props.class
        )
      "
    >
      <div class="bg-muted mx-auto mt-4 h-2 w-[100px] rounded-full" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
