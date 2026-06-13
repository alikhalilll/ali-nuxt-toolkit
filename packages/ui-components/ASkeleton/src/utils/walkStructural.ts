/**
 * `walkStructural` — tree-shaped DOM capture for Recipe 3
 * (`useSkeleton()` + `<ASkeletonLayer>`).
 *
 * Walks the rendered DOM top-down once. Every element is classified as either:
 *
 *   - **container** — has element children. Output preserves its tag + original
 *     `class` + a comprehensive capture of layout + visual CSS. Children
 *     recurse via the same walker. The result *flows* through the consumer's
 *     own layout rules instead of being absolutely positioned to fixed
 *     coordinates, so the skeleton stays correct when the viewport / parent
 *     reflows.
 *   - **leaf-{block, text, image, media}** — atomic or childless element.
 *     Output is a `<div class="a-skel">` with captured `width`, `height`,
 *     plus the **same** layout + visual capture used for containers. No
 *     `position: absolute` — the leaf sits inside whatever space its parent
 *     reserves for it. Original class is preserved so utility-first CSS
 *     (`mt-4`, `flex-1`, `inline-block`, …) survives.
 *
 * Generic property set — containers and leaves use one shared list
 * (`LAYOUT_PROPS` + `VISUAL_PROPS`). This mirrors clone-mode's design: every
 * captured node carries the same layout context, so any element type (flex
 * item, inline-block, positioned overlay, sticky bar) renders correctly
 * without bespoke per-kind logic. The only leaf-specific transform is
 * normalising `display: inline` → `inline-block`, since width / height don't
 * apply to inline boxes.
 *
 * Performance: all `getBoundingClientRect()` + `getComputedStyle()` reads
 * happen in a single top-down pass with no intervening writes, so the browser
 * does one layout up front and serves cached values from then on (no layout
 * thrashing). Same `maxDepth` / `maxNodes` / `minSize` budget as `walkDom` and
 * `captureSnapshot`.
 */
import type { CSSProperties } from 'vue';
import type {
  ContainerNode,
  LeafKind,
  LeafNode,
  StructuralNode,
  StructuralShape,
  StructuralTextLineRect,
} from '../types';
import {
  captureTextLines,
  collectVisibleChildren,
  hasDirectText,
  readComputedStyles,
} from './domRead';

export interface WalkStructuralOptions {
  /** Max recursion depth. Default 12. */
  maxDepth?: number;
  /** Hard cap on captured nodes. Default 500. */
  maxNodes?: number;
  /** Skip elements smaller than this many CSS pixels (either axis). Default 4. */
  minSize?: number;
}

const DEFAULT_MAX_DEPTH = 12;
const DEFAULT_MAX_NODES = 500;
const DEFAULT_MIN_SIZE = 4;

/** Tags treated as atomic leaves — never recursed into, rendered as one block. */
const ATOMIC_TAGS: ReadonlySet<string> = new Set([
  'img',
  'picture',
  'svg',
  'canvas',
  'video',
  'audio',
  'input',
  'textarea',
  'select',
  'button',
  'progress',
  'meter',
  'hr',
  'iframe',
  'object',
  'embed',
  'br',
]);

/**
 * Tags whose content is conventionally text. When the author writes
 * `<h3>{{ data?.name }}</h3>` and `data` is null during loading, the
 * interpolation is empty and `hasDirectText` returns false — without this
 * fallback the element classifies as `leaf-block` (a generic shimmer rect)
 * instead of `leaf-text` (a shimmer text bar at the element's natural
 * rendered dimensions).
 */
const TEXT_OWNERS: ReadonlySet<string> = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
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
 * Layout-affecting CSS captured on **every** node. Includes display + box
 * model + flex + grid + positioning so any element type renders correctly
 * regardless of its role in the parent's layout (flex item, inline-block,
 * absolutely-positioned overlay, sticky bar, grid cell).
 *
 * Width / height are intentionally NOT here — containers get sized by their
 * children; leaves get explicit width / height from their `getBoundingClientRect`
 * in `emitLeaf` below.
 */
const LAYOUT_PROPS: ReadonlyArray<string> = [
  /* Box model & flow. */
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'vertical-align',
  'float',
  'clear',
  'box-sizing',

  /* Margins (outer-box spacing — survives the structural layout). */
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',

  /* Padding (inner inset — matters for containers carrying their own surface). */
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',

  /* Flex — both as a container AND as an item (align-self, justify-self, flex). */
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'justify-content',
  'align-items',
  'align-content',
  'align-self',
  'justify-self',
  'gap',
  'row-gap',
  'column-gap',
  'order',

  /* Grid — both as a container AND as a cell. */
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-auto-flow',
  'grid-auto-columns',
  'grid-auto-rows',
  'grid-column',
  'grid-row',
  'grid-area',
];

/**
 * Visual signals captured on **every** node. These give each rendered
 * placeholder the same surface identity the real element had — fill,
 * outline, elevation, transparency, transforms.
 */
const VISUAL_PROPS: ReadonlyArray<string> = [
  /* Borders per edge — non-uniform borders (e.g. `border-b`) survive. */
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
];

const ALL_PROPS: ReadonlyArray<string> = [...LAYOUT_PROPS, ...VISUAL_PROPS];

/**
 * Walk `root`'s descendants and produce a frozen tree-shaped capture.
 * Direct children of `root` become top-level `nodes`; recursive children
 * live on their respective `ContainerNode`s.
 */
export function walkStructural(
  root: HTMLElement,
  options: WalkStructuralOptions = {}
): StructuralShape {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const minSize = options.minSize ?? DEFAULT_MIN_SIZE;

  const rootRect = root.getBoundingClientRect();
  const state = { count: 0, truncated: false };
  const ctx: InternalCtx = { maxDepth, maxNodes, minSize, state };

  const nodes: StructuralNode[] = [];
  for (let i = 0; i < root.children.length; i++) {
    if (state.count >= maxNodes) {
      state.truncated = true;
      break;
    }
    const node = capture(root.children[i] as HTMLElement, rootRect, 1, ctx);
    if (node) nodes.push(node);
  }

  return Object.freeze({
    width: Math.round(rootRect.width),
    height: Math.round(rootRect.height),
    nodes: Object.freeze(nodes),
    truncated: state.truncated,
    capturedAt: Date.now(),
    v: 3,
  }) as StructuralShape;
}

interface InternalCtx {
  maxDepth: number;
  maxNodes: number;
  minSize: number;
  state: { count: number; truncated: boolean };
}

function capture(
  el: HTMLElement,
  origin: DOMRect,
  depth: number,
  ctx: InternalCtx
): StructuralNode | null {
  if (ctx.state.count >= ctx.maxNodes) {
    ctx.state.truncated = true;
    return null;
  }
  if (el.dataset?.skeletonIgnore !== undefined) return null;

  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null;
  const opacity = parseFloat(cs.opacity);
  if (Number.isFinite(opacity) && opacity === 0) return null;

  const rect = el.getBoundingClientRect();
  const tag = el.tagName.toLowerCase();
  const isTextOwner = TEXT_OWNERS.has(tag);

  /* Text-owner tags can have zero height when their interpolation is empty
   * (`<h3>{{ data?.name }}</h3>` with null data). For those, synthesize a
   * height from line-height / font-size so the heading still shimmers at its
   * natural rendered height instead of being filtered as sub-minSize. */
  let effectiveHeight = rect.height;
  if (isTextOwner && effectiveHeight < ctx.minSize) {
    const lh = parseFloat(cs.lineHeight);
    const fs = parseFloat(cs.fontSize);
    if (Number.isFinite(lh) && lh > 0) effectiveHeight = lh;
    else if (Number.isFinite(fs) && fs > 0) effectiveHeight = fs * 1.4;
  }

  if (rect.width < ctx.minSize || effectiveHeight < ctx.minSize) return null;

  const hasStop = el.dataset?.skeletonStop !== undefined;
  const isAtomic = ATOMIC_TAGS.has(tag);
  const reachedDepth = depth >= ctx.maxDepth;
  const childrenEls = collectVisibleChildren(el);

  /* Classification — order matters: stop > atomic > childless > container. */
  if (hasStop || isAtomic || reachedDepth || childrenEls.length === 0) {
    return emitLeaf(el, tag, cs, rect, effectiveHeight, isAtomic, ctx);
  }

  /* Container path — recurse into children first; if every child was
   * filtered (sub-minSize, hidden, …) we demote this node to a leaf so the
   * container's own visual surface still renders. */
  const children: StructuralNode[] = [];
  for (const child of childrenEls) {
    if (ctx.state.count >= ctx.maxNodes) {
      ctx.state.truncated = true;
      break;
    }
    const node = capture(child, origin, depth + 1, ctx);
    if (node) children.push(node);
  }

  if (children.length === 0) {
    return emitLeaf(el, tag, cs, rect, effectiveHeight, /* isAtomic */ false, ctx);
  }

  ctx.state.count++;
  const node: ContainerNode = {
    kind: 'container',
    tag,
    className: el.getAttribute('class') ?? '',
    style: readComputedStyles(cs, ALL_PROPS),
    children: Object.freeze(children),
  };
  return Object.freeze(node);
}

function emitLeaf(
  el: HTMLElement,
  tag: string,
  cs: CSSStyleDeclaration,
  rect: DOMRect,
  effectiveHeight: number,
  isAtomic: boolean,
  ctx: InternalCtx
): LeafNode | null {
  const w = Math.round(rect.width);
  const h = Math.round(effectiveHeight);

  const leafKind = classifyLeaf(tag, el, isAtomic);

  /* Same comprehensive capture used for containers, plus width/height inlined
   * from the rect so the placeholder claims the right space in its parent's
   * layout. Captured `display: inline` is upgraded to `inline-block` — inline
   * boxes ignore width/height, and we need both to take effect on the div
   * placeholder. */
  const captured: Record<string, string> = { ...readComputedStyles(cs, ALL_PROPS) };
  if (captured.display === 'inline') captured.display = 'inline-block';

  const style: CSSProperties = {
    ...captured,
    width: `${w}px`,
    height: `${h}px`,
  };

  let textLines: ReadonlyArray<StructuralTextLineRect> | undefined;
  if (leafKind === 'text') {
    const rawLines = captureTextLines(el, rect);
    if (rawLines && rawLines.length > 0) {
      /* `captureTextLines` returns origin-relative rects — here the origin
       * *is* the leaf box, so each rect's coordinates are already box-local.
       * Clamp to non-negative so sub-pixel rounding can't sneak a negative
       * `left` into the rendered style. */
      textLines = Object.freeze(
        rawLines.map((r) => ({
          x: Math.max(0, r.x),
          y: Math.max(0, r.y),
          w: r.w,
          h: r.h,
        }))
      );
    }
  }

  ctx.state.count++;
  const node: LeafNode = {
    kind: 'leaf',
    leafKind,
    className: el.getAttribute('class') ?? '',
    style: Object.freeze(style),
    textLines,
  };
  return Object.freeze(node);
}

function classifyLeaf(tag: string, el: HTMLElement, isAtomic: boolean): LeafKind {
  if (tag === 'img' || tag === 'picture') return 'image';
  if (tag === 'video') return 'image'; /* play-icon decorated via the renderer */
  if (isAtomic) return 'media';
  if (hasDirectText(el)) return 'text';
  /* Empty text-owner (`<p>{{ data?.price }}</p>` with null data) — classify
   * as text so the renderer falls back to a full-box bar instead of a
   * generic shimmer block. */
  if (TEXT_OWNERS.has(tag)) return 'text';
  return 'block';
}
