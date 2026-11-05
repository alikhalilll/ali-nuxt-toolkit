<script setup lang="ts">
import { computed, toRef, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { useSkeletonBase, type VariantAnimation } from '../../composables/useSkeletonBase';

interface Props {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  animation?: VariantAnimation;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 4,
  showHeader: true,
  animation: 'pulse',
});

const { animClass } = useSkeletonBase(toRef(props, 'animation'));

const rowStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
}));
</script>

<template>
  <div :class="cn('a-skel-variant-table', props.class)" role="status" aria-busy="true">
    <div v-if="props.showHeader" class="a-skel-variant-table__row" :style="rowStyle">
      <div
        v-for="c in props.columns"
        :key="`h-${c}`"
        :class="cn('a-skel a-skel-variant-heading', animClass)"
        :style="{ height: '1.5rem', width: '70%' }"
      />
    </div>
    <div v-for="r in props.rows" :key="r" class="a-skel-variant-table__row" :style="rowStyle">
      <div
        v-for="c in props.columns"
        :key="`${r}-${c}`"
        :class="cn('a-skel a-skel-variant-text', animClass)"
        :style="{ width: c === 1 ? '85%' : c === props.columns ? '50%' : '70%' }"
      />
    </div>
    <span class="a-skel-sr-only">Loading table…</span>
  </div>
</template>
