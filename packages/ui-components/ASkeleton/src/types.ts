import type { CSSProperties, HTMLAttributes } from 'vue';

export type ShapeNodeType = 'block' | 'text' | 'image' | 'circle';

/** A single per-line text rect captured via the `Range` API — root-relative. */
export interface TextLineRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A single shimmer block in a captured skeleton — positioned absolutely inside the layer. */
export interface ShapeNode {
  type: ShapeNodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  /** For multi-line text leaves, how many lines to render. */
  lines?: number;
  /** Line-height used when expanding `lines` into stacked bars. */
  lineHeight?: number;
  /**
   * Per-line text rects captured via `Range.getClientRects()` — when present, each
   * rendered text line gets its own bar at the exact position and width of the
   * actual rendered text, so wrapped/centered/RTL/short-last-line all replay correctly
   * without heuristics. Supersedes `lines` + `lineHeight` for text nodes.
   */
  textRects?: ReadonlyArray<TextLineRect>;
  /** Background colour captured via `getComputedStyle()` — applied inline so e.g. a white button stays white. */
  bg?: string;
  /** Shorthand border (`"<width>px solid <color>"`) — captured when the element has a visible border. */
  border?: string;
  /** Box-shadow captured verbatim when non-trivial — preserves elevation on cards. */
  boxShadow?: string;
  /** Element opacity when < 1 — captured so semi-transparent surfaces replay correctly. */
  opacity?: number;
  /** Resolved `text-align` (only meaningful for `type='text'`). */
  textAlign?: 'left' | 'right' | 'center' | 'justify' | 'start' | 'end';
  /**
   * Pre-computed (and frozen) inline style for the block. Built once during
   * capture so the render path never allocates a style object per node per
   * render — meaningful when a cache has hundreds of nodes.
   */
  style?: Readonly<CSSProperties>;
  /**
   * Pre-computed line styles for multi-line text. `lines` long when set. Same
   * reason as `style`: avoids `textLineStyle(node, i)` calls in the template.
   */
  lineStyles?: ReadonlyArray<Readonly<CSSProperties>>;
}

export interface CachedShape {
  nodes: ReadonlyArray<ShapeNode>;
  width: number;
  height: number;
  /** Was the walk cut short by `maxNodes`? Surface so consumers can tune the budget. */
  truncated?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Structural skeleton — tree-shaped capture used by Recipe 3
 * (`useSkeleton()` + `<ASkeletonLayer>`).
 *
 * Differs from `CachedShape` in two ways: the output is a *tree* rather than a
 * flat list, and each container preserves its original `class` + a captured
 * subset of layout-affecting CSS so the skeleton flows through the real DOM's
 * flex/grid/spacing rules instead of being absolutely positioned to fixed
 * coordinates.
 *
 * Leaves carry their own width/height/border-radius + visual signals inline
 * and render as `<div class="a-skel">` placeholders that sit in whatever space
 * their parent's layout reserves for them.
 * ───────────────────────────────────────────────────────────────────────────── */

/** Per-line text rect on a text leaf — coordinates are leaf-relative. */
export interface StructuralTextLineRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StructuralNode = ContainerNode | LeafNode;

export interface ContainerNode {
  kind: 'container';
  /** Lowercased tag — preserved so semantic CSS / a11y still applies. */
  tag: string;
  /** Original `class` attribute, verbatim. Empty string when the element has no class. */
  className: string;
  /** Captured layout + visual CSS (frozen). Layout props belong on containers; visual signals optional. */
  style: Readonly<CSSProperties>;
  children: ReadonlyArray<StructuralNode>;
}

export type LeafKind = 'block' | 'text' | 'image' | 'media';

export interface LeafNode {
  kind: 'leaf';
  leafKind: LeafKind;
  /** Original `class` attribute of the real element, verbatim. Empty string when absent. */
  className: string;
  /**
   * Captured inline style: width, height, plus the same comprehensive
   * layout + visual capture used on containers (display, margin, padding,
   * border, background, transform, …). Frozen.
   */
  style: Readonly<CSSProperties>;
  /**
   * Per-line rects for text leaves (`leafKind === 'text'`), captured via
   * `Range.getClientRects()`. Coordinates are relative to the leaf's own box,
   * so the renderer can lay them out with `position: absolute` inside a
   * normal-flow text host.
   */
  textLines?: ReadonlyArray<StructuralTextLineRect>;
}

export interface StructuralShape {
  /** Captured root rect — used by consumers for sanity checks; not for replay sizing. */
  width: number;
  height: number;
  nodes: ReadonlyArray<StructuralNode>;
  /** Was the walk cut short by `maxNodes`? */
  truncated: boolean;
  /** ms since epoch — useful for cache invalidation policies. */
  capturedAt: number;
  /** Persisted-shape schema version. Currently 3. */
  v: 3;
}

export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';
export type SkeletonFallback = 'shimmer' | 'block';

export type ASkeletonMode = 'mirror' | 'clone';

export interface ASkeletonProps {
  /** When true, render the captured skeleton (or `fallback` slot) instead of the default slot. */
  loading: boolean;
  /**
   * Rendering strategy. Default `'mirror'`.
   *   - `'mirror'`: walks the slot's vnode tree and preserves every element
   *     with its real class / inline style. Pure-Vue, SSR-safe, no DOM read.
   *   - `'clone'`: mounts the slot off-screen once, takes a comprehensive
   *     `getComputedStyle()` snapshot of every leaf, then replays the
   *     snapshot as positioned divs carrying every captured CSS property.
   *     Pixel-identical to the real render, regardless of styling system
   *     (Tailwind, CSS-in-JS, DaisyUI, computed inline styles). Requires
   *     a DOM (client-side only).
   */
  mode?: ASkeletonMode;
  /**
   * Identifier used to look up + persist the captured shape. Defaults to
   * `"<slot-fingerprint>:<useId()>"` so every `<ASkeleton>` instance gets its
   * own cache slot automatically — two `<ASkeleton><UserCard/></ASkeleton>` on
   * the same page never collide. Pass explicitly when you *want* multiple
   * instances to share a captured shape (e.g. a list of identical cards), or
   * when one instance renders different shapes depending on a prop.
   */
  cacheKey?: string;
  /** Max recursion depth during shape capture. Default 6. */
  maxDepth?: number;
  /**
   * Hard cap on captured / structurally rendered nodes. Hit this and the walk
   * bails out with `truncated: true`. Default 500 — enough for cards, lists,
   * full forms; cut deliberately for screens with hundreds of repeated rows.
   */
  maxNodes?: number;
  /**
   * Skip elements smaller than this many CSS pixels on either axis during
   * capture. Default 4. Filters out hairlines / inline padding shims that
   * inflate the node count without adding visual signal.
   */
  minNodeSize?: number;
  /** Persist captured shapes to `localStorage` so first-visit skeletons survive reloads. Default false. */
  persist?: boolean;
  /** Animation variant applied to skeleton blocks. Default `'shimmer'`. */
  animation?: SkeletonAnimation;
  /** What to render when no cached shape is available yet. Default `'shimmer'`. */
  fallback?: SkeletonFallback;
  /** Class on the outer wrapper. */
  class?: HTMLAttributes['class'];
}

export interface ASkeletonSlots {
  /** The real content. Rendered when `loading` is false; measured to build the skeleton. */
  default?: () => unknown;
  /** Custom UI to render on a cache miss. Defaults to a single shimmer block. */
  fallback?: () => unknown;
}

export interface ASkeletonLayerProps {
  /**
   * Structural shape captured by `useSkeleton()` (Recipe 3) or `walkStructural()`
   * directly. Renders nothing when `undefined`. The layer drops into the
   * consumer's container as a transparent shell — captured containers preserve
   * their tag/class/layout so the skeleton flows naturally inside the
   * surrounding layout rather than being absolutely positioned.
   */
  shape?: StructuralShape;
  /** Animation variant. Default `'shimmer'`. */
  animation?: SkeletonAnimation;
  /** Class on the layer wrapper. */
  class?: HTMLAttributes['class'];
}

export interface ASkeletonBlockProps {
  /** Visual variant. Default `'block'`. */
  type?: ShapeNodeType;
  /** Width as CSS length. Number = pixels. Falls back to whatever the surrounding layout gives. */
  w?: number | string;
  /** Height as CSS length. Number = pixels. */
  h?: number | string;
  /**
   * Border radius as CSS length. Number = pixels. For `type='circle'`, this
   * defaults to `'50%'` if not provided.
   */
  radius?: number | string;
  /** For `type='text'`, render N stacked bars. Last bar is 70% width. Default 1. */
  lines?: number;
  /** Animation variant. Default `'shimmer'`. */
  animation?: SkeletonAnimation;
  /** Class on the root (the single block, or the stack wrapper for multi-line text). */
  class?: HTMLAttributes['class'];
}
