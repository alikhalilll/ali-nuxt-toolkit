<script setup lang="ts">
import { DrawerContent, DrawerPortal } from 'vaul-vue';
import { reactiveOmit } from '@vueuse/core';
import { useForwardPropsEmits } from 'reka-ui';
import { cn } from '@alikhalilll/a-ui-base';
import ADrawerOverlay from './ADrawerOverlay.vue';
import type { ADrawerContentProps, ADrawerContentEmits } from '../types';

defineOptions({ inheritAttrs: false });

const props = defineProps<ADrawerContentProps>();
const emits = defineEmits<ADrawerContentEmits>();
const delegated = reactiveOmit(props, 'class');
const forwarded = useForwardPropsEmits(delegated, emits);
</script>

<template>
  <DrawerPortal>
    <ADrawerOverlay />
    <DrawerContent
      data-slot="drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('a-drawer__content', props.class)"
    >
      <div class="a-drawer__handle" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>

<!--
  DrawerContent is teleported to <body> by vaul-vue's DrawerPortal, so styles must be
  unscoped to survive the portal. Class names prefixed `a-drawer__*` to avoid collisions.
-->
<style>
.a-drawer__content {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 50;
  margin-top: 6rem;
  display: flex;
  height: auto;
  flex-direction: column;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  background: hsl(var(--ak-ui-background));
  color: hsl(var(--ak-ui-foreground));
  outline: none;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.3),
    0 12px 24px -8px rgba(0, 0, 0, 0.25);
}
.a-drawer__handle {
  margin: 1rem auto 0;
  height: 0.5rem;
  width: 100px;
  border-radius: 999px;
  background: hsl(var(--ak-ui-muted));
}
</style>
