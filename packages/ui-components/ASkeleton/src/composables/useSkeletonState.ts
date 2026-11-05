/**
 * Resolve `<ASkeleton>`'s pane state and track the previous state across
 * updates — the two facts every lifecycle hook (reveal animation,
 * `@reveal` emit, debug overlay) depends on.
 *
 * Pure logic over the exposed inputs; no DOM reads. Side effects (watchers
 * on state transitions) live in `useSkeletonLifecycle`.
 *
 * The composable is a thin wrapper around `resolveState` from
 * `../utils/resolveState`. The reason it exists as a composable (rather
 * than the consumer calling `resolveState` directly) is to centralise the
 * `driven` detection — "did the user bind a `data` prop at all?" —
 * which requires `getCurrentInstance()` and so has to run inside a
 * component scope.
 */

import { computed, getCurrentInstance, type ComputedRef, type Ref } from 'vue';
import { resolveState, type ASkeletonState } from '../utils/resolveState';

interface StateInput {
  loading: Ref<boolean | undefined>;
  error: Ref<unknown>;
  empty: Ref<boolean | undefined>;
  data: Ref<unknown>;
}

export interface SkeletonStateHandle {
  state: ComputedRef<ASkeletonState>;
  isLoading: ComputedRef<boolean>;
  driven: ComputedRef<boolean>;
}

export function useSkeletonState(input: StateInput): SkeletonStateHandle {
  const instance = getCurrentInstance();

  /* Data-driven detection via vnode.props inspection — same trick
   * uses at `vue/Skeleton.ts:166`. A consumer who writes `<ASkeleton>`
   * without a `:data` binding gets the control API (`loading` drives
   * everything); binding `:data` even to `null` switches to data-driven
   * mode where the state resolver's `driven` branch kicks in. */
  const driven = computed(() => {
    const vp = instance?.vnode?.props;
    return !!vp && 'data' in vp;
  });

  const state = computed<ASkeletonState>(() =>
    resolveState({
      loading: input.loading.value,
      error: input.error.value,
      empty: input.empty.value,
      data: input.data.value,
      driven: driven.value,
    })
  );

  const isLoading = computed(() => state.value === 'skeleton');

  return { state, isLoading, driven };
}
