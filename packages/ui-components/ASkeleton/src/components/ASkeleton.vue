<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  shallowRef,
  useId,
  useSlots,
  watch,
  type PropType,
  type VNode,
} from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { ASkeletonProps, ASkeletonSlots } from '../types';
import { StructuralSkeleton } from './StructuralSkeleton';
import ASkeletonClone from './ASkeletonClone.vue';
import { captureSnapshot, type CaptureSnapshot } from '../utils/captureStyles';
import { resolvePrototypeVNodes } from '../utils/buildStructuralSkeleton';

/**
 * `<ASkeleton>` — the package's headline wrapper.
 *
 * Two rendering strategies, selected via `mode`:
 *   - `mirror`: walks the slot's vnode tree (`buildStructuralSkeleton`) and
 *     preserves every element with its real `class` / inline `style`. Pure
 *     Vue, SSR-safe, no DOM read.
 *   - `clone` (default): mounts the prototype off-screen, snapshots every
 *     leaf's `getComputedStyle()` (`captureSnapshot`), then replays the
 *     snapshot via `<ASkeletonClone>` as positioned divs carrying every
 *     captured CSS property. Pixel-identical regardless of styling system.
 *
 * Three layout-relevant details:
 *
 *   1. **Single-root wrapper.** Always exactly one DOM element — never a
 *      nested `a-skeleton` + `a-skeleton__capture` pair. When the consumer
 *      passes no `class` AND `loading=false`, the wrapper is `display:
 *      contents` so it's invisible to the surrounding layout (the slot
 *      children behave as direct children of the parent).
 *
 *   2. **The wrapper IS the capture target during loading.** The user's
 *      grid/flex class on `<ASkeleton>` lays out the prototype copies as
 *      direct children of the wrapper — no inner `__capture` div breaks
 *      the grid.
 *
 *   3. **`repeat` × prototype** during loading. When the consumer knows how
 *      many items the loaded state will have (e.g. a 6-card grid), they pass
 *      `:repeat="6"` and the skeleton fills the grid 1:1 — no layout shift
 *      when data arrives.
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
  repeat: 1,
});
defineSlots<ASkeletonSlots>();

const slots = useSlots();

const instanceId = useId();
void instanceId;

const animationClass = computed(() =>
  props.animation === 'none' ? null : `a-skel-block--anim-${props.animation}`
);

const cloneAnimation = computed(() => props.animation);

/* Has the consumer supplied a meaningful `class` prop? When neither the
 * `class` prop is set nor `loading` is true, the wrapper switches to
 * `display: contents` so it's transparent to surrounding layout. */
const hasUserClass = computed(() => {
  const c = props.class;
  if (c == null || c === false || c === '') return false;
  if (typeof c === 'string') return c.trim().length > 0;
  if (Array.isArray(c)) return c.some((entry) => !!entry);
  if (typeof c === 'object') return Object.values(c as Record<string, unknown>).some((v) => !!v);
  return false;
});

/* Root class composition.
 *
 *   - Loading: `a-skeleton`, `a-skeleton--mode-<mode>`, and the consumer's
 *     `class` are all merged. The skeleton class hooks provide position +
 *     overflow; the consumer's layout class (grid/flex) lays out children.
 *   - Not loading + class supplied: only the consumer's class. No skeleton
 *     hooks — the wrapper behaves like the layout div they would have
 *     hand-written.
 *   - Not loading + no class: a sentinel `a-skeleton--unmounted` class that
 *     CSS uses to apply `display: contents`, making the wrapper invisible
 *     to layout queries (grid/flex parents target the slot's elements). */
const rootClass = computed(() => {
  if (props.loading) {
    return cn('a-skeleton', `a-skeleton--mode-${props.mode}`, props.class);
  }
  if (hasUserClass.value) return props.class;
  return 'a-skeleton--unmounted';
});

const repeatCount = computed(() => Math.max(1, Math.floor(props.repeat ?? 1)));
const repeatIndices = computed(() => Array.from({ length: repeatCount.value }, (_, i) => i));

/* ─── Shape source ────────────────────────────────────────────────────────── */
/* The skeleton's shape is taken from the `#prototype` slot when provided;
 * otherwise it falls back to the default slot. When the default slot uses
 * `v-for`, `resolvePrototypeVNodes` keeps only the first repeated sibling so
 * the skeleton represents *one* item instead of N (or zero, when the source
 * array is empty before data arrives). Authors who want full control over the
 * shape provide a `#prototype` slot explicitly. */
const shapeVNodes = computed<VNode[]>(() => {
  if (!props.loading) return [];
  const proto = slots.prototype?.();
  const def = slots.default?.();
  return resolvePrototypeVNodes(
    def as unknown as VNode[] | undefined,
    proto as unknown as VNode[] | undefined
  ) as VNode[];
});
const hasShape = computed(() => shapeVNodes.value.length > 0);

/* Render-only host for projecting the prototype vnodes into the wrapper's
 * grid/flex flow. Renders as a normal block element (NOT `display: contents`
 * — browsers don't reliably treat the children of a `display: contents` host
 * as grid items, which broke `grid-cols-N` layouts: the prototype articles
 * stretched to fill the full row instead of one column each). The host div
 * itself is the grid/flex item, sized to fit its single child. */
const ShapeHost = defineComponent({
  name: 'ASkeletonShapeHost',
  props: { vnodes: { type: Array as PropType<VNode[]>, required: true } },
  setup(p) {
    return () =>
      h(
        'div',
        { class: 'a-skeleton__shape-host', 'aria-hidden': 'true' },
        p.vnodes as unknown as VNode[]
      );
  },
});

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
    if (el && props.loading) takeSnapshot();
  },
  /* `flush: 'post'` so the watcher fires *after* Vue has committed the DOM
   * update — the captureRef is set, but the surrounding layout state is also
   * settled, which double-rAF then waits for completion of. */
  { flush: 'post' }
);

/* Re-capture when loading flips false → true (the wrapper element is the same
 * but a fresh capture is needed for the current shape). */
watch(
  () => props.loading,
  (next, prev) => {
    if (props.mode !== 'clone') return;
    if (next && !prev && captureRef.value) takeSnapshot();
  },
  { flush: 'post' }
);

/* Re-capture when the shape vnodes count changes (e.g. v-for over a list that
 * started empty, then data arrived while `loading` is still true). Without
 * this the first empty snapshot would be the only snapshot for the entire
 * loading window. */
watch(
  () => shapeVNodes.value.length,
  () => {
    if (props.mode !== 'clone') return;
    if (props.loading && captureRef.value) takeSnapshot();
  },
  { flush: 'post' }
);

/* Re-capture when `repeat` changes during loading — the wrapper now contains
 * a different number of prototype copies, so the snapshot's grid coverage
 * needs to refresh. */
watch(
  () => repeatCount.value,
  () => {
    if (props.mode !== 'clone') return;
    if (props.loading && captureRef.value) takeSnapshot();
  },
  { flush: 'post' }
);

onBeforeUnmount(() => {
  if (captureFrame !== undefined) cancelAnimationFrame(captureFrame);
});
</script>

<template>
  <div
    ref="captureRef"
    :class="rootClass"
    :data-loading="props.loading ? '' : undefined"
    :role="props.loading ? 'status' : undefined"
    :aria-busy="props.loading ? 'true' : undefined"
    :aria-live="props.loading ? 'polite' : undefined"
  >
    <template v-if="!props.loading">
      <slot />
    </template>
    <template v-else>
      <template v-if="props.mode === 'clone'">
        <!-- Prototype copies — direct grid items, used by the snapshot
             walker to read accurate per-leaf rects at real layout positions.
             The mirror-fallback and replay overlays (below) paint on top
             with higher stacking order, so the user sees the skeleton, not
             the raw prototype content underneath.

             `data-skeleton-ignore` on the OVERLAYS (not here) prevents the
             walker from descending into its own paint output — without that
             guard, every snapshot iteration multiplies the captured node
             count by the previous output, growing the replay to hundreds of
             stray rectangles that paint outside the real card boundaries. -->
        <ShapeHost v-for="i in repeatIndices" :key="`shape-${i}`" :vnodes="shapeVNodes" />

        <!-- Mirror fallback — backdrop while loading whenever there's a
             usable shape. The replay layer (higher z-index) sits on top. If
             the snapshot is empty / zero-sized / otherwise unrenderable, the
             mirror underneath still gives the consumer a structural skeleton
             instead of a blank wrapper. -->
        <div
          v-if="hasShape"
          :class="['a-skeleton__mirror', 'a-skeleton__mirror--fallback', props.class]"
          data-skeleton-ignore
        >
          <StructuralSkeleton
            v-for="i in repeatIndices"
            :key="`mirror-${i}`"
            :vnodes="shapeVNodes"
            :animation="animationClass"
            :max-depth="maxDepth"
            :max-nodes="maxNodes"
          />
        </div>

        <!-- Replay layer — gated on `snapshotRenderable` (width AND height
             > 0 AND snapshot.nodes.length > 0) so an empty capture doesn't
             render a transparent overlay that masks the mirror underneath. -->
        <div v-if="snapshotRenderable" class="a-skeleton__replay" data-skeleton-ignore>
          <ASkeletonClone :shape="snapshot!" :animation="cloneAnimation" />
        </div>
      </template>

      <template v-else>
        <!-- Mirror mode — the wrapper itself renders the structural skeleton
             × repeat. Children flow as direct grid/flex items of the wrapper
             via the user's class. -->
        <template v-if="hasShape">
          <StructuralSkeleton
            v-for="i in repeatIndices"
            :key="`mirror-${i}`"
            :vnodes="shapeVNodes"
            :animation="animationClass"
            :max-depth="maxDepth"
            :max-nodes="maxNodes"
          />
        </template>
        <div v-else class="a-skeleton__fallback">
          <slot name="fallback">
            <div
              class="a-skel-block a-skel-block--block a-skel-fallback-default"
              :class="animationClass"
            />
          </slot>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* Position context only — never touch `display`. The consumer's class
 * (`grid grid-cols-3`, `flex flex-wrap`, …) needs to win, and the scoped
 * `.a-skeleton[data-v-…]` selector has HIGHER specificity than Tailwind's
 * `.grid` / `.flex` utilities (0,2,0 vs 0,1,0). Setting `display: block`
 * here would silently override the consumer's grid/flex, stacking children
 * vertically at full width — exactly the bug the previous version had.
 *
 * A `<div>` defaults to `display: block` anyway, so omitting the rule
 * preserves the default while letting Tailwind utilities take over. */
.a-skeleton {
  position: relative;
}

.a-skeleton[data-loading] {
  overflow: hidden;
  overflow: clip;
  overflow-clip-margin: 0;
}

/* Not-loading + no consumer class → invisible to layout. The slot children
 * behave as direct children of the parent, so flex/grid parents that target
 * direct children continue to work as if `<ASkeleton>` weren't there. */
.a-skeleton--unmounted {
  display: contents;
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

/* The prototype copies need to occupy the consumer's grid/flex layout so
 * the snapshot walker can read accurate per-leaf rects. They MUST be
 * visible to the walker — `display: none`, `visibility: hidden`, and
 * `opacity: 0` all cause the walker to skip the element entirely. Instead,
 * we rely on stacking order: the mirror-fallback and replay overlays are
 * absolutely-positioned siblings rendered after the ShapeHosts in DOM
 * order, so they paint on top and cover the raw prototype content.
 *
 * `min-width: 0` lets the wrapping div behave like a normal grid item
 * (sized by its track) and lets the article inside fill it. */
.a-skeleton__shape-host {
  min-width: 0;
}

.a-skeleton__replay {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.a-skeleton__mirror--fallback {
  position: absolute;
  inset: 0;
  /* Sits BEHIND the clone replay (z-index: 0) so when the replay mounts on
   * top it covers the mirror. If the replay turns out to be empty / sized
   * wrong, the mirror underneath still gives a structural skeleton instead
   * of a blank wrapper. */
  z-index: 0;
}
</style>
