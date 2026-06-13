<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, useId, useSlots, watch } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { ASkeletonProps, ASkeletonSlots } from '../types';
import { StructuralSkeleton } from './StructuralSkeleton';
import ASkeletonClone from './ASkeletonClone.vue';
import { captureSnapshot, type CaptureSnapshot } from '../utils/captureStyles';

/**
 * `<ASkeleton>` — the package's headline wrapper.
 *
 * Two rendering strategies, selected via `mode`:
 *   - `mirror` (default): walks the slot's vnode tree (`buildStructuralSkeleton`)
 *     and preserves every element with its real `class` / inline `style`. Pure
 *     Vue, SSR-safe, no DOM read.
 *   - `clone`: mounts the slot off-screen once, snapshots every leaf's
 *     `getComputedStyle()` (`captureSnapshot`), then replays the snapshot via
 *     `<ASkeletonClone>` as positioned divs carrying every captured CSS
 *     property. Pixel-identical regardless of styling system.
 *
 * The strategies are exclusive — picking one decides the entire loading-state
 * render path. The wrapper itself only orchestrates: it doesn't decide
 * per-element treatment (that's the strategies' job). Single Responsibility:
 * orchestration + a11y + containment.
 */

const props = withDefaults(defineProps<ASkeletonProps>(), {
  maxDepth: 16,
  maxNodes: 600,
  minNodeSize: 4,
  persist: false,
  animation: 'shimmer',
  fallback: 'shimmer',
  /* Default is `clone` — comprehensive computed-style snapshot + replay,
   * works correctly regardless of how styles reach the DOM (Tailwind, inline
   * style, CSS-in-JS hashes, scoped styles). Switch to `mirror` for SSR-safe,
   * vnode-tree-based skeletons that don't need a client-side measurement pass. */
  mode: 'clone',
});
defineSlots<ASkeletonSlots>();

const slots = useSlots();

const instanceId = useId();
void instanceId;

const animationClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-block--anim-${props.animation}`
);

const cloneAnimation = computed(() => props.animation);

/* ─── `mirror` strategy state ─────────────────────────────────────────────── */
const mirrorVNodes = computed(() => (props.loading ? (slots.default?.() ?? []) : []));
const hasContent = computed(() => mirrorVNodes.value.length > 0);

/* ─── `clone` strategy state ──────────────────────────────────────────────── */
const captureRef = ref<HTMLElement | null>(null);
const snapshot = shallowRef<CaptureSnapshot | undefined>(undefined);
const snapshotValid = computed(
  () => !!snapshot.value && snapshot.value.width > 0 && snapshot.value.height > 0
);
/* `snapshotRenderable` — only true when the snapshot has dimensions AND at
 * least one captured node. An empty `nodes` array would render a transparent
 * overlay that masks the mirror backdrop, so we hold the replay layer back
 * until there's actually something to draw. */
const snapshotRenderable = computed(
  () => snapshotValid.value && (snapshot.value as CaptureSnapshot).nodes.length > 0
);
let captureFrame: number | undefined;
let retryAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;

/* Take a snapshot once the off-screen mount is in the DOM. We schedule via a
 * **double** `requestAnimationFrame` so the browser has time to (1) commit the
 * mount and (2) run layout — without this, the first frame fires before the
 * slot's geometry is measurable when `loading=true` is the initial state, the
 * snapshot comes back with 0×0 dimensions, `<ASkeletonClone>` collapses to
 * nothing, and the user sees a blank skeleton.
 *
 * If the second-frame snapshot still has zero dimensions (the slot is genuinely
 * empty or the layout hasn't settled yet), we retry up to MAX_RETRY_ATTEMPTS
 * times with an exponential-ish backoff via repeated rAF. Past that we give up
 * and the `mirror--fallback` branch keeps showing — see the v-if/v-else-if
 * chain in the template. */
function takeSnapshot() {
  if (captureFrame !== undefined) cancelAnimationFrame(captureFrame);
  retryAttempts = 0;
  scheduleCapture();
}

function scheduleCapture(): void {
  captureFrame = requestAnimationFrame(() => {
    captureFrame = requestAnimationFrame(() => {
      captureFrame = undefined;
      if (!captureRef.value) return;
      const result = captureSnapshot(captureRef.value, {
        maxDepth: props.maxDepth,
        maxNodes: props.maxNodes,
        minSize: props.minNodeSize,
      });
      if (result.width > 0 && result.height > 0) {
        snapshot.value = result;
        return;
      }
      /* Zero-size capture — slot likely hasn't laid out yet. Retry on a later
       * frame, capped so we don't loop forever on a genuinely-empty slot. */
      if (retryAttempts < MAX_RETRY_ATTEMPTS) {
        retryAttempts++;
        scheduleCapture();
      }
    });
  });
}

watch(
  captureRef,
  (el) => {
    if (props.mode !== 'clone') return;
    if (el) takeSnapshot();
  },
  /* `flush: 'post'` so the watcher fires *after* Vue has committed the DOM
   * update — the captureRef is set, but the surrounding layout state is also
   * settled, which double-rAF then waits for completion of. */
  { flush: 'post' }
);

/* Re-capture when the mode flips into clone OR when the slot's vnodes change
 * shape (the watcher above runs on mount; this one covers in-place updates). */
watch(
  () => props.mode,
  (mode) => {
    if (mode === 'clone' && captureRef.value) takeSnapshot();
  }
);

/* Re-capture when the slot's content shape changes (e.g. data arrives and
 * `loading` flips false → true again with new vnodes). Without this the first
 * snapshot is the only snapshot, and a second load shows the cached stale
 * geometry from the very first mount. */
watch(
  () => props.loading,
  (next, prev) => {
    if (props.mode !== 'clone') return;
    if (next && !prev && captureRef.value) takeSnapshot();
  }
);

onBeforeUnmount(() => {
  if (captureFrame !== undefined) cancelAnimationFrame(captureFrame);
});
</script>

<template>
  <div
    :class="cn('a-skeleton', `a-skeleton--mode-${props.mode}`, props.class)"
    :data-loading="props.loading ? '' : undefined"
    role="status"
    :aria-busy="props.loading ? 'true' : undefined"
    :aria-live="props.loading ? 'polite' : undefined"
  >
    <template v-if="props.mode === 'clone'">
      <!-- Off-screen capture mount: the slot is always rendered (so we have a
           live target to snapshot from) but visually suppressed while the
           skeleton is showing. `aria-hidden` keeps it out of AT trees too. -->
      <div
        ref="captureRef"
        class="a-skeleton__capture"
        :class="props.loading ? 'a-skeleton__capture--hidden' : null"
        :aria-hidden="props.loading ? 'true' : undefined"
      >
        <slot />
      </div>

      <!-- Mirror fallback — **always rendered as a backdrop** while loading,
           regardless of snapshot state. The replay layer below sits on top of
           it (higher z-index). If the snapshot turns out to be empty / zero-
           sized / otherwise unrenderable, the mirror underneath still gives the
           user a structural skeleton instead of a blank wrapper. -->
      <div
        v-if="props.loading && hasContent"
        class="a-skeleton__mirror a-skeleton__mirror--fallback"
      >
        <StructuralSkeleton
          :vnodes="mirrorVNodes"
          :animation="animationClass"
          :max-depth="maxDepth"
          :max-nodes="maxNodes"
        />
      </div>

      <!-- Replay layer — wrapped in a positioning div whose scoped styles
           are GUARANTEED to apply (a child-component root only inherits the
           parent's scope when no inner div is present; placing the absolute-
           positioning on a regular div in the parent template removes that
           ambiguity). Gated on `snapshotValid` (width AND height > 0) AND
           snapshot.nodes.length > 0 so an empty capture doesn't render a
           transparent overlay that masks the mirror underneath. -->
      <div v-if="props.loading && snapshotRenderable" class="a-skeleton__replay">
        <ASkeletonClone :shape="snapshot!" :animation="cloneAnimation" />
      </div>
    </template>

    <template v-else>
      <template v-if="props.loading">
        <div v-if="hasContent" class="a-skeleton__mirror">
          <StructuralSkeleton
            :vnodes="mirrorVNodes"
            :animation="animationClass"
            :max-depth="maxDepth"
            :max-nodes="maxNodes"
          />
        </div>
        <div v-else class="a-skeleton__fallback">
          <slot name="fallback">
            <div
              class="a-skel-block a-skel-block--block a-skel-fallback-default"
              :class="animationClass"
            />
          </slot>
        </div>
      </template>
      <slot v-else />
    </template>
  </div>
</template>

<style scoped>
.a-skeleton {
  display: block;
  position: relative;
}

.a-skeleton[data-loading] {
  overflow: hidden;
  overflow: clip;
  overflow-clip-margin: 0;
}

.a-skeleton__mirror :deep(*) {
  user-select: none;
  pointer-events: none;
}

.a-skeleton__mirror :deep(button),
.a-skeleton__mirror :deep(input),
.a-skeleton__mirror :deep(a) {
  cursor: default;
}

.a-skeleton__fallback :deep(.a-skel-fallback-default) {
  width: 100%;
  height: 4rem;
  border-radius: 0.5rem;
}

/* Clone-mode capture mount: needs to be in the DOM so we can read computed
 * styles from it, but invisible while the snapshot replay is showing. We use
 * `visibility: hidden` (not `display: none`) so layout is preserved — the
 * snapshot needs real geometry. `pointer-events: none` keeps it inert. */
.a-skeleton__capture--hidden {
  visibility: hidden;
  pointer-events: none;
  user-select: none;
  /* The capture mount sits behind the replay (z-index 0 vs 1) so the replay
   * paints over it. We keep it in normal flow so its `getBoundingClientRect`
   * still reports the real layout (off-flow positioning would zero it). */
}

.a-skeleton__replay {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.a-skeleton__mirror--fallback {
  position: absolute;
  inset: 0;
  /* Sits BEHIND the clone replay (z-index: 0) so when the replay mounts on top
   * it covers the mirror. If the replay turns out to be empty / sized wrong,
   * the mirror underneath still gives the user a structural skeleton instead
   * of a blank wrapper. */
  z-index: 0;
}
</style>
