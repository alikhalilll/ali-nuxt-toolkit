<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { ASkeletonLayerProps, ShapeNodeType } from '../types';

const props = withDefaults(defineProps<ASkeletonLayerProps>(), {
  animation: 'shimmer',
});

const animationClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-block--anim-${props.animation}`
);

const layerStyle = computed<CSSProperties>(() =>
  props.shape ? { width: `${props.shape.width}px`, height: `${props.shape.height}px` } : {}
);

/* Pre-joined per-type class strings — see ASkeleton.vue for the rationale. */
const blockClassByType = computed<Readonly<Record<ShapeNodeType, string>>>(() => {
  const anim = animationClass.value;
  const suffix = anim ? ` ${anim}` : '';
  return Object.freeze({
    block: `a-skel-block a-skel-block--block${suffix}`,
    text: `a-skel-block a-skel-block--text${suffix}`,
    image: `a-skel-block a-skel-block--image${suffix}`,
    circle: `a-skel-block a-skel-block--circle${suffix}`,
  });
});
</script>

<template>
  <div
    v-if="shape"
    :class="cn('a-skeleton__layer', props.class)"
    :style="layerStyle"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <template v-for="(node, idx) in shape.nodes" :key="idx">
      <template v-if="node.lineStyles">
        <div
          v-for="(lineStyle, i) in node.lineStyles"
          :key="`${idx}-${i}`"
          :class="blockClassByType.text"
          :style="lineStyle"
        />
      </template>
      <div v-else :class="blockClassByType[node.type]" :style="node.style" />
    </template>
  </div>
</template>
