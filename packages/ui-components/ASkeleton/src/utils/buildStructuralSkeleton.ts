import {
  Comment,
  Fragment,
  Text,
  h,
  type VNode,
  type VNodeArrayChildren,
  type VNodeChild,
} from 'vue';

/**
 * Atomic HTML tags — rendered as a single skeleton block. Their own class/style
 * is preserved so Tailwind utilities (`size-16`, `rounded-full`, …) carry the
 * dimensions across without us needing to measure.
 */
const ATOMIC_TAGS = new Set([
  'img',
  'svg',
  'canvas',
  'video',
  'input',
  'textarea',
  'select',
  'button',
  'progress',
  'meter',
  'hr',
]);

/** Single-line text containers — produce one bar. */
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/** Multi-line text containers — produce N bars with a shortened last line. */
const PARAGRAPH_TAGS = new Set(['p', 'blockquote']);

/** Inline text — single bar, but inherits parent font sizing. */
const INLINE_TEXT_TAGS = new Set([
  'span',
  'a',
  'small',
  'strong',
  'em',
  'code',
  'time',
  'label',
  'b',
  'i',
  'mark',
]);

export interface BuildOptions {
  animationClass: string | null;
  /** Max recursion depth — guards runaway templates. Default 8. */
  maxDepth?: number;
  /**
   * Hard cap on emitted skeleton nodes. Default 300. A 200-row table doesn't
   * need 200 distinct skeleton rows on first paint; cap and stop early.
   */
  maxNodes?: number;
}

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_NODES = 300;

interface WalkState {
  emitted: number;
  cap: number;
}

/**
 * Walk a slot's vnode tree and produce a skeleton that mirrors its rendered
 * structure: same wrapping tags, same `class` strings (so flex/grid/spacing/
 * sizing utilities still apply), but text/atomic leaves replaced with shimmer
 * blocks. The result renders correctly on the FIRST paint without any DOM
 * measurement, as long as the slot's template renders structure even when its
 * data is empty (use `v-if`/`v-else` to swap content, not to gate the wrapper).
 *
 * Performance: `maxNodes` caps the work. When the cap is hit we stop emitting
 * — the caller still gets a valid skeleton, just clipped at the budget. A 1000-
 * row list renders ~300 skeleton rows on first paint and then the measured cache
 * takes over for subsequent loads.
 */
export function buildStructuralSkeleton(
  vnodes: VNodeChild | VNodeArrayChildren | undefined | null,
  opts: BuildOptions
): VNode[] {
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;
  const state: WalkState = { emitted: 0, cap: opts.maxNodes ?? DEFAULT_MAX_NODES };
  const out: VNode[] = [];
  walk(vnodes, opts, 0, maxDepth, state, out);
  return out;
}

function walk(
  input: VNodeChild | VNodeArrayChildren | undefined | null,
  opts: BuildOptions,
  depth: number,
  max: number,
  state: WalkState,
  out: VNode[]
): void {
  if (state.emitted >= state.cap) return;
  if (input == null || typeof input === 'boolean') return;

  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      if (state.emitted >= state.cap) return;
      walk(input[i] as VNodeChild, opts, depth, max, state, out);
    }
    return;
  }

  if (typeof input === 'string' || typeof input === 'number') {
    const str = String(input).trim();
    if (str) push(out, textBar(opts.animationClass), state);
    return;
  }

  const v = input as VNode;
  const type = v.type;

  if (type === Comment) return;

  if (type === Text) {
    const t = typeof v.children === 'string' ? v.children.trim() : '';
    if (t) push(out, textBar(opts.animationClass), state);
    return;
  }

  if (type === Fragment) {
    walk(v.children as VNodeArrayChildren, opts, depth, max, state, out);
    return;
  }

  if (typeof type === 'string') {
    push(out, transformElement(v, type.toLowerCase(), opts, depth, max, state), state);
    return;
  }

  /* Component vnode — we can't introspect its template, so render an opaque
   * skeleton block carrying any utility classes the user attached to it. */
  if (typeof type === 'object' || typeof type === 'function') {
    push(
      out,
      h('div', {
        class: ['a-skel-block', v.props?.class, opts.animationClass],
        style: v.props?.style as Record<string, string>,
      }),
      state
    );
  }
}

function push(out: VNode[], vn: VNode, state: WalkState): void {
  if (state.emitted >= state.cap) return;
  out.push(vn);
  state.emitted++;
}

function transformElement(
  v: VNode,
  tag: string,
  opts: BuildOptions,
  depth: number,
  max: number,
  state: WalkState
): VNode {
  const cls = v.props?.class;
  const styl = v.props?.style as Record<string, string> | string | undefined;

  if (ATOMIC_TAGS.has(tag)) {
    return h('div', { class: ['a-skel-block', cls, opts.animationClass], style: styl });
  }

  if (HEADING_TAGS.has(tag)) {
    return h(tag, { class: cls, style: styl }, [textBar(opts.animationClass)]);
  }

  if (PARAGRAPH_TAGS.has(tag)) {
    const children = v.children;
    const recursedChildren: VNode[] = [];
    walk(children as VNodeArrayChildren, opts, depth + 1, max, state, recursedChildren);
    if (recursedChildren.length > 0) return h(tag, { class: cls, style: styl }, recursedChildren);
    const lines = estimateLines(children, 3);
    return h(tag, { class: cls, style: styl }, multiLineBars(lines, opts.animationClass));
  }

  if (INLINE_TEXT_TAGS.has(tag)) {
    const children = v.children;
    const recursedChildren: VNode[] = [];
    walk(children as VNodeArrayChildren, opts, depth + 1, max, state, recursedChildren);
    if (recursedChildren.length > 0) return h(tag, { class: cls, style: styl }, recursedChildren);
    return h(tag, { class: cls, style: styl }, [textBar(opts.animationClass)]);
  }

  /* Generic container — keep its classes (flex/grid/padding/etc.) and recurse. */
  if (depth >= max) {
    return h('div', { class: ['a-skel-block', cls, opts.animationClass], style: styl });
  }
  const recursed: VNode[] = [];
  walk(v.children as VNodeArrayChildren, opts, depth + 1, max, state, recursed);
  if (recursed.length === 0) {
    /* Empty container in the source — render as a single block so the layout
     * still reserves space rather than collapsing to zero height. */
    return h('div', { class: ['a-skel-block', cls, opts.animationClass], style: styl });
  }
  return h(tag, { class: cls, style: styl }, recursed);
}

function estimateLines(children: unknown, max: number): number {
  if (typeof children !== 'string') return 1;
  const len = children.trim().length;
  if (len === 0)
    return 2; /* empty interpolation — assume 2 lines so the bar looks paragraph-shaped */
  if (len < 40) return 1;
  if (len < 100) return 2;
  return Math.min(max, 3);
}

function multiLineBars(lines: number, animationClass: string | null): VNode[] {
  const out: VNode[] = [];
  for (let i = 0; i < lines; i++) {
    out.push(textBar(animationClass, i === lines - 1 && lines > 1 ? 0.65 : 1));
  }
  return out;
}

/* Style objects for the two common bar shapes are reused across calls so a
 * structural skeleton with 200 text bars doesn't allocate 200 style objects. */
const BAR_STYLE_FULL = Object.freeze({
  display: 'inline-block',
  width: '100%',
  height: '0.75em',
  verticalAlign: 'middle',
  borderRadius: '4px',
});

const PARTIAL_BAR_CACHE = new Map<number, Readonly<Record<string, string>>>();

function partialBarStyle(widthFraction: number): Readonly<Record<string, string>> {
  /* Round to one decimal so 0.65, 0.7, 0.85 each get a single cached style. */
  const key = Math.round(widthFraction * 10) / 10;
  const hit = PARTIAL_BAR_CACHE.get(key);
  if (hit) return hit;
  const made = Object.freeze({
    display: 'inline-block',
    width: `${Math.round(key * 100)}%`,
    height: '0.75em',
    verticalAlign: 'middle',
    borderRadius: '4px',
  });
  PARTIAL_BAR_CACHE.set(key, made);
  return made;
}

function textBar(animationClass: string | null, widthFraction = 1): VNode {
  return h('span', {
    class: ['a-skel-block', 'a-skel-block--text', animationClass],
    style: widthFraction === 1 ? BAR_STYLE_FULL : partialBarStyle(widthFraction),
  });
}
