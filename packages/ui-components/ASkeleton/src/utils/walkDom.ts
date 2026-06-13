import type { CSSProperties } from 'vue';
import type { CachedShape, ShapeNode, ShapeNodeType, TextLineRect } from '../types';

export interface WalkOptions {
  maxDepth: number;
  /** Hard cap on captured nodes. Default 500. */
  maxNodes?: number;
  /** Min CSS-pixel size (either axis) for an element to be emitted. Default 4. */
  minSize?: number;
}

const DEFAULT_MAX_NODES = 500;
const DEFAULT_MIN_SIZE = 4;

/* Atomic elements — never recursed into; rendered as a single block. */
const LEAF_TAGS = new Set([
  'IMG',
  'SVG',
  'CANVAS',
  'VIDEO',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
  'PROGRESS',
  'METER',
  'HR',
]);

/**
 * Walk `root`'s descendants and produce a list of shimmer blocks that mirror its
 * rendered layout. Coordinates are relative to `root`'s top-left so the result can
 * be replayed in any container of the same size.
 *
 * Performance:
 *   - `maxNodes` caps the walk so a 5000-row table doesn't lock up the main thread.
 *   - `minSize` filters out hairlines (1-2 px paddings, decorative dots) that
 *     inflate node count without adding visual signal.
 *   - All `getBoundingClientRect` / `getComputedStyle` reads happen in a single
 *     top-down pass with no intervening writes, so the browser does one layout
 *     up front and serves cached values from then on (no layout thrashing).
 *   - Each emitted `ShapeNode` has a frozen pre-computed `style` (and `lineStyles`
 *     for multi-line text) so the render path is allocation-free.
 */
export function walkDom(root: HTMLElement, options: WalkOptions): CachedShape {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const minSize = options.minSize ?? DEFAULT_MIN_SIZE;

  const nodes: ShapeNode[] = [];
  const rootRect = root.getBoundingClientRect();
  let truncated = false;

  function visit(el: Element, depth: number): void {
    if (nodes.length >= maxNodes) {
      truncated = true;
      return;
    }

    const html = el as HTMLElement;
    if (html.dataset?.skeletonIgnore !== undefined) return;

    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;

    const rect = el.getBoundingClientRect();
    if (rect.width < minSize || rect.height < minSize) return;

    const tag = el.tagName.toUpperCase();
    const isLeafTag = LEAF_TAGS.has(tag);
    const hasStop = html.dataset?.skeletonStop !== undefined;
    const childElements: Element[] = [];
    for (let i = 0; i < el.children.length; i++) {
      const c = el.children[i];
      if ((c as HTMLElement).dataset?.skeletonIgnore === undefined) childElements.push(c);
    }
    const hasOwnText = hasDirectTextContent(el);
    const reachedDepth = depth >= options.maxDepth;
    const isLeaf = isLeafTag || hasStop || reachedDepth || childElements.length === 0;

    if (isLeaf) {
      const node = elementToShape(el, tag, cs, rect, rootRect, hasOwnText);
      if (node) nodes.push(node);
      return;
    }

    /* Container with a visible surface (background / border / shadow / opacity)
     * — emit a backing block at the container's exact rect BEFORE recursing, so
     * children render on top of a card that keeps its identity. Without this,
     * a `<div class="bg-white shadow-lg rounded-2xl">` wrapping content would
     * vanish from the replay because the walker only ever recurses into it. */
    const containerNode = containerSurfaceToShape(cs, rect, rootRect);
    if (containerNode) nodes.push(containerNode);

    for (let i = 0; i < childElements.length; i++) {
      if (nodes.length >= maxNodes) {
        truncated = true;
        return;
      }
      visit(childElements[i], depth + 1);
    }
  }

  for (let i = 0; i < root.children.length; i++) {
    if (nodes.length >= maxNodes) {
      truncated = true;
      break;
    }
    visit(root.children[i], 1);
  }

  return Object.freeze({
    nodes: Object.freeze(nodes),
    width: Math.round(rootRect.width),
    height: Math.round(rootRect.height),
    truncated,
  }) as CachedShape;
}

function hasDirectTextContent(el: Element): boolean {
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Emit a backing block for a container with its own visible surface — real
 * background, border, box-shadow, or non-full opacity. Geometry is the
 * container's exact bounding rect so the width / height / radius match the
 * real DOM 1:1. Returns `null` when the container has no visible surface
 * (a plain unstyled `<div>` is layout-only and shouldn't add a block).
 */
function containerSurfaceToShape(
  cs: CSSStyleDeclaration,
  rect: DOMRect,
  origin: DOMRect
): ShapeNode | null {
  const bg = readBackgroundColor(cs);
  const border = readBorder(cs);
  const boxShadow = readBoxShadow(cs);
  const opacity = readOpacity(cs);
  if (!bg && !border && !boxShadow && opacity === undefined) return null;

  return freezeShape({
    type: 'block',
    x: Math.round(rect.left - origin.left),
    y: Math.round(rect.top - origin.top),
    w: Math.round(rect.width),
    h: Math.round(rect.height),
    radius: parseFloat(cs.borderRadius) || 0,
    bg,
    border,
    boxShadow,
    opacity,
  });
}

function elementToShape(
  el: Element,
  tag: string,
  cs: CSSStyleDeclaration,
  rect: DOMRect,
  origin: DOMRect,
  hasText: boolean
): ShapeNode | null {
  const x = Math.round(rect.left - origin.left);
  const y = Math.round(rect.top - origin.top);
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);

  const radius = parseFloat(cs.borderRadius) || 0;
  const minDim = Math.min(w, h);
  const isCircle = radius >= minDim / 2 - 1 && Math.abs(w - h) <= 2 && minDim > 0;

  let type: ShapeNodeType;
  let resolvedRadius = radius;
  let lines: number | undefined;
  let lineHeight: number | undefined;
  let textRects: TextLineRect[] | undefined;
  let textAlign: ShapeNode['textAlign'];

  if (tag === 'IMG' || tag === 'SVG' || tag === 'VIDEO' || tag === 'CANVAS') {
    type = 'image';
  } else if (isCircle) {
    type = 'circle';
    resolvedRadius = Math.floor(minDim / 2);
  } else if (hasText) {
    type = 'text';
    lineHeight = Math.round(parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 || 16);
    lines = Math.max(1, Math.round(h / lineHeight));
    resolvedRadius = Math.min(radius, 4);
    textAlign = readTextAlign(cs);
    textRects = measureTextRects(el, origin);
  } else {
    type = 'block';
  }

  /* Style detectors — captured for every leaf so the replay carries the actual
   * fill / border / shadow / opacity from the real DOM. Each captured value is
   * "non-default": skip transparent backgrounds, zero-width borders, "none"
   * shadows, opacity≥1 — so the persisted payload stays small. */
  const bg = readBackgroundColor(cs);
  const border = readBorder(cs);
  const boxShadow = readBoxShadow(cs);
  const opacity = readOpacity(cs);

  return freezeShape({
    type,
    x,
    y,
    w,
    h,
    radius: resolvedRadius,
    lines,
    lineHeight,
    textRects,
    bg,
    border,
    boxShadow,
    opacity,
    textAlign,
  });
}

/**
 * Per-line text rects via `Range.getClientRects()`. Returns one rect per visual
 * line of rendered text — exact left/width for each line so wrapped paragraphs,
 * RTL last-line position, centered headings all replay 1:1 without heuristics.
 * Returns `undefined` if the element has no direct text content or the Range
 * API isn't usable in this environment.
 */
function measureTextRects(el: Element, origin: DOMRect): TextLineRect[] | undefined {
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
  /* De-duplicate rects that share the same baseline AND actually touch
   * horizontally. Two inline spans on the same line emit two rects with
   * identical y/h whose x ranges abut; merging them gives one bar that
   * spans the whole rendered line. Two rects with the same y/h on
   * different visual lines (rare, but possible with float-into-paragraph
   * layouts) won't touch horizontally, so they stay separate.
   *
   * We keep zero-width rects out (they're real but invisible — collapsed
   * whitespace at line breaks), but we don't filter sub-pixel `width`/
   * `height` — those are legitimate (1-glyph symbol, etc). */
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
    /* Touching = `gap` between the trailing edge of `last` and the leading
     * edge of `lr` is at most 2 px (one rounding slack on each end). */
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

const TRANSPARENT_RE = /^(transparent|rgba?\([^)]*,\s*0(\.0+)?\s*\)|hsla?\([^)]*,\s*0%?\s*\))$/i;

function readBackgroundColor(cs: CSSStyleDeclaration): string | undefined {
  const bg = cs.backgroundColor;
  if (!bg || TRANSPARENT_RE.test(bg)) return undefined;
  return bg;
}

function readBorder(cs: CSSStyleDeclaration): string | undefined {
  /* Treat the top border as representative — uniform borders are the common case.
   * Skip 0-width and `none` style. */
  const width = parseFloat(cs.borderTopWidth) || 0;
  if (width < 0.5) return undefined;
  const style = cs.borderTopStyle;
  if (!style || style === 'none' || style === 'hidden') return undefined;
  const color = cs.borderTopColor;
  if (!color || TRANSPARENT_RE.test(color)) return undefined;
  return `${Math.round(width)}px ${style} ${color}`;
}

function readBoxShadow(cs: CSSStyleDeclaration): string | undefined {
  const sh = cs.boxShadow;
  if (!sh || sh === 'none') return undefined;
  return sh;
}

function readOpacity(cs: CSSStyleDeclaration): number | undefined {
  const o = parseFloat(cs.opacity);
  if (!Number.isFinite(o) || o >= 1) return undefined;
  if (o <= 0) return undefined; /* fully transparent — caller already skipped these */
  return Math.round(o * 100) / 100;
}

function readTextAlign(cs: CSSStyleDeclaration): ShapeNode['textAlign'] {
  const ta = cs.textAlign as ShapeNode['textAlign'] | undefined;
  if (!ta) return undefined;
  if (
    ta === 'left' ||
    ta === 'right' ||
    ta === 'center' ||
    ta === 'justify' ||
    ta === 'start' ||
    ta === 'end'
  ) {
    return ta;
  }
  return undefined;
}

/**
 * Pre-compute (and freeze) the inline styles used at render time. Doing it once
 * here means rendering 500 blocks doesn't allocate 500 style objects per frame.
 *
 * Captured visual signals (bg, border, shadow, opacity) are merged into the
 * frozen style so the replay carries the real DOM's surface — a white button
 * stays white, a ring-bordered button keeps its ring, a shadowed card keeps
 * its elevation.
 */
function freezeShape(node: {
  type: ShapeNodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  lines?: number;
  lineHeight?: number;
  textRects?: TextLineRect[];
  bg?: string;
  border?: string;
  boxShadow?: string;
  opacity?: number;
  textAlign?: ShapeNode['textAlign'];
}): ShapeNode {
  const baseStyle: CSSProperties = {
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.w}px`,
    height: `${node.h}px`,
    borderRadius: `${node.radius}px`,
  };
  applyVisualSignals(baseStyle, node);
  const style = Object.freeze(baseStyle);

  let lineStyles: ReadonlyArray<Readonly<CSSProperties>> | undefined;

  /* Range-based per-line capture — exact rendered geometry, no heuristics.
   * Bars sit at the exact captured rect; no shrink/centre math, so dense
   * paragraphs don't accumulate baseline drift. */
  if (node.type === 'text' && node.textRects && node.textRects.length > 0) {
    const radiusStr = `${node.radius}px`;
    const arr: Readonly<CSSProperties>[] = [];
    for (const r of node.textRects) {
      const lineStyle: CSSProperties = {
        left: `${r.x}px`,
        top: `${r.y}px`,
        width: `${r.w}px`,
        height: `${r.h}px`,
        borderRadius: radiusStr,
      };
      applyVisualSignals(lineStyle, node);
      arr.push(Object.freeze(lineStyle));
    }
    lineStyles = Object.freeze(arr);
  } else if (node.type === 'text' && node.lines && node.lines > 1) {
    /* Fallback path (kept for shapes rehydrated from pre-2 captures): synthesize
     * lines from `lines` + `lineHeight`. */
    const lh = node.lineHeight ?? Math.round(node.h / node.lines);
    const barHeight = Math.max(8, Math.round(lh * 0.7));
    const widthFull = node.w;
    const widthLast = Math.max(40, Math.round(node.w * 0.7));
    const heightStr = `${barHeight}px`;
    const radiusStr = `${node.radius}px`;
    const arr: Readonly<CSSProperties>[] = [];
    for (let i = 1; i <= node.lines; i++) {
      const isLast = i === node.lines;
      const lineWidth = isLast ? widthLast : widthFull;
      /* Honour captured text-align so the short last line lands where the eye
       * expects: right for RTL, centered for centered headings. */
      let leftX = node.x;
      if (isLast && node.textAlign) {
        const slack = widthFull - lineWidth;
        if (node.textAlign === 'center') leftX = node.x + Math.round(slack / 2);
        else if (node.textAlign === 'right' || node.textAlign === 'end') leftX = node.x + slack;
      }
      const lineStyle: CSSProperties = {
        left: `${leftX}px`,
        top: `${node.y + (i - 1) * lh}px`,
        width: `${lineWidth}px`,
        height: heightStr,
        borderRadius: radiusStr,
      };
      applyVisualSignals(lineStyle, node);
      arr.push(Object.freeze(lineStyle));
    }
    lineStyles = Object.freeze(arr);
  }

  return Object.freeze({
    type: node.type,
    x: node.x,
    y: node.y,
    w: node.w,
    h: node.h,
    radius: node.radius,
    lines: node.lines,
    lineHeight: node.lineHeight,
    textRects: node.textRects ? Object.freeze(node.textRects) : undefined,
    bg: node.bg,
    border: node.border,
    boxShadow: node.boxShadow,
    opacity: node.opacity,
    textAlign: node.textAlign,
    style,
    lineStyles,
  });
}

/**
 * Merge captured surface signals into a style object in place. Each signal is
 * additive; `bg` uses `background` shorthand so it wipes the default linear
 * gradient on `.a-skel-block` cleanly.
 */
function applyVisualSignals(
  out: CSSProperties,
  node: {
    bg?: string;
    border?: string;
    boxShadow?: string;
    opacity?: number;
  }
): void {
  if (node.bg) {
    /* Use `background` (shorthand) so the default `background-image` gradient
     * from `.a-skel-block` is overridden, not stacked. */
    out.background = node.bg;
  }
  if (node.border) {
    out.border = node.border;
  }
  if (node.boxShadow) {
    out.boxShadow = node.boxShadow;
  }
  if (node.opacity !== undefined) {
    out.opacity = node.opacity;
  }
}
