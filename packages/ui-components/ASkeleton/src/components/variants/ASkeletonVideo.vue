<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';

interface Props {
  ratio?: string;
  width?: number | string;
  height?: number | string;
  showIcon?: boolean;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  ratio: '16 / 9',
  showIcon: true,
  animation: 'pulse',
});

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);

const rootStyle = computed(() => {
  const s: Record<string, string> = {};
  if (props.ratio) s.aspectRatio = props.ratio;
  if (props.width !== undefined)
    s.width = typeof props.width === 'number' ? `${props.width}px` : String(props.width);
  if (props.height !== undefined)
    s.height = typeof props.height === 'number' ? `${props.height}px` : String(props.height);
  return s;
});
</script>

<template>
  <div
    :class="cn('a-skel a-skel-variant-video', animClass, props.class)"
    :style="rootStyle"
    role="status"
    aria-busy="true"
  >
    <svg
      v-if="props.showIcon"
      class="size-12"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
      <path d="M10 8l6 4-6 4V8Z" fill="currentColor" />
    </svg>
    <span class="a-skel-sr-only">Loading video…</span>
  </div>
</template>
