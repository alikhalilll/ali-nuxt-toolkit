<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopoverTrigger } from '@alikhalilll/a-popover';
import { ADrawerTrigger } from '@alikhalilll/a-drawer';
import { useResponsivePopoverContext } from '../composables/useResponsivePopoverContext';

const props = withDefaults(
  defineProps<{
    breakpoint?: string;
    asChild?: boolean;
  }>(),
  { breakpoint: '(min-width: 768px)' }
);

const ctx = useResponsivePopoverContext();

// Prefer the root's resolved mode so the trigger always agrees with the content
// (and respects `forceBottomSheet` / future render-mode overrides on the root).
// Fall back to a local media query only when this component is used outside
// `AResponsivePopover` (unusual but supported).
const fallbackIsDesktop = useMediaQuery(() => props.breakpoint);
const isDesktop = computed(() => ctx?.isDesktop.value ?? fallbackIsDesktop.value);

const Trigger = computed(() => (isDesktop.value ? APopoverTrigger : ADrawerTrigger));
</script>

<template>
  <component :is="Trigger" :as-child="props.asChild" data-slot="responsive-popover-trigger">
    <slot />
  </component>
</template>
