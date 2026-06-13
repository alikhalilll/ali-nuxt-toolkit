<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { ASkeletonLayerProps } from '../types';
import { StructuralLayerNode } from './StructuralLayerNode';

/**
 * `<ASkeletonLayer>` — replays a `StructuralShape` produced by
 * `walkStructural` / `useSkeleton()` as a tree of preserved containers +
 * a-skel leaf placeholders. The layer is a transparent shell with no
 * width / height / position constraints, so it drops into the consumer's
 * own container and lets the captured tree's flex/grid/spacing dictate
 * how the skeleton lays itself out.
 */
const props = withDefaults(defineProps<ASkeletonLayerProps>(), {
  animation: 'shimmer',
});

const animationClass = computed<string | null>(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);
</script>

<template>
  <div
    v-if="shape"
    :class="cn('a-skeleton__layer', props.class)"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <StructuralLayerNode
      v-for="(node, idx) in shape.nodes"
      :key="idx"
      :node="node"
      :anim-class="animationClass"
    />
    <span class="a-skel-sr-only">Loading…</span>
  </div>
</template>
