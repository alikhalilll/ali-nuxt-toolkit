/**
 * `hints` — centralised author opt-outs / opt-ins for every walker.
 *
 * Every rendering pass (`captureSnapshot`, `walkDom`, `walkStructural`,
 * `buildStructuralSkeleton`) asks the same questions of an element: should I
 * skip it, should I render it as a single block instead of recursing, is it
 * self-skeletonising? Before this module each walker read the data-attributes
 * directly, which (a) duplicated the surface area for class-name hints and
 * (b) meant adding a new hint required editing four files. One helper per
 * question, used everywhere.
 *
 * Two syntaxes supported, matching the two conventions in the ecosystem:
 *   - **data-attributes** — `data-skeleton-ignore`, `data-skeleton-stop`,
 *     `data-skeleton-block`, `data-skeleton-own`. Preserved for backwards
 *     compatibility.
 *   - **class names** — `.a-skel-ignore`, `.a-skel-stop`, `.a-skel-block-hint`,
 *     `.a-skel-own`. Shorter in templates; CSS-selector-matchable so themes
 *     can style them. (The class alias for the "block" hint is
 *     `.a-skel-block-hint` — the bare `.a-skel-block` is already a visual
 *     class for the shimmer surface itself, so re-using it would conflate
 *     "author asked for a block" with "rendered as a block".)
 *
 * All functions take `Element | null` and tolerate SVG elements where
 * `classList` works but `dataset` doesn't exist as reliably — HTML's
 * `HTMLElement.dataset` is spec-ed; SVG's `SVGElement.dataset` is widely
 * implemented but only reads lowercase-converted attrs. We check both the
 * dataset and the attribute directly for robustness.
 */

const HINT_IGNORE_ATTR = 'data-skeleton-ignore';
const HINT_STOP_ATTR = 'data-skeleton-stop';
const HINT_BLOCK_ATTR = 'data-skeleton-block';
const HINT_OWN_ATTR = 'data-skeleton-own';

const HINT_IGNORE_CLASS = 'a-skel-ignore';
const HINT_STOP_CLASS = 'a-skel-stop';
const HINT_BLOCK_CLASS = 'a-skel-block-hint';
const HINT_OWN_CLASS = 'a-skel-own';

function hasAttrOrDataset(el: Element, key: string, datasetKey: string): boolean {
  const html = el as HTMLElement;
  if (html.dataset && datasetKey in html.dataset) return true;
  return el.hasAttribute(key);
}

/**
 * "Pretend this element isn't there" — the walker emits nothing for it and
 * doesn't recurse into it. Use for decorative chrome (background SVGs,
 * dividers, persistent badges) that should always render verbatim.
 */
export function isIgnored(el: Element | null): boolean {
  if (!el) return false;
  if (hasAttrOrDataset(el, HINT_IGNORE_ATTR, 'skeletonIgnore')) return true;
  if (el.classList && el.classList.contains(HINT_IGNORE_CLASS)) return true;
  return false;
}

/**
 * "Render this element as a single block carrying its outer class/style —
 * don't recurse into its children." Use when a component has a simple outer
 * shape but noisy internals you don't want to see shimmer-ed individually.
 */
export function isStopped(el: Element | null): boolean {
  if (!el) return false;
  if (hasAttrOrDataset(el, HINT_STOP_ATTR, 'skeletonStop')) return true;
  if (el.classList && el.classList.contains(HINT_STOP_CLASS)) return true;
  return false;
}

/**
 * "Treat this element as an atomic block even though its tag/content would
 * normally classify it as a container." Rendered as one shimmer block at the
 * element's own rect — stronger than `isStopped` in that children are not
 * inspected at all (not even for the painted-vs-plain surface signal that
 * drives container decisions).
 */
export function isForcedBlock(el: Element | null): boolean {
  if (!el) return false;
  if (hasAttrOrDataset(el, HINT_BLOCK_ATTR, 'skeletonBlock')) return true;
  if (el.classList && el.classList.contains(HINT_BLOCK_CLASS)) return true;
  return false;
}

/**
 * "This subtree draws its own skeleton — leave it alone." The walker stops
 * descending here and renders the element itself as a transparent pass-through.
 * Matches skullet's `[skullet-own]` semantic.
 */
export function isSelfSkeletonising(el: Element | null): boolean {
  if (!el) return false;
  if (hasAttrOrDataset(el, HINT_OWN_ATTR, 'skeletonOwn')) return true;
  if (el.classList && el.classList.contains(HINT_OWN_CLASS)) return true;
  return false;
}

/** All hint attribute names + class names, exported so tests + consumers can round-trip. */
export const HINT_ATTRS = Object.freeze({
  ignore: HINT_IGNORE_ATTR,
  stop: HINT_STOP_ATTR,
  block: HINT_BLOCK_ATTR,
  own: HINT_OWN_ATTR,
} as const);

export const HINT_CLASSES = Object.freeze({
  ignore: HINT_IGNORE_CLASS,
  stop: HINT_STOP_CLASS,
  block: HINT_BLOCK_CLASS,
  own: HINT_OWN_CLASS,
} as const);
