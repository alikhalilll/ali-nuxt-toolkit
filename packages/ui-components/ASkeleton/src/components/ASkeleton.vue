<script setup lang="ts">
import { computed, ref, shallowRef, useId, useSlots, watch, type CSSProperties } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { ASkeletonProps, ASkeletonSlots, CachedShape, ShapeNodeType } from '../types';
import { useShapeProbe } from '../composables/useShapeProbe';
import { getCached, setCached } from '../composables/useSkeletonCache';
import { fingerprintSlot } from '../utils/fingerprint';
import { StructuralSkeleton } from './StructuralSkeleton';

const props = withDefaults(defineProps<ASkeletonProps>(), {
  maxDepth: 6,
  maxNodes: 500,
  minNodeSize: 4,
  persist: false,
  animation: 'shimmer',
  fallback: 'shimmer',
});
defineSlots<ASkeletonSlots>();

const slots = useSlots();

/* Per-instance suffix from Vue's useId() — deterministic across SSR/hydration
 * and stable across re-renders, but distinct per <ASkeleton> instance. Two
 * <ASkeleton><UserCard/></ASkeleton> on the same page therefore never collide
 * on the auto-generated key. Pass an explicit `cacheKey` to share a shape
 * across instances on purpose. */
const instanceId = useId();

const resolvedKey = computed(
  () => props.cacheKey ?? `${fingerprintSlot(slots.default?.())}:${instanceId}`
);

const warnedKeys = new Set<string>();

const cached = shallowRef<CachedShape | undefined>(getCached(resolvedKey.value, props.persist));

watch(resolvedKey, (key) => {
  cached.value = getCached(key, props.persist);
});

const wrapperRef = ref<HTMLElement | null>(null);

/* Probe runs whenever the real content is mounted (loading=false). The getter
 * returns null during loading so the watch tears down its ResizeObserver. */
useShapeProbe(() => (props.loading ? null : wrapperRef.value), {
  maxDepth: props.maxDepth,
  maxNodes: props.maxNodes,
  minSize: props.minNodeSize,
  onCapture: (shape) => {
    setCached(resolvedKey.value, shape, props.persist);
    cached.value = shape;
    if (shape.truncated && !warnedKeys.has(resolvedKey.value)) {
      warnedKeys.add(resolvedKey.value);
      console.warn(
        `[ASkeleton] Capture truncated at maxNodes=${props.maxNodes} for cacheKey="${resolvedKey.value}". ` +
          `The replayed skeleton will be missing nodes. Raise \`max-nodes\` or mark dense subtrees with ` +
          `\`data-skeleton-stop\` to collapse them into a single block.`
      );
    }
  },
});

const animationClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-block--anim-${props.animation}`
);

const layerStyle = computed<CSSProperties>(() =>
  cached.value ? { width: `${cached.value.width}px`, height: `${cached.value.height}px` } : {}
);

/* Pre-join the per-type class strings once per animation value so the render
 * loop doesn't allocate a new `[a, b, c]` array per node per frame — meaningful
 * when a cache holds hundreds of nodes. */
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

/* Cache-miss fallback path: walk the slot's vnodes synchronously so the FIRST
 * paint already shows a skeleton that mirrors the component's HTML structure
 * (same tags, classes, hierarchy → same flex/grid/spacing/sizing utilities
 * still apply). If the slot is empty / only renders comments (e.g. the user
 * gates the whole template on `v-if="data"`), we get an empty array back and
 * fall through to the generic shimmer block. */
const structuralVNodes = computed(() => (props.loading ? (slots.default?.() ?? []) : []));
const hasStructure = computed(() => structuralVNodes.value.length > 0);
</script>

<template>
  <div
    ref="wrapperRef"
    :class="cn('a-skeleton', props.class)"
    :data-loading="props.loading ? '' : undefined"
  >
    <template v-if="props.loading">
      <!-- Cache hit: pixel-aligned positioned blocks from a previous measurement.
           Styles are pre-computed during capture so the loop below never calls
           a function or allocates a style object per node. -->
      <div
        v-if="cached"
        class="a-skeleton__layer"
        :style="layerStyle"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <template v-for="(node, idx) in cached.nodes" :key="idx">
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

      <!-- Cache miss + slot has structure: render a structural skeleton derived
           from the slot's vnode tree. First paint already looks right. -->
      <div
        v-else-if="hasStructure"
        class="a-skeleton__structural"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <StructuralSkeleton
          :vnodes="structuralVNodes"
          :animation="animationClass"
          :max-depth="maxDepth"
          :max-nodes="maxNodes"
        />
      </div>

      <!-- Cache miss + nothing to walk: generic shimmer. -->
      <div v-else class="a-skeleton__fallback" role="status" aria-busy="true">
        <slot name="fallback">
          <div
            class="a-skel-block a-skel-block--block a-skel-fallback-default"
            :class="animationClass"
          />
        </slot>
      </div>
    </template>

    <slot v-else />
  </div>
</template>

<style scoped>
.a-skeleton {
  display: block;
  position: relative;
}

/* `.a-skeleton__layer` + `.a-skeleton__layer > .a-skel-block` layout/containment
 * live in `styles.src.css` so they're shared with the public `<ASkeletonLayer>`
 * component. */

.a-skeleton__structural :deep(*) {
  /* Disable text caret/selection on the structural copy so it doesn't look
   * interactive. Layout (flex/grid/spacing/sizing) flows through unchanged. */
  user-select: none;
  pointer-events: none;
}

.a-skeleton__structural :deep(button),
.a-skeleton__structural :deep(input),
.a-skeleton__structural :deep(a) {
  cursor: default;
}

.a-skeleton__fallback :deep(.a-skel-fallback-default) {
  width: 100%;
  height: 4rem;
  border-radius: 0.5rem;
}
</style>
