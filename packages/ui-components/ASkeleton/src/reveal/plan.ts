/**
 * Reveal planner — decides how a loading pane transitions to a content pane.
 *
 * Scoped port of `/plan.ts`. Four built-in modes:
 *
 *   - `instant`  — resolve immediately, no fade.
 *   - `together` — one global crossfade (all pieces fade together).
 *   - `sequence` — top-to-bottom cascade, per-piece delay by `byRow`.
 *   - `smart`    — the context-aware default. Picks `instant` for fast
 *                   loads or users mid-gesture, `together` for small reveals
 *                   or refetches, `sequence` otherwise.
 *
 * Not included: the `sweep` mode (diagonal wipe with SVG gloss
 * filter + shared wave front). It's visually niche, frame-drop sensitive,
 * and takes a 300-line implementation. Deferred to a follow-up — `smart`
 * falls back to `byContent → byRow` when the heuristic would have chosen
 * sweep.
 *
 * This module is pure except for the `lastInput` watcher — a module-level
 * timestamp of the most recent `wheel`/`touchmove`/`keydown` is maintained
 * so `quickly()` can tell whether the user is mid-gesture (in which case
 * sequencing would feel sluggish). The listener attaches once per runtime.
 */

/** How content replaces its skeleton. */
export type RevealMode = 'instant' | 'together' | 'sequence' | 'smart';

/** One piece of a reveal: a leaf element with text or media. */
export interface Piece {
  rect: DOMRect;
  /** The row/card the piece belongs to; null when the piece has no obvious unit. */
  unit: DOMRect | null;
  /** True when the piece's font-size is smaller than the unit's maximum. */
  secondary: boolean;
  /** The whole reveal's bounding box. */
  reveal: DOMRect;
  /** ms since the first of the reveals that landed in this batch. */
  late: number;
}

/** Context passed to `planReveal` — everything the planner needs to decide. */
export interface RevealContext {
  content: HTMLElement;
  reveal: HTMLElement;
  /** ms the skeleton was up before content arrived; Infinity for SSR / no skeleton. */
  waited: number;
  /** User interacted (wheel/touch/keydown) within the last `ACTIVE_WINDOW` ms. */
  input: boolean;
  /** True if the skeleton was drawn from the real `data` on screen (refetch case). */
  refetch: boolean;
  /** `content.getBoundingClientRect().height`. */
  height: number;
  /** Number of leaf pieces the content arrives in. */
  pieces: number;
}

/** The resolved plan — a tagged union, dispatched on by the applier. */
export type Plan =
  | { kind: 'instant' }
  | { kind: 'together'; delay: number; duration: number }
  | {
      kind: 'sequence';
      pieceDelay: (piece: Element) => number | null;
      boneDelay: (rect: DOMRect) => number | null;
      duration: number;
    };

/** ─── Constants (match the upstream library's lib/plan.ts) ──────────────────────────── */
export const SKELETON_DELAY = 150;
export const QUICK_FADE = 120;
export const SMALL_HEIGHT = 72;
export const SMALL_PIECES = 3;
export const SECONDARY_DELAY = 60;
export const BATCH_WINDOW = 150;
export const ACTIVE_WINDOW = 400;
export const CASCADE_SPREAD = 320;
export const FADE_DURATION = 200;
export const MAX_DELAY = 1000;
export const MAX_DURATION = 1000;

/** ─── Input-recency watcher ─────────────────────────────────────────────── */
let lastInput = -Infinity;
let listening = false;
function listen(): void {
  if (listening || typeof window === 'undefined' || typeof addEventListener === 'undefined') {
    return;
  }
  listening = true;
  const stamp = () => {
    lastInput = performance.now();
  };
  for (const type of ['wheel', 'touchmove', 'keydown']) {
    addEventListener(type, stamp, { passive: true, capture: true });
  }
}

/** ─── Skeleton-up tracker ───────────────────────────────────────────────── */
const skeletonUp = new WeakMap<Element, { since: number; refetch: boolean }>();

/**
 * Record that a skeleton has gone up in `reveal`. Called from the applier's
 * fadeIn path. `since: -Infinity` for SSR skeletons so they never show a
 * flash (hold durations drop to zero when `waited` is already huge).
 */
export function noteSkeleton(
  reveal: Element,
  { served = false, refetch = false }: { served?: boolean; refetch?: boolean } = {}
): void {
  listen();
  const existing = skeletonUp.get(reveal);
  const since = existing?.since ?? performance.now();
  skeletonUp.set(reveal, { since: served ? -Infinity : since, refetch });
}

/** ─── Piece + unit discovery ─────────────────────────────────────────────── */

const TEXT_HOLDERS: ReadonlySet<string> = new Set([
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
  'li',
  'label',
  'th',
  'td',
  'figcaption',
  'blockquote',
]);
const MEDIA_TAGS: ReadonlySet<string> = new Set([
  'img',
  'picture',
  'video',
  'canvas',
  'svg',
  'iframe',
]);

/** True when `el` carries its own text (not just whitespace). */
function hasOwnText(el: Element): boolean {
  for (let i = 0; i < el.childNodes.length; i++) {
    const n = el.childNodes[i];
    if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0) return true;
  }
  return false;
}

/**
 * Recursively find the leaves of `root` that carry text or media — the
 * atoms a reveal animates in. Matches the upstream library's `pieces()` (ll. 148-164).
 */
export function pieces(root: Element): Element[] {
  const out: Element[] = [];
  const visit = (el: Element): void => {
    const tag = el.tagName.toLowerCase();
    if (MEDIA_TAGS.has(tag)) {
      out.push(el);
      return;
    }
    if (TEXT_HOLDERS.has(tag) && hasOwnText(el)) {
      out.push(el);
      return;
    }
    if (el.children.length === 0) {
      if (hasOwnText(el)) out.push(el);
      return;
    }
    for (let i = 0; i < el.children.length; i++) visit(el.children[i]);
  };
  for (let i = 0; i < root.children.length; i++) visit(root.children[i]);
  return out;
}

/**
 * The row/card a piece belongs to. Looks up ancestors; the first with
 * ≥3 siblings of the same tag + class signature counts as a "unit".
 * Falls back to the piece itself when no such ancestor exists.
 *
 * Mirrors the upstream library's `unitOf()` (`the upstream library/plan.ts:167-183`).
 */
export function unitOf(piece: Element, root: Element): Element {
  let cursor: Element | null = piece.parentElement;
  while (cursor && cursor !== root) {
    const parent: Element | null = cursor.parentElement;
    if (!parent) break;
    const tag = cursor.tagName;
    const cls = cursor.className;
    let same = 0;
    for (let i = 0; i < parent.children.length; i++) {
      const sib = parent.children[i];
      if (sib.tagName === tag && sib.className === cls) same++;
      if (same >= 3) break;
    }
    if (same >= 3) return cursor;
    cursor = parent;
  }
  return piece;
}

/** ─── Strategy functions (byPosition, byRow, byContent, quickly) ────────── */

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Delay as a function of piece position (vertical 80%, horizontal 20%),
 * scaled by `CASCADE_SPREAD`. Matches the upstream library's `byPosition()`
 * (ll. 353-357).
 */
export function byPosition(piece: Piece): number {
  const across = clamp01(piece.rect.left / Math.max(piece.reveal.width, 1));
  const down = clamp01((piece.rect.top - piece.reveal.top) / Math.max(piece.reveal.height, 1));
  return clamp01(down * 0.8 + across * 0.2) * CASCADE_SPREAD;
}

/**
 * Top-to-bottom only, visible-portion only. Secondary text (smaller font
 * than the unit's max) is delayed by `SECONDARY_DELAY`. Matches the upstream library's
 * `byRow()` (ll. 362-368).
 */
export function byRow(piece: Piece): number | null {
  const vh = typeof window !== 'undefined' ? window.innerHeight : piece.reveal.height;
  const unitTop = piece.unit ? piece.unit.top : piece.rect.top;
  if (unitTop < 0 || unitTop > vh) return 0;
  const normalised = clamp01(unitTop / Math.max(vh, 1));
  const base = normalised * CASCADE_SPREAD - piece.late;
  const delay = Math.max(base, 0) + (piece.secondary ? SECONDARY_DELAY : 0);
  return Math.min(delay, MAX_DELAY);
}

/**
 * Short-circuit: input-active OR skeleton-barely-up → instant.
 * Refetch → quick `together`. Otherwise null (fall through to byContent).
 * Matches the upstream library's `quickly()` (ll. 375-380).
 */
export function quickly(ctx: RevealContext): Plan | null {
  if (ctx.input || ctx.waited < SKELETON_DELAY) return { kind: 'instant' };
  if (ctx.refetch) return { kind: 'together', delay: 0, duration: QUICK_FADE };
  return null;
}

/**
 * Small reveals → `together`. Larger → `sequence` via byRow.
 * Matches the upstream library's `byContent()` (ll. 383-386).
 */
export function byContent(ctx: RevealContext): Plan {
  if (ctx.height < SMALL_HEIGHT || ctx.pieces <= SMALL_PIECES) {
    return { kind: 'together', delay: 0, duration: FADE_DURATION };
  }
  return sequencePlan(ctx, byRow);
}

/**
 * Produce a sequence plan from a per-piece delay function. The piece delay
 * is computed up-front for each piece in the content; the bone delay is
 * computed by matching each bone's rect to the nearest piece (so skeleton
 * bones exit in the same order their content pieces enter).
 */
function sequencePlan(ctx: RevealContext, order: (p: Piece) => number | null): Plan {
  const found = pieces(ctx.content);
  const revealRect = ctx.reveal.getBoundingClientRect();
  const unitRects = new Map<Element, DOMRect>();
  const pieceInfos: Array<{ el: Element; piece: Piece; delay: number | null }> = [];

  /* Pass 1: compute piece rects + their units. */
  const infos: Array<{ el: Element; unit: Element; rect: DOMRect; fontSize: number }> = [];
  for (const el of found) {
    const unit = unitOf(el, ctx.content);
    let unitRect = unitRects.get(unit);
    if (!unitRect) {
      unitRect = unit.getBoundingClientRect();
      unitRects.set(unit, unitRect);
    }
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize) || 16;
    infos.push({ el, unit, rect, fontSize });
  }

  /* Pass 2: resolve secondary = font-size < unit's max font-size. */
  const unitMaxFont = new Map<Element, number>();
  for (const { unit, fontSize } of infos) {
    const current = unitMaxFont.get(unit) ?? 0;
    if (fontSize > current) unitMaxFont.set(unit, fontSize);
  }
  for (const info of infos) {
    const maxFont = unitMaxFont.get(info.unit) ?? info.fontSize;
    const secondary = info.fontSize < maxFont;
    const piece: Piece = {
      rect: info.rect,
      unit: unitRects.get(info.unit) ?? null,
      secondary,
      reveal: revealRect,
      late: 0,
    };
    pieceInfos.push({ el: info.el, piece, delay: order(piece) });
  }

  const maxDelay = pieceInfos.reduce(
    (m, info) => (info.delay != null && info.delay > m ? info.delay : m),
    0
  );

  const pieceDelay = (el: Element): number | null => {
    const match = pieceInfos.find((info) => info.el === el);
    return match ? match.delay : 0;
  };

  const boneDelay = (rect: DOMRect): number | null => {
    /* Find the piece whose rect best matches the bone (centre distance). */
    let best: { delay: number | null; distance: number } | null = null;
    for (const info of pieceInfos) {
      const dx = info.piece.rect.left - rect.left;
      const dy = info.piece.rect.top - rect.top;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (!best || distance < best.distance) best = { delay: info.delay, distance };
    }
    return best ? best.delay : 0;
  };

  return {
    kind: 'sequence',
    pieceDelay,
    boneDelay,
    duration: Math.min(maxDelay + FADE_DURATION, MAX_DURATION),
  };
}

/** ─── Entry point ────────────────────────────────────────────────────────── */

/**
 * Resolve a `Plan` for the given context. The planner is pure — the input
 * `ctx` is the only state consulted (apart from the module-level
 * `lastInput` watcher the applier populates via `noteSkeleton`).
 */
export function planReveal(mode: RevealMode, ctx: RevealContext): Plan {
  if (mode === 'instant') return { kind: 'instant' };
  if (mode === 'together') return { kind: 'together', delay: 0, duration: FADE_DURATION };
  if (mode === 'sequence') return sequencePlan(ctx, byRow);
  /* 'smart' */
  const quick = quickly(ctx);
  if (quick) return quick;
  return byContent(ctx);
}

/**
 * Compute the reveal context for an element pair. Convenience the applier
 * uses to build the `ctx` passed to `planReveal`.
 */
export function revealContext(content: HTMLElement, reveal: HTMLElement): RevealContext {
  const info = skeletonUp.get(reveal);
  skeletonUp.delete(reveal);
  const now = performance.now();
  const waited = info ? now - info.since : Infinity;
  const refetch = info?.refetch ?? false;
  const input = now - lastInput < ACTIVE_WINDOW;
  const rect = content.getBoundingClientRect();
  const found = pieces(content);
  return {
    content,
    reveal,
    waited,
    input,
    refetch,
    height: rect.height,
    pieces: found.length,
  };
}
