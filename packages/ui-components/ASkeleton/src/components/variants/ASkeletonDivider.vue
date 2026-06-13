<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';

interface Props {
  thickness?: number;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), { thickness: 1, animation: 'pulse' });

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);
const rootStyle = computed(() => ({ height: `${props.thickness}px`, width: '100%' }));
</script>

<template>
  <div
    :class="cn('a-skel', animClass, props.class)"
    :style="rootStyle"
    role="separator"
    aria-hidden="true"
  />
</template>
