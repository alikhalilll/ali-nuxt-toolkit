/**
 * Shared DOM-read helpers used by both capture strategies:
 *   - `captureStyles.ts` (clone-mode comprehensive style snapshot)
 *   - `walkStructural.ts` (Recipe 3 tree-shaped capture)
 *
 * One source of truth for "what counts as a default CSS value", how to read a
 * computed-style subset into a frozen camelCased object, and how to measure
 * per-line text rectangles. Keeping both walkers behind these helpers prevents
 * silent drift between the two pipelines.
 */

/** A single rendered text-line rectangle, expressed in root-relative pixels. */
export interface TextLineRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Computed values that count as "default" and shouldn't be persisted. Stripped
 * before a captured `style` object lands on a node so a plain unstyled element
 * produces an empty style — keeps snapshots small and the rendered DOM clean.
 */
export const SKIP_VALUES: ReadonlySet<string> = new Set([
  'none',
  'normal',
  'auto',
  '0px',
  '0',
  '0 0',
  '0% 0%',
  '0px 0px',
  '0deg',
  '0s',
  'visible',
  'static',
  'transparent',
  'rgba(0, 0, 0, 0)',
  'rgb(0, 0, 0, 0)',
  'initial',
  'inherit',
  'unset',
  'currentcolor',
]);

/**
 * Read the subset of `props` from `cs` and return a frozen camelCased style
 * map with the SKIP_VALUES entries omitted. `opacity: 1` is treated as default
 * (matches CSS' initial value).
 */
export function readComputedStyles(
  cs: CSSStyleDeclaration,
  props: ReadonlyArray<string>
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const prop of props) {
    const val = cs.getPropertyValue(prop).trim();
    if (!val) continue;
    if (SKIP_VALUES.has(val.toLowerCase())) continue;
    if (prop === 'opacity' && (val === '1' || parseFloat(val) === 1)) continue;
    out[camelCase(prop)] = val;
  }
  return Object.freeze(out);
}

export function camelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** True when the element has at least one non-whitespace direct text-node child. */
export function hasDirectText(el: Element): boolean {
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0) {
      return true;
    }
  }
  return false;
}

/** Element children, with `data-skeleton-ignore` descendants filtered out. */
export function collectVisibleChildren(el: Element): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (let i = 0; i < el.children.length; i++) {
    const c = el.children[i] as HTMLElement;
    if (c.dataset?.skeletonIgnore !== undefined) continue;
    out.push(c);
  }
  return out;
}

/**
 * Per-line text rects via `Range.getClientRects()`. Returns one rect per visual
 * line — exact left/width for each line so wrapped paragraphs, RTL last-line
 * positions, centered headings replay 1:1 without heuristics. Returns
 * `undefined` if the element has no direct text or the Range API isn't usable.
 *
 * Two rects on the same baseline AND horizontally touching (gap ≤ 2 px) are
 * merged so inline spans on the same line collapse to one bar. Same-baseline
 * rects on different visual lines (rare; float-into-paragraph layouts) won't
 * touch horizontally and stay separate.
 */
export function captureTextLines(el: Element, origin: DOMRect): TextLineRect[] | undefined {
  if (typeof document === 'undefined' || typeof document.createRange !== 'function')
    return undefined;
  let range: Range;
  try {
    range = document.createRange();
    range.selectNodeContents(el);
  } catch {
    return undefined;
  }
  const rects = range.getClientRects();
  if (!rects || rects.length === 0) return undefined;

  const merged: TextLineRect[] = [];
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (r.width <= 0 || r.height <= 0) continue;
    const lr: TextLineRect = {
      x: Math.round(r.left - origin.left),
      y: Math.round(r.top - origin.top),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
    const last = merged[merged.length - 1];
    const sameLine = last && Math.abs(last.y - lr.y) <= 1 && Math.abs(last.h - lr.h) <= 1;
    /* Touching = gap between the trailing edge of `last` and the leading
     * edge of `lr` is at most 2 px (one rounding slack per end). */
    const touching =
      sameLine && Math.max(last!.x, lr.x) - Math.min(last!.x + last!.w, lr.x + lr.w) <= 2;
    if (touching) {
      const leftEdge = Math.min(last!.x, lr.x);
      const rightEdge = Math.max(last!.x + last!.w, lr.x + lr.w);
      last!.x = leftEdge;
      last!.w = rightEdge - leftEdge;
    } else {
      merged.push(lr);
    }
  }
  return merged.length > 0 ? merged : undefined;
}
