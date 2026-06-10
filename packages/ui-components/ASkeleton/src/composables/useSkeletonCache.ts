import type { CSSProperties } from 'vue';
import type { CachedShape, ShapeNode } from '../types';

const memory = new Map<string, CachedShape>();
const STORAGE_PREFIX = 'a-skeleton:';

/**
 * Lookup a captured shape by key. Reads in-memory first, then `localStorage` if
 * `persist` is enabled. SSR-safe — bypasses `window` access on the server.
 * Rehydrates pre-computed styles for shapes deserialized from older sessions
 * (Object.freeze + style/lineStyles don't survive `JSON.stringify` round-trip).
 */
export function getCached(key: string, persist: boolean): CachedShape | undefined {
  const hit = memory.get(key);
  if (hit) return hit;
  if (!persist || typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CachedShape;
    const rehydrated = rehydrateShape(parsed);
    memory.set(key, rehydrated);
    return rehydrated;
  } catch {
    return undefined;
  }
}

/** Store a captured shape. `persist=true` mirrors to `localStorage`. */
export function setCached(key: string, value: CachedShape, persist: boolean): void {
  memory.set(key, value);
  if (!persist || typeof window === 'undefined') return;
  try {
    /* Only the geometry survives the round-trip; styles get rebuilt on read. */
    const lean = { width: value.width, height: value.height, nodes: leanNodes(value.nodes) };
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(lean));
  } catch {
    /* quota exceeded / disabled storage — silently degrade to in-memory only. */
  }
}

/** Drop a single entry (or all entries when no key). Exposed for tests + manual invalidation. */
export function clearCached(key?: string): void {
  if (!key) {
    memory.clear();
    if (typeof window === 'undefined') return;
    try {
      for (const k of Object.keys(window.localStorage)) {
        if (k.startsWith(STORAGE_PREFIX)) window.localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    return;
  }
  memory.delete(key);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Rebuild `style` + `lineStyles` for nodes that lost them via serialization.
 * Walks the array in-place where possible and freezes the result so the render
 * path stays allocation-free.
 */
function rehydrateShape(shape: CachedShape): CachedShape {
  const nodes = shape.nodes.map((n) => (n.style ? n : freezeNodeStyles(n)));
  return Object.freeze({
    nodes: Object.freeze(nodes),
    width: shape.width,
    height: shape.height,
    truncated: shape.truncated,
  }) as CachedShape;
}

function leanNodes(nodes: ReadonlyArray<ShapeNode>): Partial<ShapeNode>[] {
  /* Strip the (re-derivable) style fields before persisting so the localStorage
   * payload stays small — a 500-node shape would otherwise serialize ~500 frozen
   * style objects redundantly. */
  return nodes.map((n) => ({
    type: n.type,
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    radius: n.radius,
    lines: n.lines,
    lineHeight: n.lineHeight,
  }));
}

function freezeNodeStyles(node: ShapeNode): ShapeNode {
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
