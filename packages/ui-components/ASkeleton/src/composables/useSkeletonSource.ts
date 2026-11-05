/**
 * Pick the stand-in value the ghost / prototype should render during the
 * skeleton pane. Implements the **shape precedence waterfall** from
 * `skullet/lib/ghost.ts:151-201`:
 *
 *   1. current `data` on screen (refetch over existing content)
 *   2. last-seen `data` under the same `id` / `cacheKey`
 *   3. `sample` prop
 *   4. (otherwise undefined — the walker falls back to the default slot
 *      or the generic shimmer)
 *
 * The last-seen cache lives in module scope keyed by `id`, so multiple
 * `<ASkeleton>` instances with the same `id` share the fallback value
 * (useful for grids: open card → navigate → come back → the skeleton
 * shows the previous content's shape).
 *
 * Pure except for the module-level `lastById` Map — the only state —
 * and the tracker ref update inside the composable's `watch`.
 */

import { computed, watch, type ComputedRef, type Ref } from 'vue';

interface SourceInput {
  data: Ref<unknown>;
  sample: Ref<unknown>;
  id: Ref<string | undefined>;
}

export interface SkeletonSourceHandle {
  /** Value to render in the skeleton pane's shape slot. */
  shapeData: ComputedRef<unknown>;
  /** Which precedence level resolved — used by the debug overlay source tag. */
  source: ComputedRef<'data' | 'last' | 'sample' | 'none'>;
}

const lastById = new Map<string, unknown>();

export function useSkeletonSource(input: SourceInput): SkeletonSourceHandle {
  /* Keep `lastById` fresh — any time real data arrives for an id, memoise
   * it. Nullish values don't overwrite (that's the whole point of this
   * cache). */
  watch(
    [input.data, input.id],
    ([value, id]) => {
      if (value != null && id) lastById.set(id, value);
    },
    { immediate: true }
  );

  const shapeData = computed<unknown>(() => {
    if (input.data.value != null) return input.data.value;
    const id = input.id.value;
    if (id && lastById.has(id)) return lastById.get(id);
    if (input.sample.value !== undefined) return input.sample.value;
    return undefined;
  });

  const source = computed<'data' | 'last' | 'sample' | 'none'>(() => {
    if (input.data.value != null) return 'data';
    const id = input.id.value;
    if (id && lastById.has(id)) return 'last';
    if (input.sample.value !== undefined) return 'sample';
    return 'none';
  });

  return { shapeData, source };
}

/** Test-only. */
export function forgetSkeletonSourceCache(): void {
  lastById.clear();
}
