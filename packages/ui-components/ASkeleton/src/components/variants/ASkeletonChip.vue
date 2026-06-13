<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';

interface Props {
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), { width: 80, height: 24, animation: 'pulse' });

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);
const rootStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : String(props.width),
  height: typeof props.height === 'number' ? `${props.height}px` : String(props.height),
  borderRadius: '9999px',
  display: 'inline-block',
}));
</script>

<template>
  <span
    :class="cn('a-skel', animClass, props.class)"
    :style="rootStyle"
    role="status"
    aria-busy="true"
  />
</template>
