/**
 * Motion-preference + animation-support checks.
 *
 * Port of `/motion.ts:1-16`. Every animation side effect in the
 * engine gates on these — `prefers-reduced-motion: reduce` short-circuits
 * the fade/sweep/sequence planners to the "instant" plan, and `canAnimate()`
 * reports whether the host runtime has the Web Animations API (false in
 * jsdom-based tests).
 *
 * All checks are cheap guards that return `false` on first inspection in a
 * non-browser context — safe to call from pure module scopes.
 */

/** True when `Element.prototype.animate` exists. jsdom returns false. */
export function canAnimate(): boolean {
  if (typeof Element === 'undefined') return false;
  return typeof (Element.prototype as { animate?: unknown }).animate === 'function';
}

/**
 * True when the user has opted out of animation (OS-level toggle), or when
 * the runtime can't drive `Element.animate()`. Either case → the reveal
 * applier skips keyframes and resolves instantly.
 */
export function prefersReducedMotion(): boolean {
  if (!canAnimate()) return true;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** True when the user has opted into reduced transparency — fade sweeps are flattened. */
export function prefersReducedTransparency(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  } catch {
    return false;
  }
}

/** Return all running animations on `el` as an array (never null). */
export function animationsOf(el: Element | null): Animation[] {
  if (!el) return [];
  const getAnimations = (el as unknown as { getAnimations?: () => Animation[] }).getAnimations;
  if (typeof getAnimations !== 'function') return [];
  try {
    return getAnimations.call(el) ?? [];
  } catch {
    return [];
  }
}
