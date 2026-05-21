<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopoverContent } from '@/entries/popover';
import { ADrawerContent } from '@/entries/drawer';

const props = withDefaults(
  defineProps<{
    breakpoint?: string;
    /** Classes applied on both branches. Avoid width / inset classes here. */
    class?: HTMLAttributes['class'];
    /** Classes applied only when the popover (desktop) branch is rendered. */
    popoverClass?: HTMLAttributes['class'];
    /** Classes applied only when the drawer (mobile) branch is rendered. */
    drawerClass?: HTMLAttributes['class'];
    /**
     * Render the dimmed overlay on the desktop popover branch. Defaults to `false` — popovers
     * on desktop are non-modal-looking by convention. The mobile drawer always has its own
     * overlay (vaul-vue's `DrawerOverlay`) regardless of this prop.
     */
    overlay?: boolean;
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
  }>(),
  {
    breakpoint: '(min-width: 768px)',
    align: 'start',
    sideOffset: 4,
    overlay: false,
  }
);

const isDesktop = useMediaQuery(() => props.breakpoint);

const mergedClass = computed(() => [
  props.class,
  isDesktop.value ? props.popoverClass : props.drawerClass,
]);
</script>

<template>
  <APopoverContent
    v-if="isDesktop"
    :overlay="props.overlay"
    :align="props.align"
    :side-offset="props.sideOffset"
    :class="mergedClass"
    data-slot="responsive-popover-content"
  >
    <slot />
  </APopoverContent>
  <ADrawerContent v-else :class="mergedClass" data-slot="responsive-popover-content">
    <slot />
  </ADrawerContent>
</template>
