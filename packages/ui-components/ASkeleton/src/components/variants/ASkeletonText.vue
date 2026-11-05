<script setup lang="ts">
import { computed, toRef, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { useSkeletonBase, type VariantAnimation } from '../../composables/useSkeletonBase';

interface Props {
  lines?: number;
  width?: number | string;
  /** Animation variant. Default `'pulse'`. */
  animation?: VariantAnimation;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), { lines: 1, animation: 'pulse' });

const { animClass, a11yAttrs, srLabel } = useSkeletonBase(toRef(props, 'animation'));

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
  <div :class="cn('a-skel-variants-text', props.class)" :style="rootStyle" v-bind="a11yAttrs">
    <div
      v-for="i in props.lines"
      :key="i"
      :class="cn('a-skel a-skel-variant-text', animClass)"
      :style="{ width: widthForLine(i - 1), marginTop: i > 1 ? '0.5em' : undefined }"
    />
    <span class="a-skel-sr-only">{{ srLabel }}</span>
  </div>
</template>
