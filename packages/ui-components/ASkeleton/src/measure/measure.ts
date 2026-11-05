/**
 * `measureSkeleton(root, layer)` — the skullet-style measurement entry point.
 *
 * Walks the ghost DOM once and produces a flat list of `SkeletonRect[]` that
 * the bones painter mounts into the shadow-DOM layer. Two primitives:
 *
 *   - **blocks** — elements with paint (background / border / shadow) OR
 *     media tags OR a single-label painted container. One `SkeletonRect`
 *     per block at the element's clipped box, inheriting the clip's
 *     rounded corners if touching them.
 *   - **text lines** — one bar per rendered line, measured via
 *     `Range.getClientRects()`. Fragments on the same baseline that are
 *     close enough (≤40% of the font size apart, ≥50% vertical overlap)
 *     merge into a single bar.
 *
 * Scoped port of `skullet/lib/measure.ts:382-497`. Simplifications vs the
 * reference:
 *   - No `onCovered` callback — the walker emits rects directly; the
 *     ASkeleton CSS scopes paint-hiding to `[data-a-skel-covered]` on
 *     elements the walker has marked.
 *   - No MutationObserver-driven covered-marking churn optimisation — the
 *     ASkeletonBones component re-runs measurement on observed changes
 *     and re-marks on each pass. Enough for v3's first ship.
 */

import { isForcedBlock, isIgnored, isSelfSkeletonising, isStopped } from '../utils/hints';
import { ATTR_COVERED } from '../utils/attrs';
import { MEDIA_TAGS, TEXT_TAGS } from '../walkers/classify';
import { clipWithin, intersect, type Clip, type Rect } from './clip';
import { barOf, type Rect as MetricsRect } from './metrics';

/** One box to draw: block or text bar, layer-relative. */
export interface SkeletonRect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: string;
}

/* TEXT_TAGS + MEDIA_TAGS come from `../walkers/classify` — the shared
 * single source of truth across every walker. Local overrides belong in a
 * walker's own `isSpecial…` predicate, not a duplicated tag set. */

const LINE_GAP = 0.4;
const TRANSPARENT = /[,/]\s*0\)$/;

function isSet(value: string, none: string): boolean {
  return value !== '' && value !== none;
}

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;
function bordered(style: CSSStyleDeclaration): boolean {
  return SIDES.every(
    (side) =>
      isSet(
        style[
          `border${side}Style` as
            | 'borderTopStyle'
            | 'borderRightStyle'
            | 'borderBottomStyle'
            | 'borderLeftStyle'
        ],
        'none'
      ) &&
      isSet(
        style[
          `border${side}Width` as
            | 'borderTopWidth'
            | 'borderRightWidth'
            | 'borderBottomWidth'
            | 'borderLeftWidth'
        ],
        '0px'
      )
  );
}

function isRule(shadow: string): boolean {
  const [x = 0, y = 0, blur = 0, spread = 0] = (
    shadow.replace(/rgba?\([^)]*\)|#\w+/g, '').match(/-?[\d.]+px/g) ?? []
  ).map(parseFloat);
  return (
    shadow.includes('inset') && !blur && !spread && (x === 0) !== (y === 0) && Math.abs(x + y) <= 2
  );
}

function shadowPaints(boxShadow: string): boolean {
  return isSet(boxShadow, 'none') && !boxShadow.split(/,(?![^(]*\))/).every(isRule);
}

function isPainted(style: CSSStyleDeclaration): boolean {
  return (
    (isSet(style.backgroundColor, 'transparent') && !TRANSPARENT.test(style.backgroundColor)) ||
    isSet(style.backgroundImage, 'none') ||
    shadowPaints(style.boxShadow) ||
    bordered(style)
  );
}

function isMedia(el: Element): boolean {
  return MEDIA_TAGS.has(el.localName);
}

function hasOwnText(el: Element): boolean {
  for (let i = 0; i < el.childNodes.length; i++) {
    const n = el.childNodes[i];
    if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0) return true;
  }
  return false;
}

function textFragments(range: Range): DOMRect[] {
  const list = range.getClientRects?.() ?? [];
  return [...list];
}

interface Line {
  left: number;
  right: number;
  top: number;
  bottom: number;
  fontSize: number;
  barTop: number;
  barBottom: number;
  radius: string;
}

export interface MeasureOptions {
  /** Max recursion depth. Default 16. */
  maxDepth?: number;
  /** Max emitted rects. Default 500. */
  maxRects?: number;
  /** Min CSS-pixel size for an element to count. Default 4. */
  minSize?: number;
  /** When true, mark emitted blocks with [data-a-skel-covered] so CSS can hide them. */
  mark?: boolean;
}

/**
 * Entry point. Walks `root` and returns a list of `SkeletonRect` positioned
 * in `layer`'s coordinate space (i.e. relative to the layer's top-left).
 */
export function measureSkeleton(
  root: HTMLElement,
  layer: HTMLElement,
  options: MeasureOptions = {}
): SkeletonRect[] {
  const maxDepth = options.maxDepth ?? 16;
  const maxRects = options.maxRects ?? 500;
  const minSize = options.minSize ?? 4;
  const mark = options.mark ?? true;

  const layerRect = layer.getBoundingClientRect();
  const marked = new Set<Element>();
  const previouslyMarked = new Set<Element>();
  if (mark) {
    const existing = root.querySelectorAll(`[${ATTR_COVERED}]`);
    for (let i = 0; i < existing.length; i++) previouslyMarked.add(existing[i]);
  }

  const blocks: Array<Rect & { radius: string }> = [];
  const lines: Line[] = [];

  function emitBlock(rect: Rect, radius: string, el: Element): void {
    if (blocks.length + lines.length >= maxRects) return;
    blocks.push({ ...rect, radius });
    if (mark) {
      el.setAttribute(ATTR_COVERED, '');
      marked.add(el);
    }
  }

  function addLine(fragment: DOMRect, parentStyle: CSSStyleDeclaration, fontSize: number): void {
    if (blocks.length + lines.length >= maxRects) return;
    const metricsRect: MetricsRect = {
      top: fragment.top,
      bottom: fragment.bottom,
      left: fragment.left,
      right: fragment.right,
    };
    const { barTop, barBottom } = barOf(metricsRect, parentStyle, fontSize);
    const radius = parentStyle.getPropertyValue('--ak-skel-radius').trim() || '';
    lines.push({
      left: fragment.left,
      right: fragment.right,
      top: fragment.top,
      bottom: fragment.bottom,
      fontSize,
      barTop,
      barBottom,
      radius,
    });
  }

  function visit(el: Element, parentClip: Clip, depth: number): void {
    if (isIgnored(el) || isSelfSkeletonising(el)) return;
    if (depth > maxDepth) return;

    const html = el as HTMLElement;
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const opacity = parseFloat(cs.opacity);
    if (Number.isFinite(opacity) && opacity === 0) return;

    const rawRect = el.getBoundingClientRect();
    if (rawRect.width < minSize || rawRect.height < minSize) return;
    const rect: Rect = {
      left: rawRect.left,
      right: rawRect.right,
      top: rawRect.top,
      bottom: rawRect.bottom,
    };
    const clipped = intersect(parentClip, rect);
    if (clipped.right - clipped.left < minSize || clipped.bottom - clipped.top < minSize) return;

    const forced = isForcedBlock(el) || isStopped(el);
    const painted = isPainted(cs);
    const media = isMedia(el);
    const textOwner = TEXT_TAGS.has(el.localName);

    /* Block decision — explicit forcing wins over tag classification. */
    if (forced || media || (painted && !textOwner)) {
      const own = clipWithin(parentClip, rect, cs);
      const corners = own ? own.corners : [0, 0, 0, 0];
      const radius = corners.map((r) => `${r}px`).join(' ');
      emitBlock(clipped, radius, el);
      return;
    }

    /* Text-owner leaf with own text — one bar per rendered line (merged). */
    if (textOwner && hasOwnText(el) && !html.firstElementChild) {
      const fontSize = parseFloat(cs.fontSize) || 16;
      const range = document.createRange();
      try {
        range.selectNodeContents(el);
        const fragments = textFragments(range);
        const merged = mergeFragments(fragments, fontSize);
        for (const fragment of merged) {
          const inside = intersect(parentClip, {
            left: fragment.left,
            right: fragment.right,
            top: fragment.top,
            bottom: fragment.bottom,
          });
          const asDom = toDomRect(inside);
          if (asDom.width < minSize || asDom.height < minSize) continue;
          addLine(asDom, cs, fontSize);
        }
      } finally {
        range.detach?.();
      }
      return;
    }

    /* Container — recurse. If `overflow: hidden`, propagate a new clip. */
    const nextClip =
      cs.overflow === 'hidden' ||
      cs.overflow === 'clip' ||
      cs.overflow === 'auto' ||
      cs.overflow === 'scroll'
        ? clipWithin(parentClip, rect, cs)
        : parentClip;
    for (let i = 0; i < el.children.length; i++) visit(el.children[i], nextClip, depth + 1);
  }

  visit(root, null, 0);

  /* Remove covered marks on elements we didn't re-emit this pass. Keeps the
   * DOM clean when the ghost changes between measurements. */
  if (mark) {
    for (const el of previouslyMarked) {
      if (!marked.has(el)) el.removeAttribute(ATTR_COVERED);
    }
  }

  /* Convert absolute coords → layer-relative. */
  const result: SkeletonRect[] = [];
  for (const b of blocks) {
    result.push({
      x: b.left - layerRect.left,
      y: b.top - layerRect.top,
      width: b.right - b.left,
      height: b.bottom - b.top,
      radius: b.radius,
    });
  }
  for (const line of lines) {
    const height = line.barBottom - line.barTop;
    result.push({
      x: line.left - layerRect.left,
      y: line.barTop - layerRect.top,
      width: line.right - line.left,
      height,
      radius: line.radius || `${Math.round(height / 3)}px`,
    });
  }
  return result;
}

/**
 * Merge text fragments on the same baseline that are close enough
 * horizontally — the real text wrapped them to the same visual line.
 * Vertical overlap ≥50% of the shorter + horizontal gap ≤ LINE_GAP × fontSize.
 */
function mergeFragments(fragments: DOMRect[], fontSize: number): DOMRect[] {
  if (fragments.length < 2) return fragments.slice();
  const sorted = fragments
    .filter((f) => f.width >= 1 && f.height >= 1)
    .sort((a, b) => a.top - b.top || a.left - b.left);
  const merged: DOMRect[] = [];
  for (const fragment of sorted) {
    const last = merged[merged.length - 1];
    if (last && overlapsLine(last, fragment, fontSize)) {
      const left = Math.min(last.left, fragment.left);
      const right = Math.max(last.right, fragment.right);
      const top = Math.min(last.top, fragment.top);
      const bottom = Math.max(last.bottom, fragment.bottom);
      merged[merged.length - 1] = new DOMRect(left, top, right - left, bottom - top);
    } else {
      merged.push(fragment);
    }
  }
  return merged;
}

function overlapsLine(a: DOMRect, b: DOMRect, fontSize: number): boolean {
  const overlapTop = Math.max(a.top, b.top);
  const overlapBottom = Math.min(a.bottom, b.bottom);
  const overlap = overlapBottom - overlapTop;
  const minHeight = Math.min(a.height, b.height);
  if (overlap < minHeight * 0.5) return false;
  const gap = Math.max(a.left - b.right, b.left - a.right);
  return gap <= fontSize * LINE_GAP;
}

function toDomRect(rect: Rect): DOMRect {
  return new DOMRect(
    rect.left,
    rect.top,
    Math.max(0, rect.right - rect.left),
    Math.max(0, rect.bottom - rect.top)
  );
}
