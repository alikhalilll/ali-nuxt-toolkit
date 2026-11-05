/**
 * Rounded-corner clipping — port of `/measure.ts:28-105`.
 *
 * Needed when a block overflows a parent with `overflow: hidden` +
 * `border-radius`: the block's visible rect is the intersection with the
 * clip, and corners that touch the parent's rounded corner inherit the
 * parent's radius (not the block's own).
 *
 * All functions are pure. The `Clip` type carries both the intersected
 * rect and the per-corner radii; passing it down the walker lets each
 * descendant compute its own clip relative to the parent's.
 */

/** Simple pre-DOMRect rectangle used by the walker. */
export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Four corner radii in px: top-left, top-right, bottom-right, bottom-left. */
export type Corners = [number, number, number, number];

/** A clip is a rect + per-corner radii; `null` means no clipping active. */
export type Clip = (Rect & { corners: Corners }) | null;

export function intersect(clip: Clip, rect: Rect): Rect {
  if (!clip) return rect;
  return {
    left: Math.max(clip.left, rect.left),
    right: Math.min(clip.right, rect.right),
    top: Math.max(clip.top, rect.top),
    bottom: Math.min(clip.bottom, rect.bottom),
  };
}

export function cornersOf(rect: Rect): Array<[number, number]> {
  return [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.right, rect.bottom],
    [rect.left, rect.bottom],
  ];
}

export function near(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1;
}

export function radiiOf(style: CSSStyleDeclaration, rect: Rect): Corners {
  const size = Math.min(rect.right - rect.left, rect.bottom - rect.top);
  const px = (value: string): number =>
    value.endsWith('%') ? (parseFloat(value) / 100) * size : parseFloat(value) || 0;
  return [
    px(style.borderTopLeftRadius),
    px(style.borderTopRightRadius),
    px(style.borderBottomRightRadius),
    px(style.borderBottomLeftRadius),
  ];
}

/**
 * Compose a child clip inside an existing clip. For each corner of the
 * intersected box, pick the radius whose source (the inner box, the outer
 * clip, or neither) owns that corner.
 */
export function clipWithin(clip: Clip, rect: Rect, style: CSSStyleDeclaration): Clip {
  const box = intersect(clip, rect);
  const own = radiiOf(style, rect);
  const outer = clip ? cornersOf(clip) : [];
  const ownCorners = cornersOf(rect);
  const boxCorners = cornersOf(box);
  const corners = boxCorners.map((corner, i) => {
    if (near(corner, ownCorners[i])) return own[i];
    if (clip && near(corner, outer[i])) return clip.corners[i];
    return 0;
  }) as Corners;
  const { left, right, top, bottom } = box;
  return { left, right, top, bottom, corners };
}

/**
 * True when the clipped rect is at least 2×2 (anything smaller is a
 * visually-hidden label — won't be perceived as a block).
 */
export function clipped(rect: Rect, clip: Clip): Rect | null {
  const box = intersect(clip, rect);
  return box.right - box.left >= 2 && box.bottom - box.top >= 2 ? box : null;
}
