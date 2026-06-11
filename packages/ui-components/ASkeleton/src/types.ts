import type { CSSProperties, HTMLAttributes } from 'vue';

export type ShapeNodeType = 'block' | 'text' | 'image' | 'circle';

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

export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';
export type SkeletonFallback = 'shimmer' | 'block';

export interface ASkeletonProps {
  /** When true, render the captured skeleton (or `fallback` slot) instead of the default slot. */
  loading: boolean;
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
  /** Shape captured by `walkDom` / `useSkeleton`. Renders nothing when undefined. */
  shape?: CachedShape;
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
