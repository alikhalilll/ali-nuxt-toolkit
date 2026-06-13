<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';

interface Props {
  size?: number | string;
  shape?: 'circle' | 'square' | 'rounded';
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), { size: 48, shape: 'circle', animation: 'pulse' });

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);

const sizeStyle = computed(() => {
  const s = typeof props.size === 'number' ? `${props.size}px` : String(props.size);
  return {
    width: s,
    height: s,
    borderRadius:
      props.shape === 'circle'
        ? '9999px'
        : props.shape === 'rounded'
          ? 'var(--ak-skel-radius)'
          : '0',
  };
});
</script>

<template>
  <div
    :class="cn('a-skel a-skel-variant-avatar', animClass, props.class)"
    :style="sizeStyle"
    role="status"
    aria-busy="true"
  >
    <span class="a-skel-sr-only">Loading avatar…</span>
  </div>
</template>
