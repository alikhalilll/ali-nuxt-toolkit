<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';

interface Props {
  lines?: number;
  width?: number | string;
  /** Animation variant. Default `'pulse'`. */
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), { lines: 1, animation: 'pulse' });

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);
const rootStyle = computed(() =>
  props.width !== undefined
    ? { width: typeof props.width === 'number' ? `${props.width}px` : String(props.width) }
    : undefined
);

function widthForLine(i: number): string {
  /* Vuetify-style: last line ≈ 65 %, intermediate lines ≈ 85–100 %.
   * This adds rhythm so a 3-line paragraph doesn't look like a brick. */
  if (i === props.lines - 1 && props.lines > 1) return '65%';
  const palette = ['100%', '92%', '88%', '95%'];
  return palette[i % palette.length]!;
}
</script>

<template>
  <div
    :class="cn('a-skel-variants-text', props.class)"
    :style="rootStyle"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div
      v-for="i in props.lines"
      :key="i"
      :class="cn('a-skel a-skel-variant-text', animClass)"
      :style="{ width: widthForLine(i - 1), marginTop: i > 1 ? '0.5em' : undefined }"
    />
    <span class="a-skel-sr-only">Loading…</span>
  </div>
</template>
