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
    :class="cn('a-skel a-skel-variant-image', animClass, props.class)"
    :style="rootStyle"
    role="status"
    aria-busy="true"
  >
    <svg
      v-if="props.showIcon"
      class="size-10"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-3.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM19 17H5l3.5-4.5 2.5 3 3.5-4.5L19 17Z"
        fill="currentColor"
      />
    </svg>
    <span class="a-skel-sr-only">Loading image…</span>
  </div>
</template>
