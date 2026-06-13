import type { CSSProperties } from 'vue';
import type {
  CachedShape,
  ContainerNode,
  LeafNode,
  ShapeNode,
  StructuralNode,
  StructuralShape,
} from '../types';

const memory = new Map<string, CachedShape>();
const STORAGE_PREFIX = 'a-skeleton:';

/**
 * Schema version for persisted flat `CachedShape` entries. Bump whenever the
 * `ShapeNode` / `CachedShape` field set changes so stale localStorage payloads
 * from older releases get dropped on read instead of rehydrating into a wrong
 * layout.
 *
 * v2 — added advanced surface signals (textRects, bg, border, boxShadow,
 *      opacity, textAlign).
 */
const SCHEMA_VERSION = 2;

/**
 * Separate in-memory + localStorage namespace for the Recipe 3 structural
 * shape (`StructuralShape`, `v: 3`). Kept apart from the flat-shape cache so
 * the two pipelines can't collide on the same `cacheKey` — `<ASkeleton>`'s
 * legacy cache-replay path and Recipe 3 may both run on the same page with
 * the same key.
 */
const structuralMemory = new Map<string, StructuralShape>();
const STRUCTURAL_PREFIX = 'a-skeleton:s:';
const STRUCTURAL_SCHEMA_VERSION = 3 as const;

interface PersistedShape {
  v: number;
  width: number;
  height: number;
  nodes: Partial<ShapeNode>[];
  truncated?: boolean;
}

/**
 * Lookup a captured shape by key. Reads in-memory first, then `localStorage` if
 * `persist` is enabled. SSR-safe — bypasses `window` access on the server.
 * Rehydrates pre-computed styles for shapes deserialized from older sessions
 * (Object.freeze + style/lineStyles don't survive `JSON.stringify` round-trip).
 * Drops the entry if it was written by a different schema version.
 */
export function getCached(key: string, persist: boolean): CachedShape | undefined {
  const hit = memory.get(key);
  if (hit) return hit;
  if (!persist || typeof window === 'undefined') return undefined;
  try {
    const storageKey = STORAGE_PREFIX + key;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    if (parsed.v !== SCHEMA_VERSION) {
      /* Stale payload from a previous release — purge so the next capture
       * writes a fresh entry instead of rehydrating into a wrong layout. */
      window.localStorage.removeItem(storageKey);
      return undefined;
    }
    const rehydrated = rehydrateShape(parsed as PersistedShape);
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
    const lean: PersistedShape = {
      v: SCHEMA_VERSION,
      width: value.width,
      height: value.height,
      nodes: leanNodes(value.nodes),
      truncated: value.truncated,
    };
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(lean));
  } catch {
    /* quota exceeded / disabled storage — silently degrade to in-memory only. */
  }
}

/**
 * Drop a single entry (or all entries when no key) — wipes both the flat-shape
 * and the structural-shape namespaces. Exposed for tests + manual invalidation.
 */
export function clearCached(key?: string): void {
  if (!key) {
    memory.clear();
    structuralMemory.clear();
    if (typeof window === 'undefined') return;
    try {
      /* Use Storage's own length + key(i) iteration — `Object.keys()` on a
       * Storage object isn't reliable across implementations (works in real
       * browsers via the Storage[Symbol.iterator] hack, but strict polyfills
       * return only own enumerable properties). */
      const ls = window.localStorage;
      const stale: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (!k) continue;
        if (k.startsWith(STORAGE_PREFIX) || k.startsWith(STRUCTURAL_PREFIX)) stale.push(k);
      }
      /* Remove in a second pass so we don't shift indices mid-iteration. */
      for (const k of stale) ls.removeItem(k);
    } catch {
      /* ignore */
    }
    return;
  }
  memory.delete(key);
  structuralMemory.delete(key);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
    window.localStorage.removeItem(STRUCTURAL_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Drop a single structural-shape entry (or all when no key). Kept separate
 * from `clearCached` so callers that only manage structural shapes don't have
 * to reach across namespaces.
 */
export function clearCachedStructural(key?: string): void {
  if (!key) {
    structuralMemory.clear();
    if (typeof window === 'undefined') return;
    try {
      const ls = window.localStorage;
      const stale: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(STRUCTURAL_PREFIX)) stale.push(k);
      }
      for (const k of stale) ls.removeItem(k);
    } catch {
      /* ignore */
    }
    return;
  }
  structuralMemory.delete(key);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STRUCTURAL_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Structural-shape cache — backs Recipe 3 (`useSkeleton()` +
 * `<ASkeletonLayer>`). The schema-version check auto-purges stale `v: 2`
 * entries (or any future mismatched version) on read.
 * ───────────────────────────────────────────────────────────────────────────── */

interface PersistedStructuralShape {
  v: typeof STRUCTURAL_SCHEMA_VERSION;
  width: number;
  height: number;
  nodes: StructuralNode[];
  truncated: boolean;
  capturedAt: number;
}

/**
 * Lookup a structural shape by key. Reads in-memory first, then `localStorage`
 * when `persist` is enabled. Stale schema versions get purged on read.
 */
export function getCachedStructural(key: string, persist: boolean): StructuralShape | undefined {
  const hit = structuralMemory.get(key);
  if (hit) return hit;
  if (!persist || typeof window === 'undefined') return undefined;
  try {
    const storageKey = STRUCTURAL_PREFIX + key;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<PersistedStructuralShape>;
    if (parsed.v !== STRUCTURAL_SCHEMA_VERSION) {
      window.localStorage.removeItem(storageKey);
      return undefined;
    }
    const rehydrated = rehydrateStructuralShape(parsed as PersistedStructuralShape);
    structuralMemory.set(key, rehydrated);
    return rehydrated;
  } catch {
    return undefined;
  }
}

/** Store a structural shape. `persist=true` mirrors to `localStorage`. */
export function setCachedStructural(key: string, value: StructuralShape, persist: boolean): void {
  structuralMemory.set(key, value);
  if (!persist || typeof window === 'undefined') return;
  try {
    const payload: PersistedStructuralShape = {
      v: STRUCTURAL_SCHEMA_VERSION,
      width: value.width,
      height: value.height,
      nodes: value.nodes.map(leanStructuralNode),
      truncated: value.truncated,
      capturedAt: value.capturedAt,
    };
    window.localStorage.setItem(STRUCTURAL_PREFIX + key, JSON.stringify(payload));
  } catch {
    /* quota / disabled storage — silently degrade to in-memory only. */
  }
}

/* JSON-stringify drops `undefined`, but `Object.freeze` survives across the
 * round-trip only if we re-freeze after parse. The lean transforms keep
 * payload size predictable (no unexpected enumerable Vue proxies). */
function leanStructuralNode(node: StructuralNode): StructuralNode {
  if (node.kind === 'container') {
    return {
      kind: 'container',
      tag: node.tag,
      className: node.className,
      style: node.style,
      children: node.children.map(leanStructuralNode),
    } as ContainerNode;
  }
  return {
    kind: 'leaf',
    leafKind: node.leafKind,
    className: node.className,
    style: node.style,
    textLines: node.textLines,
  } as LeafNode;
}

function rehydrateStructuralShape(persisted: PersistedStructuralShape): StructuralShape {
  return Object.freeze({
    v: STRUCTURAL_SCHEMA_VERSION,
    width: persisted.width,
    height: persisted.height,
    nodes: Object.freeze(persisted.nodes.map(rehydrateStructuralNode)),
    truncated: persisted.truncated,
    capturedAt: persisted.capturedAt,
  }) as StructuralShape;
}

function rehydrateStructuralNode(node: StructuralNode): StructuralNode {
  if (node.kind === 'container') {
    return Object.freeze({
      kind: 'container',
      tag: node.tag,
      className: node.className,
      style: Object.freeze({ ...node.style }),
      children: Object.freeze(node.children.map(rehydrateStructuralNode)),
    }) as ContainerNode;
  }
  return Object.freeze({
    kind: 'leaf',
    leafKind: node.leafKind,
    className: node.className ?? '',
    style: Object.freeze({ ...node.style }),
    textLines: node.textLines ? Object.freeze([...node.textLines]) : undefined,
  }) as LeafNode;
}

/**
 * Rebuild `style` + `lineStyles` for nodes that lost them via serialization.
 * Walks the array in-place where possible and freezes the result so the render
 * path stays allocation-free.
 */
function rehydrateShape(shape: PersistedShape): CachedShape {
  const nodes = shape.nodes.map((n) => freezeNodeStyles(n as ShapeNode));
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
    textRects: n.textRects
      ? n.textRects.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }))
      : undefined,
    bg: n.bg,
    border: n.border,
    boxShadow: n.boxShadow,
    opacity: n.opacity,
    textAlign: n.textAlign,
  }));
}

function freezeNodeStyles(node: ShapeNode): ShapeNode {
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

function applyVisualSignals(
  out: CSSProperties,
  node: { bg?: string; border?: string; boxShadow?: string; opacity?: number }
): void {
  if (node.bg) out.background = node.bg;
  if (node.border) out.border = node.border;
  if (node.boxShadow) out.boxShadow = node.boxShadow;
  if (node.opacity !== undefined) out.opacity = node.opacity;
}
