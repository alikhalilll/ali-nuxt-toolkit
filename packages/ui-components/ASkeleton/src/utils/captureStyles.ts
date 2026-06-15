/**
 * Comprehensive style-capture engine.
 *
 * Walks the slot's rendered DOM after mount and captures **every visible CSS
 * property** of every element it encounters, plus geometry, into a frozen
 * snapshot tree. The snapshot is replayed by `<ASkeletonClone>` as a tree
 * of positioned divs each carrying its captured inline style.
 *
 * Why this exists (vs the DOM-mirror walker in `buildStructuralSkeleton.ts`):
 *
 *   - DOM-mirror preserves the slot's vnode tree and inherits styling from the
 *     consumer's `class` / inline `style` attributes. That works for *static*
 *     styles, but it can't see styles applied via:
 *       - JavaScript-set inline style (refs, watchers, animation libs)
 *       - CSS-in-JS runtimes that hash class names per instance
 *       - DaisyUI / shadcn / custom CSS where the computed result differs
 *         from what the class string implies
 *       - Scoped styles compiled with content-hash data attributes
 *
 *   - `captureSnapshot` reads `getComputedStyle()` for each element — the
 *     **final** computed style after the cascade has resolved. Replaying that
 *     produces a pixel-identical surface no matter what styling system the
 *     consumer uses.
 *
 * Cost is bounded by the same `maxNodes` / `maxDepth` / `minSize` filters
 * as the legacy `walkDom` capture. The whole pass is a single top-down read
 * with no DOM writes between, so the browser does one layout up front.
 */

import {
  captureTextLines,
  collectVisibleChildren,
  hasDirectText,
  readComputedStyles,
  type TextLineRect,
} from './domRead';

export type { TextLineRect };

/** A captured element — geometry + comprehensive style snapshot + children. */
export interface CapturedNode {
  /** Tag name lowercased — used by the replay to decide content-type treatment. */
  tag: string;
  /** Root-relative position + size in CSS pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * Frozen, ready-to-apply `style` object. Only non-default visual
   * properties are included — the snapshot for a default `<div>` is tiny.
   */
  style: Readonly<Record<string, string>>;
  /**
   * Content classification — drives how `<ASkeletonClone>` renders the leaf:
   *   - `text`     → shimmer text bar (optionally with per-line rects)
   *   - `image`    → solid surface with image-placeholder icon
   *   - `video`    → solid surface with play-icon
   *   - `media`    → atomic block (svg/canvas/iframe — no icon)
   *   - `block`    → opaque shimmer block (default for unrecognised leaves)
   *   - `container` → has children; rendered as a positioned wrapper
   */
  kind: 'text' | 'image' | 'video' | 'media' | 'block' | 'container';
  /**
   * Per-line text rects (only set when `kind === 'text'`). Replaces the
   * single-rect bar with one bar per rendered text line at the exact width
   * of that line — handles wrapping, RTL, centered headings 1:1.
   */
  textLines?: ReadonlyArray<TextLineRect>;
  /** Children (only set when `kind === 'container'`). */
  children?: ReadonlyArray<CapturedNode>;
}

export interface CaptureSnapshot {
  /** Overall bounding box. */
  width: number;
  height: number;
  /** Top-level captured nodes (siblings of the root's direct children). */
  nodes: ReadonlyArray<CapturedNode>;
  /** True if `maxNodes` was hit and the walk bailed out early. */
  truncated: boolean;
  /** When the snapshot was taken (ms since epoch). For cache invalidation policies. */
  capturedAt: number;
}

export interface CaptureOptions {
  /** Max recursion depth. Default 12. */
  maxDepth?: number;
  /** Hard cap on captured nodes. Default 800. */
  maxNodes?: number;
  /** Skip elements smaller than this many CSS pixels (either axis). Default 4. */
  minSize?: number;
  /**
   * When true, capture child elements even inside leaves that we'd normally
   * treat atomically. Default false (atomic = single block).
   */
  walkAtomic?: boolean;
}

const DEFAULT_MAX_DEPTH = 12;
const DEFAULT_MAX_NODES = 800;
const DEFAULT_MIN_SIZE = 4;

/** Tags treated as atomic leaves — no recursion into their contents. */
const ATOMIC_TAGS = new Set([
  'img',
  'svg',
  'canvas',
  'video',
  'audio',
  'input',
  'textarea',
  'select',
  'progress',
  'meter',
  'hr',
  'iframe',
  'object',
  'embed',
  'picture',
  'br',
]);

/** Tags whose content is text — captured as text bars (per-line via Range). */
const TEXT_OWNERS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'span',
  'a',
  'em',
  'strong',
  'small',
  'code',
  'b',
  'i',
  'mark',
  'label',
  'caption',
  'time',
  'dt',
  'dd',
  'li',
  'th',
  'td',
  'figcaption',
  'blockquote',
  'cite',
  'q',
]);

/**
 * Visual CSS properties read from `getComputedStyle()`. Property listed here
 * is included in the captured snapshot **only when its value differs from the
 * skip set** — so a plain unstyled `<div>` produces an empty style object.
 *
 * Listed in the order they're written into the snapshot's `style` object so
 * the replay is deterministic across captures.
 */
const VISUAL_PROPS = [
  /* Box model — padding only (margin doesn't apply to absolute children). */
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',

  /* Border — per edge so non-uniform borders survive. */
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',

  /* Background. */
  'background-color',
  'background-image',
  'background-position',
  'background-size',
  'background-repeat',
  'background-origin',
  'background-clip',

  /* Effects. */
  'box-shadow',
  'opacity',
  'filter',
  'backdrop-filter',
  'transform',
  'transform-origin',
  'mix-blend-mode',

  /* Typography (only meaningful for text leaves but harmless to read for all). */
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration-line',
  'text-decoration-color',
];

/**
 * Snapshot the rendered DOM under `root`, returning a frozen tree of every
 * visible element + its computed visual styles. Replaying the snapshot
 * produces a surface visually identical to `root`.
 */
export function captureSnapshot(root: HTMLElement, options: CaptureOptions = {}): CaptureSnapshot {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const minSize = options.minSize ?? DEFAULT_MIN_SIZE;
  const walkAtomic = options.walkAtomic ?? false;

  const rootRect = root.getBoundingClientRect();
  const state = { count: 0, truncated: false };
  const nodes: CapturedNode[] = [];

  for (let i = 0; i < root.children.length; i++) {
    if (state.count >= maxNodes) {
      state.truncated = true;
      break;
    }
    const node = capture(root.children[i] as HTMLElement, rootRect, 1, {
      maxDepth,
      maxNodes,
      minSize,
      walkAtomic,
      state,
    });
    if (node) nodes.push(node);
  }

  return Object.freeze({
    width: Math.round(rootRect.width),
    height: Math.round(rootRect.height),
    nodes: Object.freeze(nodes),
    truncated: state.truncated,
    capturedAt: Date.now(),
  });
}

interface InternalCtx {
  maxDepth: number;
  maxNodes: number;
  minSize: number;
  walkAtomic: boolean;
  state: { count: number; truncated: boolean };
}

function capture(
  el: HTMLElement,
  origin: DOMRect,
  depth: number,
  ctx: InternalCtx
): CapturedNode | null {
  if (ctx.state.count >= ctx.maxNodes) {
    ctx.state.truncated = true;
    return null;
  }
  if (el.dataset?.skeletonIgnore !== undefined) return null;

  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null;
  /* Opacity zero — skip (the element is invisible). */
  const o = parseFloat(cs.opacity);
  if (Number.isFinite(o) && o === 0) return null;

  const rect = el.getBoundingClientRect();
  const tag = el.tagName.toLowerCase();
  const isTextOwnerTag = TEXT_OWNERS.has(tag);

  /* Text-owner tags can have zero height when their interpolation is empty
   * (e.g. `<h3>{{ data?.name }}</h3>` with `data === null`). The base
   * `minSize` filter would drop them, leaving the heading invisible in the
   * clone replay. For text-owners only, synthesize a height from the
   * element's `line-height` (or `font-size * 1.4` as a fallback) so the
   * fallback bar still renders at the heading's natural rendered height. */
  let effectiveHeight = rect.height;
  if (isTextOwnerTag && effectiveHeight < ctx.minSize) {
    const lh = parseFloat(cs.lineHeight);
    const fs = parseFloat(cs.fontSize);
    if (Number.isFinite(lh) && lh > 0) effectiveHeight = lh;
    else if (Number.isFinite(fs) && fs > 0) effectiveHeight = fs * 1.4;
  }

  if (rect.width < ctx.minSize || effectiveHeight < ctx.minSize) return null;

  const x = Math.round(rect.left - origin.left);
  const y = Math.round(rect.top - origin.top);
  const w = Math.round(rect.width);
  const h = Math.round(effectiveHeight);

  const style = readComputedStyles(cs, VISUAL_PROPS);

  /* Classify the leaf — drives how `<ASkeletonClone>` renders this node. */
  const isAtomic = ATOMIC_TAGS.has(tag);
  const hasOwnText = hasDirectText(el);
  const childrenEls = collectVisibleChildren(el);

  let kind: CapturedNode['kind'];

  if (tag === 'img' || tag === 'picture') {
    kind = 'image';
  } else if (tag === 'video') {
    kind = 'video';
  } else if (isAtomic) {
    kind = 'media';
  } else if (childrenEls.length === 0 && (hasOwnText || isTextOwnerTag)) {
    /* Text-owner tags with no children (e.g. `<h3>{{ data?.name }}</h3>` with
     * null data) classify as text even though their interpolation is empty —
     * the renderer falls back to a single full-box bar at the element's
     * natural rendered dimensions, so the heading shimmers at the right
     * height instead of rendering as a generic block. */
    kind = 'text';
  } else if (childrenEls.length === 0) {
    kind = 'block';
  } else {
    kind = 'container';
  }

  /* For text leaves, capture per-line rects via Range API. */
  let textLines: CapturedNode['textLines'];
  if (kind === 'text') {
    textLines = captureTextLines(el, origin);
  }

  /* Recurse into children for containers (and atomic if walkAtomic). */
  let children: CapturedNode[] | undefined;
  if (kind === 'container' && depth < ctx.maxDepth) {
    children = [];
    for (const c of childrenEls) {
      if (ctx.state.count >= ctx.maxNodes) {
        ctx.state.truncated = true;
        break;
      }
      const childNode = capture(c, origin, depth + 1, ctx);
      if (childNode) children.push(childNode);
    }
    if (children.length === 0) {
      /* All children filtered (sub-`minSize`, hidden, etc.) — degrade to a
       * single shimmer block at the parent's own rect. Even a "plain layout
       * div" with no captured visual style occupies real space in the
       * surrounding flow; leaving it as a container with no children would
       * render an invisible positioned wrapper, swallowing the shape of e.g.
       * `<UiSwitch>` whose inner thumb/track spans fall below `minSize`. */
      children = undefined;
      kind = 'block';
    }
  } else if ((kind === 'container' && depth >= ctx.maxDepth) || (isAtomic && ctx.walkAtomic)) {
    kind = 'block';
  }

  ctx.state.count++;

  return Object.freeze({
    tag,
    x,
    y,
    w,
    h,
    style,
    kind,
    textLines: textLines ? Object.freeze(textLines) : undefined,
    children: children ? Object.freeze(children) : undefined,
  });
}
