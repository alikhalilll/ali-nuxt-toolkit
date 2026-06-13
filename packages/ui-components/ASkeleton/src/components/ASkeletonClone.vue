<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { CaptureSnapshot, CapturedNode, TextLineRect } from '../utils/captureStyles';
import { CloneNode } from './CloneNode';

/**
 * `<ASkeletonClone>` — replays a `CaptureSnapshot` produced by
 * `captureSnapshot()` as a tree of positioned divs each carrying its
 * captured inline style. Pure render component; the recursive per-node
 * rendering lives in `CloneNode` to keep the strategy table isolated from
 * the layer-level concerns (sizing, animation, a11y).
 */
interface Props {
  shape: CaptureSnapshot;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: string | string[] | Record<string, boolean>;
}

const props = withDefaults(defineProps<Props>(), { animation: 'pulse' });

const animClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-anim-${props.animation}`
);

const layerStyle = computed<CSSProperties>(() => ({
  position: 'relative',
  width: `${props.shape.width}px`,
  height: `${props.shape.height}px`,
}));

/* Pure style builders passed down to `CloneNode`. Kept here so the snapshot's
 * coordinate system (root-relative) stays the layer's concern; the renderer
 * just consumes ready-to-apply style objects. */
function blockStyle(n: CapturedNode): Record<string, unknown> {
  return {
    position: 'absolute',
    left: `${n.x}px`,
    top: `${n.y}px`,
    width: `${n.w}px`,
    height: `${n.h}px`,
    ...n.style,
  };
}

function lineStyle(
  line: TextLineRect,
  parentStyle: Readonly<Record<string, string>>
): Record<string, unknown> {
  const radius =
    (parentStyle as Record<string, string>).borderTopLeftRadius ?? 'var(--ak-skel-radius-sm)';
  return {
    position: 'absolute',
    left: `${line.x}px`,
    top: `${line.y}px`,
    width: `${line.w}px`,
    height: `${line.h}px`,
    backgroundColor: 'var(--ak-skel-base)',
    borderRadius: radius,
  };
}
</script>

<template>
  <div
    :class="cn('a-skeleton__clone', props.class)"
    :style="layerStyle"
    role="status"
    aria-busy="true"
    aria-live="polite"
  >
    <CloneNode
      v-for="(node, idx) in props.shape.nodes"
      :key="idx"
      :node="node"
      :anim-class="animClass"
      :block-style="blockStyle"
      :line-style="lineStyle"
    />
    <span class="a-skel-sr-only">Loading…</span>
  </div>
</template>

<style scoped>
.a-skeleton__clone {
  overflow: hidden;
  isolation: isolate;
}

.a-skeleton__clone :deep(.a-skel-clone-leaf) {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ak-skel-icon);
}

.a-skeleton__clone :deep(.a-skel-clone-icon) {
  width: clamp(20px, 30%, 56px);
  height: clamp(20px, 30%, 56px);
  opacity: 0.6;
}

.a-skeleton__clone :deep(.a-skel-clone-textbar) {
  pointer-events: none;
}
</style>
