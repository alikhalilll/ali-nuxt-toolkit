<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import ASkeletonHeading from './ASkeletonHeading.vue';
import ASkeletonText from './ASkeletonText.vue';

interface Props {
  bars?: number;
  height?: number | string;
  showHeader?: boolean;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  bars: 7,
  height: '8rem',
  showHeader: true,
  animation: 'pulse',
});

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);

const chartStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : String(props.height),
}));

/* Pseudo-random but deterministic bar heights so the chart looks organic but
 * doesn't reshuffle on each render. */
const HEIGHTS = [62, 78, 45, 91, 68, 82, 55, 73, 39, 88, 60, 74];
function barHeight(i: number): string {
  return `${HEIGHTS[i % HEIGHTS.length]}%`;
}
</script>

<template>
  <div :class="cn(props.class)" role="status" aria-busy="true">
    <template v-if="props.showHeader">
      <ASkeletonHeading :level="4" :animation="props.animation" :width="'45%'" />
      <div style="margin-top: 0.4rem">
        <ASkeletonText :lines="1" :animation="props.animation" :width="'60%'" />
      </div>
    </template>
    <div class="a-skel-variant-chart" :style="chartStyle" style="margin-top: 1rem">
      <div
        v-for="i in props.bars"
        :key="i"
        :class="cn('a-skel a-skel-variant-chart__bar', animClass)"
        :style="{ height: barHeight(i - 1) }"
      />
    </div>
    <span class="a-skel-sr-only">Loading chart…</span>
  </div>
</template>
