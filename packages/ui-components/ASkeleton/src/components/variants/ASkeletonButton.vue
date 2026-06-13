<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';

interface Props {
  width?: number | string;
  height?: number | string;
  outlined?: boolean;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), { width: 120, height: 40, animation: 'pulse' });

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);

const rootStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : String(props.width),
  height: typeof props.height === 'number' ? `${props.height}px` : String(props.height),
  ...(props.outlined
    ? { backgroundColor: 'transparent', border: '1px solid var(--ak-skel-ring)' }
    : {}),
}));
</script>

<template>
  <div
    :class="cn('a-skel a-skel-variant-button', animClass, props.class)"
    :style="rootStyle"
    role="status"
    aria-busy="true"
  >
    <span class="a-skel-sr-only">Loading button…</span>
  </div>
</template>
