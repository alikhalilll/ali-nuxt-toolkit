<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopoverTrigger } from '@/entries/popover';
import { ADrawerTrigger } from '@/entries/drawer';

const props = withDefaults(
  defineProps<{
    breakpoint?: string;
    asChild?: boolean;
  }>(),
  { breakpoint: '(min-width: 768px)' }
);

const isDesktop = useMediaQuery(() => props.breakpoint);
const Trigger = computed(() => (isDesktop.value ? APopoverTrigger : ADrawerTrigger));
</script>

<template>
  <component :is="Trigger" :as-child="props.asChild" data-slot="responsive-popover-trigger">
    <slot />
  </component>
</template>
