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
    :class="cn('a-drawer__overlay', props.class)"
  />
</template>

<!-- Teleported sibling of the drawer content — unscoped to survive the portal. -->
<style>
.a-drawer__overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.7);
}
.a-drawer__overlay[data-state='open'] {
  animation: a-drawer-overlay-in 200ms ease-out;
}
.a-drawer__overlay[data-state='closed'] {
  animation: a-drawer-overlay-out 150ms ease-in forwards;
}
@keyframes a-drawer-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes a-drawer-overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .a-drawer__overlay[data-state='open'],
  .a-drawer__overlay[data-state='closed'] {
    animation: none;
  }
}
</style>
