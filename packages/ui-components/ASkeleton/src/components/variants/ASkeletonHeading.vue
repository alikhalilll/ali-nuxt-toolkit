<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';

interface Props {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  width?: number | string;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), { level: 2, animation: 'pulse' });

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);

const HEIGHT_BY_LEVEL: Record<number, string> = {
  1: '2.25rem',
  2: '1.75rem',
  3: '1.5rem',
  4: '1.25rem',
  5: '1.125rem',
  6: '1rem',
};

const rootStyle = computed(() => ({
  width:
    props.width !== undefined
      ? typeof props.width === 'number'
        ? `${props.width}px`
        : String(props.width)
      : '60%',
  height: HEIGHT_BY_LEVEL[props.level],
}));
</script>

<template>
  <div
    :class="cn('a-skel a-skel-variant-heading', animClass, props.class)"
    :style="rootStyle"
    role="status"
    aria-busy="true"
  >
    <span class="a-skel-sr-only">Loading heading…</span>
  </div>
</template>
