const prefers = (query: string) => typeof matchMedia !== 'undefined' && matchMedia(query).matches;

// Not in jsdom, where every fade is instant
export const canAnimate = () =>
  typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';

export const prefersReducedMotion = () =>
  !canAnimate() || prefers('(prefers-reduced-motion: reduce)');

export const prefersReducedTransparency = () => prefers('(prefers-reduced-transparency: reduce)');

export const animationsOf = (element: Element): Animation[] => element.getAnimations?.() ?? [];

export type SkeletonDirection = 'ltr' | 'rtl';

/** The inherited writing direction for `element` — follows `<html dir>` and any CSS `direction`
 *  along the ancestor chain. Falls back to `ltr` outside a DOM. Reading from `getComputedStyle`
 *  defers to the browser's own cascade, so consumers opt in by setting `dir` or `direction`
 *  anywhere above the skeleton rather than threading a new prop or custom property through. */
export function directionOf(element: Element): SkeletonDirection {
  if (typeof getComputedStyle !== 'function') return 'ltr';
  return getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}
