<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { ASkeletonBlockProps } from '../types';

const props = withDefaults(defineProps<ASkeletonBlockProps>(), {
  type: 'block',
  animation: 'shimmer',
  lines: 1,
});

const animationClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-block--anim-${props.animation}`
);

const blockClass = computed(() => [
  'a-skel-block',
  `a-skel-block--${props.type}`,
  animationClass.value,
]);

function toLength(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

const radiusValue = computed(() =>
  props.type === 'circle' && props.radius === undefined ? '50%' : toLength(props.radius)
);

const blockStyle = computed<CSSProperties>(() => ({
  width: toLength(props.w),
  height: toLength(props.h),
  borderRadius: radiusValue.value,
}));

const isMultiLineText = computed(() => props.type === 'text' && props.lines > 1);
</script>

<template>
  <div
    v-if="isMultiLineText"
    :class="cn('a-skel-block-stack', props.class)"
    role="status"
    aria-busy="true"
  >
    <div
      v-for="i in props.lines"
      :key="i"
      :class="blockClass"
      :style="{
        height: blockStyle.height ?? '0.75em',
        width: i === props.lines ? '70%' : '100%',
        borderRadius: blockStyle.borderRadius ?? '4px',
      }"
    />
  </div>
  <div
    v-else
    :class="cn(blockClass, props.class)"
    :style="blockStyle"
    role="status"
    aria-busy="true"
  />
</template>

<style scoped>
.a-skel-block-stack {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}
</style>
