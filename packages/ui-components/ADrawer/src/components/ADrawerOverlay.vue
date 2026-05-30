<script setup lang="ts">
import { DrawerOverlay } from 'vaul-vue';
import { reactiveOmit } from '@vueuse/core';
import { useForwardProps } from 'reka-ui';
import { cn } from '@alikhalilll/a-ui-base';
import type { ADrawerOverlayProps } from '../types';

const props = defineProps<ADrawerOverlayProps>();
const delegated = reactiveOmit(props, 'class');
const forwarded = useForwardProps(delegated);
</script>

<template>
  <DrawerOverlay
    data-slot="drawer-overlay"
    v-bind="forwarded"
    :class="
      cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/70',
        props.class
      )
    "
  />
</template>
