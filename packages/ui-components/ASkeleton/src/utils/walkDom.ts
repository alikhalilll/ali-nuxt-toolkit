import type { CSSProperties } from 'vue';
import type { CachedShape, ShapeNode, ShapeNodeType } from '../types';

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
      const node = elementToShape(tag, cs, rect, rootRect, hasOwnText);
      if (node) nodes.push(node);
      return;
    }

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

function elementToShape(
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
  } else {
    type = 'block';
  }

  return freezeShape({
    type,
    x,
    y,
    w,
    h,
    radius: resolvedRadius,
    lines,
    lineHeight,
  });
}

/**
 * Pre-compute (and freeze) the inline styles used at render time. Doing it once
 * here means rendering 500 blocks doesn't allocate 500 style objects per frame.
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
}): ShapeNode {
  const style: CSSProperties = Object.freeze({
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.w}px`,
    height: `${node.h}px`,
    borderRadius: `${node.radius}px`,
  });

  let lineStyles: ReadonlyArray<Readonly<CSSProperties>> | undefined;
  if (node.type === 'text' && node.lines && node.lines > 1) {
    const lh = node.lineHeight ?? Math.round(node.h / node.lines);
    const barHeight = Math.max(8, Math.round(lh * 0.7));
    const widthFull = `${node.w}px`;
    const widthLast = `${Math.max(40, Math.round(node.w * 0.7))}px`;
    const heightStr = `${barHeight}px`;
    const radiusStr = `${node.radius}px`;
    const arr: Readonly<CSSProperties>[] = [];
    for (let i = 1; i <= node.lines; i++) {
      const isLast = i === node.lines;
      arr.push(
        Object.freeze<CSSProperties>({
          left: `${node.x}px`,
          top: `${node.y + (i - 1) * lh}px`,
          width: isLast ? widthLast : widthFull,
          height: heightStr,
          borderRadius: radiusStr,
        })
      );
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
    style,
    lineStyles,
  });
}
