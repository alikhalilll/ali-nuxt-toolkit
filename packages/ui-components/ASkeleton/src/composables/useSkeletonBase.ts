/**
 * Shared primitive scaffolding for every variant component (`ASkeletonText`,
 * `ASkeletonCard`, `ASkeletonHeading`, …).
 *
 * Before this composable, each of the 15 variant SFCs duplicated:
 *   - the `animation` prop enum
 *   - the `a-skel-anim-<animation>` class derivation
 *   - the `role="status"` + `aria-live="polite"` + `aria-busy="true"` root
 *     attribute set
 *   - the `<span class="a-skel-sr-only">Loading…</span>` screen-reader
 *     helper
 *
 * One source now owns all four. Adding a new variant becomes "write the
 * shape; `useSkeletonBase()` fills the rest in."
 *
 * The composable is pure — no watchers, no DOM reads — so it's safe to call
 * from any component scope.
 */

import { computed, type ComputedRef, type Ref } from 'vue';

/** Animation name recognised by every variant. */
export type VariantAnimation = 'pulse' | 'shimmer' | 'wave' | 'none';

/**
 * Fixed a11y attribute set applied to every variant's root. `Readonly` so
 * variants can spread without accidentally mutating the shared object.
 */
export const SKELETON_A11Y_ATTRS = Object.freeze({
  role: 'status',
  'aria-live': 'polite',
  'aria-busy': 'true',
}) as Readonly<{
  role: 'status';
  'aria-live': 'polite';
  'aria-busy': 'true';
}>;

/** Screen-reader label every variant emits in a visually-hidden `<span>`. */
export const SKELETON_SR_LABEL = 'Loading…';

export interface SkeletonBaseHandle {
  /** Class name derived from the current animation. `null` for `'none'`. */
  animClass: ComputedRef<string | null>;
  /** Fixed a11y attribute set — spread onto the root. */
  a11yAttrs: typeof SKELETON_A11Y_ATTRS;
  /** Default sr-only label. Consumers may override per-variant. */
  srLabel: string;
}

/**
 * Produce the shared variant surface. Variants pass their reactive
 * `animation` ref; the composable returns the class + attrs they splat
 * onto their root.
 */
export function useSkeletonBase(animation: Ref<VariantAnimation | undefined>): SkeletonBaseHandle {
  const animClass = computed(() =>
    animation.value === 'none' || !animation.value ? null : `a-skel-anim-${animation.value}`
  );
  return {
    animClass,
    a11yAttrs: SKELETON_A11Y_ATTRS,
    srLabel: SKELETON_SR_LABEL,
  };
}
