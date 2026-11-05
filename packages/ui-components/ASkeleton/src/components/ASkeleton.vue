<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  shallowRef,
  toRef,
  useId,
  useSlots,
  watch,
  type PropType,
  type VNode,
} from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import type { ASkeletonEmits, ASkeletonProps, ASkeletonSlots } from '../types';
import { StructuralSkeleton } from './StructuralSkeleton';
import ASkeletonClone from './ASkeletonClone.vue';
import { captureSnapshot, type CaptureSnapshot } from '../utils/captureStyles';
import { resolvePrototypeVNodes } from '../utils/buildStructuralSkeleton';
import { ATTR_DEBUG, ATTR_PANE, ATTR_REVEAL, ATTR_STATUS } from '../utils/attrs';
import { debugging } from '../utils/debug';
import { useSkeletonState } from '../composables/useSkeletonState';
import { useSkeletonSource } from '../composables/useSkeletonSource';
import { useSkeletonLifecycle } from '../composables/useSkeletonLifecycle';
import ASkeletonGhost from './ASkeletonGhost.vue';
import ASkeletonBones from './ASkeletonBones.vue';

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
  /* Default is `measure` — ghost/layer-style ghost + bones in a shadow-DOM
   * layer. Font-metric text bars, clip-aware rounded corners, reactive
   * re-measurement via `MutationObserver` + `ResizeObserver`.
   *
   * Alternatives:
   *   - `clone`  — mounts the slot off-screen, snapshots `getComputedStyle()`
   *                for every leaf, replays as positioned divs. Pixel-identical
   *                surface regardless of styling pipeline. Client-side only.
   *   - `mirror` — walks the slot's vnode tree, preserves tags + classes.
   *                SSR-safe (no DOM read). Picks up the fallback when the
   *                slot has no shape or `#prototype` is empty. */
  mode: 'measure',
  repeat: 1,
  reveal: 'smart',
});
defineSlots<ASkeletonSlots>();
const emit = defineEmits<ASkeletonEmits>();

const slots = useSlots();

/* ─── State machine + source waterfall (extracted composables) ────────────────
 *
 * SOLID: the state resolution, the shape-precedence waterfall, and the
 * reveal-lifecycle side effects each live in a dedicated composable so this
 * SFC is composition + template only. Adding a new state branch or a new
 * fallback source doesn't require touching ASkeleton.vue.
 *
 * `state` → `useSkeletonState({ loading, error, empty, data })`
 * `shapeData` → `useSkeletonSource({ data, sample, id })`
 * reveal/@reveal/dev-warnings/debug → `useSkeletonLifecycle({ ... })` below
 */
const { state, isLoading, driven } = useSkeletonState({
  loading: toRef(props, 'loading'),
  error: toRef(props, 'error'),
  empty: toRef(props, 'empty'),
  data: toRef(props, 'data'),
});

const { shapeData, source: shapeSourceLabel } = useSkeletonSource({
  data: toRef(props, 'data'),
  sample: toRef(props, 'sample'),
  id: toRef(props, 'cacheKey'),
});

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
const repeatCount = computed(() => Math.max(1, Math.floor(props.repeat ?? 1)));
const repeatIndices = computed(() => Array.from({ length: repeatCount.value }, (_, i) => i));

/* ─── Effective rendering mode ────────────────────────────────────────────── */
/* Clone mode mounts the prototype as REAL DOM so `captureSnapshot()` can read
 * `getComputedStyle()` from every leaf. With `repeat > 1` it would need to
 * mount N copies of the same prototype — but Vue's SFC compiler hoists
 * static slot templates as MODULE-LEVEL constants. Every call to a hoisted
 * slot returns the SAME VNode references, regardless of how often we call
 * the slot function. During SSR-to-CSR hydration, Vue's renderer mutates
 * `vnode.el` per copy as it walks the DOM tree; with shared references,
 * copy #2's hydration finds copy #1's `.el` already wired to a different
 * neighbourhood and `element.nextSibling` returns null — crashing the
 * hydration walker with `Cannot read properties of null (reading
 * 'nextSibling')`.
 *
 * Mirror mode is immune: its render path walks the input vnodes and emits
 * FRESH output vnodes via `h(...)` per copy, so no references are shared
 * across the rendered grid cells.
 *
 * Fix: when `repeat > 1`, transparently downshift to mirror mode for the
 * visible cells. Visually it's the same shape (the prototype's tags +
 * classes preserved as shimmer placeholders), and the consumer's grid
 * layout fills correctly without the hydration crash. Single-copy clone
 * mode (`repeat === 1`, the default) keeps the pixel-identical replay. */
const effectiveMode = computed<'clone' | 'mirror' | 'measure'>(() => {
  if (props.mode === 'clone' && repeatCount.value > 1) return 'mirror';
  return props.mode;
});

const rootClass = computed(() => {
  if (isLoading.value) {
    return cn('a-skeleton', `a-skeleton--mode-${effectiveMode.value}`, props.class);
  }
  if (hasUserClass.value) return props.class;
  return 'a-skeleton--unmounted';
});

/* ─── Shape source ────────────────────────────────────────────────────────── */
/* The skeleton's shape is taken from the `#prototype` slot when provided;
 * otherwise it falls back to the default slot. When the default slot uses
 * `v-for`, `resolvePrototypeVNodes` keeps only the first repeated sibling so
 * the skeleton represents *one* item instead of N (or zero, when the source
 * array is empty before data arrives). Authors who want full control over the
 * shape provide a `#prototype` slot explicitly.
 *
 * IMPORTANT: this is a **function**, not a `computed`, and the v-for templates
 * below call it once per iteration. Each call invokes the underlying slot
 * function fresh, producing brand-new VNode instances per copy. Sharing the
 * same VNode objects across N rendered copies caused an SSR hydration crash
 * — Vue's renderer mutates `vnode.el` per copy as it walks the DOM; with
 * shared references, copy #2's hydration finds copy #1's `.el` already wired
 * elsewhere and `nextSibling` returns null. */
function resolveShapeVNodes(): VNode[] {
  if (!isLoading.value) return [];
  const proto = slots.prototype?.();
  /* Data-driven consumers write `#default="{ data }"` and destructure. When
   * the walker invokes the slot for the shape (not the content), we pass
   * the stand-in value — the real data if present, else the last-seen
   * data under the same `cacheKey`, else `sample`. Without this, the
   * destructure crashes with `Cannot destructure 'data' of undefined`. */
  const scope = driven.value ? { data: shapeData.value } : undefined;
  const def = slots.default?.(scope as never);
  return resolvePrototypeVNodes(
    def as unknown as VNode[] | undefined,
    proto as unknown as VNode[] | undefined
  ) as VNode[];
}

/* Reactive existence check for `v-if="hasShape"`. Calling `resolveShapeVNodes`
 * inside a computed re-runs whenever the slots' reactive dependencies change
 * (i.e. when the consumer's loading flag flips or when v-for source data
 * mutates), keeping this in sync without retaining the VNode array. */
const hasShape = computed(() => resolveShapeVNodes().length > 0);

/* Render-only host for projecting the prototype vnodes into the wrapper's
 * grid/flex flow. Renders as a normal block element (NOT `display: contents`
 * — browsers don't reliably treat the children of a `display: contents` host
 * as grid items, which broke `grid-cols-N` layouts: the prototype articles
 * stretched to fill the full row instead of one column each). The host div
 * itself is the grid/flex item, sized to fit its single child.
 *
 * Accepts a `render` function (not a pre-resolved array) so each host copy
 * invokes the slot fresh and gets its own VNode instances — required for
 * hydration safety, see `resolveShapeVNodes` above. */
const ShapeHost = defineComponent({
  name: 'ASkeletonShapeHost',
  props: { render: { type: Function as PropType<() => VNode[]>, required: true } },
  setup(p) {
    return () => h('div', { class: 'a-skeleton__shape-host', 'aria-hidden': 'true' }, p.render());
  },
});

/* `measure` mode: ghost/layer-style ghost + bones. The ghost mounts the shape
 * (slot content with the `shapeData` stand-in in data-driven mode); the
 * bones layer renders beside it and finds the ghost via a DOM-sibling
 * lookup, so no ref-synchronisation ceremony is needed in this component. */

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
    if (effectiveMode.value !== 'clone') return;
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
  () => isLoading.value,
  (next, prev) => {
    if (effectiveMode.value !== 'clone') return;
    if (next && !prev && captureRef.value) takeSnapshot();
  },
  { flush: 'post' }
);

/* ─── Pane refs ─────────────────────────────────────────────────────────────
 * Four refs — one per pane. `useSkeletonLifecycle` picks the right one on
 * state transitions. Each is nulled out when the pane isn't rendered,
 * reflecting Vue's `v-if` lifecycle. */
const contentRef = ref<HTMLElement | null>(null);
const errorRef = ref<HTMLElement | null>(null);
const emptyRef = ref<HTMLElement | null>(null);
const skeletonRef = ref<HTMLElement | null>(null);

/* The pane source — what the skeleton drew from. Shown in the debug
 * overlay's loading tag; chosen from the shape-waterfall. The slot-presence
 * branches ensure "prototype" / "default" show up even when there's no
 * data/sample, which is the common hand-rolled skeleton case. */
function pickShapeSource() {
  const resolved = shapeSourceLabel.value;
  if (resolved === 'data') return 'data';
  if (resolved === 'last') return 'cache';
  if (resolved === 'sample') return 'sample';
  if (slots.prototype) return 'prototype';
  if (slots.default) return 'default';
  return 'fallback';
}

useSkeletonLifecycle({
  state,
  reveal: toRef(props, 'reveal'),
  mode: toRef(props, 'mode') as unknown as import('vue').Ref<string>,
  cacheKey: toRef(props, 'cacheKey'),
  data: toRef(props, 'data'),
  sample: toRef(props, 'sample'),
  driven,
  revealEl: computed(() => captureRef.value) as unknown as import('vue').Ref<HTMLElement | null>,
  skeletonRef,
  contentRef,
  errorRef,
  emptyRef,
  sourceOf: pickShapeSource,
  emit,
});

/* `debugging` import is kept to make the ancestor-walk check accessible to
 * consumers that forward-pass refs; the overlay itself is wired by
 * `useSkeletonLifecycle`. */
void debugging;

/* Re-capture when the shape vnodes count changes (e.g. v-for over a list that
 * started empty, then data arrived while `loading` is still true). Without
 * this the first empty snapshot would be the only snapshot for the entire
 * loading window. */
watch(
  () => resolveShapeVNodes().length,
  () => {
    if (effectiveMode.value !== 'clone') return;
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
    if (effectiveMode.value !== 'clone') return;
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
    :data-loading="isLoading ? '' : undefined"
    :role="isLoading ? 'status' : undefined"
    :aria-busy="isLoading ? 'true' : undefined"
    :aria-live="isLoading ? 'polite' : undefined"
    :[ATTR_REVEAL]="''"
    :[ATTR_DEBUG]="props.debug ? '' : undefined"
  >
    <!-- Screen-reader label — rendered as a visually-hidden status span
         while the skeleton pane is up. AT users hear the `label` prop
         (e.g. "Loading profile") instead of nothing. -->
    <span v-if="isLoading && props.label" :[ATTR_STATUS]="''" class="a-skel-sr-only">{{
      props.label
    }}</span>

    <template v-if="slots.skeleton && isLoading">
      <!-- Author-supplied custom skeleton — rendered verbatim with
           data-a-skel-own so measure mode / clone mode don't descend. -->
      <div ref="skeletonRef" :[ATTR_PANE]="'skeleton'" data-skeleton-own>
        <slot name="skeleton" />
      </div>
    </template>
    <template v-else-if="state === 'error'">
      <div ref="errorRef" :[ATTR_PANE]="'error'" role="alert">
        <slot name="error" :error="props.error" />
      </div>
    </template>
    <template v-else-if="state === 'empty'">
      <div ref="emptyRef" :[ATTR_PANE]="'empty'">
        <slot name="empty">
          <!-- No `#empty` provided — fall back to the default slot with
               `undefined` data so static markup still renders. -->
          <slot :data="undefined" />
        </slot>
      </div>
    </template>
    <template v-else-if="state === 'content'">
      <!-- `data-driven` → scope `{ data }` into the default slot so
           consumers can destructure. Control mode → no scope (back-compat). -->
      <template v-if="driven">
        <!-- The content pane uses a transparent wrapper (CSS below) so
             the slot's children stay direct flex/grid items of the
             outer wrapper. The ref is still queryable for the reveal
             animation. -->
        <div ref="contentRef" :[ATTR_PANE]="'content'" class="a-skel-pane">
          <slot :data="props.data as never" />
        </div>
      </template>
      <template v-else>
        <div ref="contentRef" :[ATTR_PANE]="'content'" class="a-skel-pane">
          <slot />
        </div>
      </template>
    </template>
    <!-- state === 'skeleton' (default: clone / mirror / measure rendering) -->
    <div v-else ref="skeletonRef" :[ATTR_PANE]="'skeleton'" class="a-skel-pane">
      <!-- Measure mode (R12): the Ghost class owns the loading-pane DOM
           entirely. <ASkeletonBones> is now a thin shell that mounts a
           Ghost on the slot root; the Ghost injects
           [data-a-skel-ghost] / [data-a-skel-snapshot] /
           [data-a-skel-layer] children, observes mutations/resizes,
           picks the shape source (ghost / recall / fallback), measures,
           and paints the bones. -->
      <template v-if="effectiveMode === 'measure'">
        <ASkeletonBones
          :id="props.cacheKey"
          :exact="props.data != null"
          :refetch="props.data != null && props.loading === true"
        >
          <template v-for="i in repeatIndices" :key="`measure-${i}`">
            <template v-if="slots.prototype">
              <slot name="prototype" />
            </template>
            <template v-else>
              <slot :data="shapeData as never" />
            </template>
          </template>
        </ASkeletonBones>
      </template>

      <template v-else-if="effectiveMode === 'clone'">
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
        <ShapeHost v-for="i in repeatIndices" :key="`shape-${i}`" :render="resolveShapeVNodes" />

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
            :vnodes="resolveShapeVNodes()"
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
            :vnodes="resolveShapeVNodes()"
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
    </div>
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

/* Panes are layout-transparent. The outer `.a-skeleton` wrapper remains the
 * grid/flex container (so the consumer's class drives layout); the pane div
 * is purely a DOM anchor for the reveal animation + state tracking. Using
 * `display: contents` means the pane's children are laid out as if they
 * were direct children of `.a-skeleton`, so prototype copies in the
 * skeleton pane still fall into the consumer's grid, and content-slot
 * children stay direct children for `flex-wrap` / `grid-cols-N` consumers.
 *
 * `display: contents` is universally supported in evergreen browsers; the
 * accessibility caveat (contents elements aren't exposed to AT) is a FEATURE
 * here — the pane carries only data-attributes, no semantic content. */
.a-skel-pane {
  display: contents;
}

/* Visually-hidden screen-reader label used while loading. Follows the
 * standard `sr-only` recipe so the text is announced by AT but takes zero
 * visual space. */
.a-skel-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
