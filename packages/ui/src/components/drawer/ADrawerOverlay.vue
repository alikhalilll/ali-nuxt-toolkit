<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { DrawerOverlay } from 'vaul-vue';
import type { DialogOverlayProps } from 'reka-ui';
import { reactiveOmit } from '@vueuse/core';
import { useForwardProps } from 'reka-ui';
import { cn } from '../../lib/utils';

const props = defineProps<DialogOverlayProps & { class?: HTMLAttributes['class'] }>();
const delegated = reactiveOmit(props, 'class');
const forwarded = useForwardProps(delegated);
</script>

<template>
  <DrawerOverlay
    data-slot="drawer-overlay"
    v-bind="forwarded"
    :class="
      cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/60 backdrop-blur-sm',
        props.class
      )
    "
  />
</template>
