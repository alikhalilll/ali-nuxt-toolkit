import {
  Comment,
  Fragment,
  Text,
  cloneVNode,
  h,
  type VNode,
  type VNodeArrayChildren,
  type VNodeChild,
} from 'vue';

/**
 * Atomic tags — rendered as a single shimmer block. Their internal rendering
 * is opaque to vnode walking (no meaningful child structure for us to mirror).
 * Their own `class` + `style` are preserved so Tailwind utilities like
 * `size-16` and `rounded-full` still drive the dimensions.
 *
 * Note: `button`, `a`, `label` are deliberately NOT atomic — they're treated
 * as containers so their real `background-color` / `border` / shadow survive
 * (we add `.a-skel-block` to atomics, which paints a skeleton gradient that
 * would override Tailwind's `bg-emerald-600` and friends). Their text content
 * is recursed and replaced with a shimmer span inside the real button shape.
 */
const ATOMIC_TAGS = new Set([
  'img',
  'svg',
  'canvas',
  'video',
  'audio',
  'input',
  'textarea',
  'select',
  'progress',
  'meter',
  'hr',
  'iframe',
  'object',
  'embed',
  'picture',
]);

/**
 * SVG child tags that should never be walked by the structural skeleton —
 * SVG interior elements use a different coordinate space (`x`/`y` are
 * attributes, not CSS), so emitting `.a-skel-block` divs at their tag would
 * yield non-rendering elements. When we see one of these, the parent `<svg>`
 * has already been treated as an atomic block — we just return null/skip.
 */
const SVG_INTERIOR_TAGS = new Set([
  'circle',
  'rect',
  'path',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'g',
  'defs',
  'clippath',
  'mask',
  'pattern',
  'lineargradient',
  'radialgradient',
  'stop',
  'use',
  'symbol',
  'foreignobject',
  'text',
  'tspan',
  'textpath',
  'marker',
  'filter',
  'feblend',
  'fecolormatrix',
  'fegaussianblur',
  'feoffset',
  'fedropshadow',
  'femerge',
  'femergenode',
]);

/**
 * Table-structural tags — preserve them as-is. Their semantics (`display:
 * table-*`) are critical for layout, and replacing them with `<div>` would
 * break the grid. Children are recursed normally.
 */
const TABLE_TAGS = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'colgroup',
  'col',
]);

/**
 * List-structural tags — `<ul>`, `<ol>`, `<li>`, `<dl>`, `<dt>`, `<dd>`.
 * Preserved as containers; `<li>` recurses into its text/children so each
 * list item gets the right shimmer treatment.
 */
const LIST_TAGS = new Set(['ul', 'ol', 'li', 'dl', 'dt', 'dd']);

/**
 * Tags whose content is conventionally text. When the author writes
 * `<h3>{{ data?.name }}</h3>` and `data` is null during loading, the
 * interpolation produces no children — the walker would otherwise emit an
 * empty `<h3></h3>` and no skeleton bar shows. For these tags we emit a
 * synthetic placeholder text-content span so the bar renders at the tag's
 * natural rendered width (Tailwind sizing on the tag still drives height).
 */
const TEXT_OWNER_TAGS = new Set([
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
 * Non-breaking-space placeholder for empty text-owners. ~24 chars wide is
 * enough to read as "a line of text" in most fonts while still being short
 * enough that the rendered bar doesn't wrap in narrow containers.
 */
const TEXT_PLACEHOLDER = ' '.repeat(24);

export interface BuildOptions {
  /** Animation class applied to every emitted shimmer surface. `null` disables animation. */
  animationClass: string | null;
  /** Max recursion depth — guards runaway templates. Default 16. */
  maxDepth?: number;
  /**
   * Hard cap on emitted skeleton nodes. Default 600. The walk stops emitting
   * past this cap; the partial tree is still valid (it just won't include the
   * leaves beyond the budget).
   */
  maxNodes?: number;
}

const DEFAULT_MAX_DEPTH = 16;
const DEFAULT_MAX_NODES = 600;

interface WalkState {
  emitted: number;
  cap: number;
}

/**
 * Walk a slot's vnode tree and produce a **DOM-mirror skeleton**: every element
 * is preserved (same tag, same `class`, same inline `style`), and only the
 * content is replaced. The output is structurally identical to what the real
 * component would render — Tailwind utilities for layout, spacing, sizing,
 * backgrounds and shadows all carry through. The CSS does the work of making
 * it *look* like a skeleton.
 *
 * Replacement rules:
 * - **Raw text** (e.g. interpolations, static strings) is wrapped in
 *   `<span class="a-skel-text-content">…the real text…</span>`. The text is
 *   kept as the span's children so the inline layout reserves its real
 *   rendered width — but the glyphs are painted transparent and a skeleton
 *   gradient is painted in their place. Multi-line text wraps naturally,
 *   producing one shimmer rect per visual line at the exact rendered position.
 * - **Atomic / interactive tags** (`img`, `svg`, `button`, `input`, …) are
 *   replaced by a `<div class="a-skel-block">` carrying the original element's
 *   `class` and `style`, so dimensions and shapes (size, border-radius, etc.)
 *   still drive the layout.
 * - **Container elements** (`div`, `section`, `h1`, `p`, `a`, `span`, …) are
 *   preserved as the same tag with the same `class` and `style`; we recurse
 *   into their children.
 * - **Component vnodes** can't be introspected at render time, so we emit a
 *   single `<div class="a-skel-block">` carrying their outer `class` / `style`.
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

  /* Bare string / number content from interpolations. Wrap in the text-content
   * span so the real text drives the rendered width. */
  if (typeof input === 'string' || typeof input === 'number') {
    const str = String(input);
    if (str.trim()) push(out, textContentSpan(str, opts.animationClass), state);
    return;
  }

  const v = input as VNode;
  const type = v.type;

  if (type === Comment) return;

  if (type === Text) {
    const text = typeof v.children === 'string' ? v.children : '';
    if (text.trim()) push(out, textContentSpan(text, opts.animationClass), state);
    return;
  }

  if (type === Fragment) {
    walk(v.children as VNodeArrayChildren, opts, depth, max, state, out);
    return;
  }

  if (typeof type === 'string') {
    const tag = type.toLowerCase();

    /* SVG interior — bail out. The parent <svg> is treated atomically; its
     * children use a non-CSS coordinate space and shouldn't be transformed. */
    if (SVG_INTERIOR_TAGS.has(tag)) return;

    /* Author opt-outs — applied BEFORE the tag-based dispatch so they win.
     * Five attributes supported:
     *   data-skeleton-ignore  — render verbatim (chrome).
     *   data-skeleton-stop    — single block, no recursion.
     *   data-skeleton-text    — force inline text-bar treatment.
     *   data-skeleton-block   — force atomic shimmer-block treatment.
     *   data-skeleton-variant — render the named variant primitive. */
    const props = v.props ?? {};
    if (props['data-skeleton-ignore'] !== undefined) {
      push(out, cloneVNode(v), state);
      return;
    }
    if (props['data-skeleton-stop'] !== undefined) {
      push(
        out,
        h('div', {
          class: ['a-skel-block', v.props?.class, opts.animationClass],
          style: v.props?.style as Record<string, string>,
          'aria-hidden': 'true',
        }),
        state
      );
      return;
    }
    if (props['data-skeleton-text'] !== undefined) {
      /* Force this leaf into text-bar treatment regardless of its tag. */
      push(out, textContentSpan(' ', opts.animationClass), state);
      return;
    }
    if (props['data-skeleton-block'] !== undefined) {
      push(
        out,
        h('div', {
          class: ['a-skel-block', v.props?.class, opts.animationClass],
          style: v.props?.style as Record<string, string>,
          'aria-hidden': 'true',
        }),
        state
      );
      return;
    }
    push(out, transformElement(v, tag, opts, depth, max, state), state);
    return;
  }

  /* Component vnode — we can't introspect its internal template (it hasn't
   * mounted), but we CAN walk whatever the consumer passed into its slots.
   * `<UiButton>View Users</UiButton>` keeps the text bar; `<UiCard><h3>…</h3>
   * <p>…</p></UiCard>` keeps the heading + paragraph. A truly leaf component
   * with no slot content (e.g. `<UiSwitch />`) falls back to a single shimmer
   * block carrying the outer class/style — same as before.
   *
   * Why the wrapper div instead of cloning the component's tag: components
   * can't be rendered cheaply here (they'd run their full setup + lifecycle),
   * and we don't want side effects from a skeleton pass. A neutral div with
   * the component's outer class/style preserves Tailwind-driven sizing /
   * spacing on the wrapper while keeping the walker pure. */
  if (typeof type === 'object' || typeof type === 'function') {
    const slotChildren = resolveComponentChildren(v);
    if (slotChildren && slotChildren.length > 0) {
      const recursed: VNode[] = [];
      walk(slotChildren, opts, depth + 1, max, state, recursed);
      if (recursed.length > 0) {
        push(
          out,
          h(
            'div',
            {
              class: ['a-skel-component', v.props?.class, opts.animationClass],
              style: v.props?.style as Record<string, string>,
              'aria-hidden': 'true',
            },
            recursed
          ),
          state
        );
        return;
      }
    }
    push(
      out,
      h('div', {
        class: ['a-skel-block', v.props?.class, opts.animationClass],
        style: v.props?.style as Record<string, string>,
        'aria-hidden': 'true',
      }),
      state
    );
  }
}

/**
 * Extract the walkable child VNodes a component received from the consumer.
 * Covers the three shapes Vue uses:
 *   - `v.children` is a VNode array  (direct children passed verbatim)
 *   - `v.children` is a slot map     (`{ default: () => […], suffix: () => […], … }`)
 *   - `v.children` is a string/number (text-only slot content)
 *
 * Returns null when the component has no walkable content (a true leaf
 * component like `<UiSwitch />`).
 */
function resolveComponentChildren(v: VNode): VNodeArrayChildren | null {
  const c = v.children;
  if (c == null) return null;
  if (Array.isArray(c)) return c.length > 0 ? (c as VNodeArrayChildren) : null;
  if (typeof c === 'string' || typeof c === 'number') {
    /* String/number children — wrap so the existing walker's text path catches them. */
    return [c as unknown as VNodeChild];
  }
  if (typeof c === 'object') {
    /* Slot map — collect every named slot's output. Default first so the bulk
     * of the visible content renders before suffix/prefix bars. */
    const slots = c as Record<string, unknown>;
    const collected: VNodeArrayChildren = [];
    const order = ['default', ...Object.keys(slots).filter((k) => k !== 'default')];
    for (const key of order) {
      const fn = slots[key];
      if (typeof fn !== 'function') continue;
      try {
        const result = (fn as () => unknown)();
        if (Array.isArray(result)) collected.push(...(result as VNodeArrayChildren));
        else if (result != null) collected.push(result as VNodeChild);
      } catch {
        /* Slot threw — skip silently. The walker is best-effort; a broken slot
         * shouldn't crash the whole skeleton. */
      }
    }
    return collected.length > 0 ? collected : null;
  }
  return null;
}

/**
 * Resolve the prototype VNode array used to drive skeleton capture.
 *
 * Precedence:
 *   1. If a `#prototype` slot is provided, use it verbatim. The author has
 *      taken control — no detection, no surprises.
 *   2. Otherwise return the default slot verbatim.
 *
 * The walker does NOT try to auto-detect `v-for` and trim repeated siblings.
 * Heuristics over slot vnodes (matching `type` + defined `key`) misfire on
 * legitimate-but-similar markup, and the consumer is the only one who can
 * say authoritatively which element is the prototype. When the default slot
 * iterates over data, the recommended pattern is to provide an explicit
 * `#prototype` — the README documents this exact pattern.
 *
 * Pure function: no DOM, no reactivity. Trivial to unit-test.
 */
export function resolvePrototypeVNodes(
  defaultSlot: VNodeChild | VNodeArrayChildren | undefined | null,
  prototypeSlot?: VNodeChild | VNodeArrayChildren | null
): VNodeArrayChildren {
  if (prototypeSlot != null) {
    return Array.isArray(prototypeSlot)
      ? (prototypeSlot as VNodeArrayChildren)
      : [prototypeSlot as VNodeChild];
  }
  if (defaultSlot == null) return [];
  return Array.isArray(defaultSlot)
    ? (defaultSlot as VNodeArrayChildren)
    : [defaultSlot as VNodeChild];
}

function push(out: VNode[], vn: VNode, state: WalkState): void {
  if (state.emitted >= state.cap) return;
  out.push(vn);
  state.emitted++;
}

/**
 * Surface-bearing tags — when these are encountered without their own explicit
 * background, the skeleton paints the default fill so they still read as a
 * solid element (a button without `bg-*` shouldn't look invisible).
 *
 * Pure layout containers (`div`, `section`, `main`, `article`, `header`,
 * `footer`, `nav`, `aside`) deliberately don't get the fallback — they're
 * transparent in the real DOM and should stay that way in the skeleton.
 */
const SURFACE_TAGS = new Set(['button', 'a', 'label', 'summary', 'fieldset', 'legend']);

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

  /* Atomic / interactive — replace with a sized shimmer block. The original
   * element's class + style carry the dimensions, border-radius, etc., so a
   * `class="size-16 rounded-full"` <img> becomes a 64×64 round shimmer block.
   *
   * For elements sized via HTML attributes (`<svg width="408" height="419">`,
   * `<img width="…">`, etc.), we copy those attributes into an inline style
   * so the replacement div takes the same dimensions — without this, a div
   * doesn't honour those attributes and would render at 0×0. */
  if (ATOMIC_TAGS.has(tag)) {
    const dimStyle = atomicDimensionStyle(v.props);
    return h('div', {
      class: ['a-skel-block', cls, opts.animationClass],
      style: dimStyle ? mergeStyle(dimStyle, styl) : styl,
      'aria-hidden': 'true',
    });
  }

  /* Table-structural tags — preserve them as-is. Replacing a <td> with a
   * <div> would break `display: table-*` layout. Children are recursed
   * normally so each cell gets the right shimmer treatment. */
  if (TABLE_TAGS.has(tag)) {
    if (depth >= max) {
      return h(tag, { class: cls, style: styl });
    }
    const recursed: VNode[] = [];
    walk(v.children as VNodeArrayChildren, opts, depth + 1, max, state, recursed);
    if (recursed.length === 0 && TEXT_OWNER_TAGS.has(tag)) {
      return h(tag, { class: cls, style: styl }, [
        textContentSpan(TEXT_PLACEHOLDER, opts.animationClass),
      ]);
    }
    return h(tag, { class: cls, style: styl }, recursed.length > 0 ? recursed : undefined);
  }

  /* List-structural tags — preserve `<ul>` / `<ol>` / `<li>` / `<dl>` etc.
   * `<li>` recurses into its content so each item gets the right shimmer
   * treatment (text bar for text-only items, mixed content for richer ones). */
  if (LIST_TAGS.has(tag)) {
    if (depth >= max) {
      return h(tag, { class: cls, style: styl });
    }
    const recursed: VNode[] = [];
    walk(v.children as VNodeArrayChildren, opts, depth + 1, max, state, recursed);
    if (recursed.length === 0 && TEXT_OWNER_TAGS.has(tag)) {
      return h(tag, { class: cls, style: styl }, [
        textContentSpan(TEXT_PLACEHOLDER, opts.animationClass),
      ]);
    }
    return h(tag, { class: cls, style: styl }, recursed.length > 0 ? recursed : undefined);
  }

  /* Depth cap — collapse the subtree into a single shimmer block carrying the
   * container's outer dimensions / classes. */
  if (depth >= max) {
    return h('div', {
      class: ['a-skel-block', cls, opts.animationClass],
      style: styl,
      'aria-hidden': 'true',
    });
  }

  const recursed: VNode[] = [];
  walk(v.children as VNodeArrayChildren, opts, depth + 1, max, state, recursed);

  /* Empty text-owner — author wrote `<h3>{{ data?.name }}</h3>` and `data`
   * is null during loading, so the interpolation produced no children.
   * Inject a placeholder text-content span so a shimmer bar still renders at
   * the tag's natural rendered width (tag's `class` drives font / line-height
   * / size — same path the real text would take). */
  if (recursed.length === 0 && TEXT_OWNER_TAGS.has(tag)) {
    return h(tag, { class: cls, style: styl }, [
      textContentSpan(TEXT_PLACEHOLDER, opts.animationClass),
    ]);
  }

  /* Empty container — preserve the element so layout still reserves space.
   * (Spacer divs, decorative wrappers, etc.) */
  if (recursed.length === 0) {
    return h(tag, { class: cls, style: styl });
  }

  /* Surface-bearing element (button, a, label, …) — if the author didn't supply
   * a background, fall back to the default skeleton fill so the element stays
   * visible as a card / button / chip. Explicit `bg-*` classes or inline
   * `background` keep the real surface. */
  if (SURFACE_TAGS.has(tag) && !hasExplicitBackground(cls, styl)) {
    return h(
      tag,
      {
        class: ['a-skel-block', cls, opts.animationClass],
        style: styl,
      },
      recursed
    );
  }

  return cloneTag(tag, cls, styl, recursed);
}

/**
 * Extract width/height from HTML attributes that affect layout (`<svg
 * width="408">`, `<img width="…" height="…">`) and project them into inline
 * style. Without this, replacing an attribute-sized atomic element with a
 * `<div>` would drop the size — divs don't honour those attributes.
 */
function atomicDimensionStyle(
  props: Record<string, unknown> | null | undefined
): Record<string, string> | null {
  if (!props) return null;
  const out: Record<string, string> = {};
  const w = props.width;
  const h = props.height;
  if (w !== undefined && w !== null && w !== '') {
    out.width = typeof w === 'number' ? `${w}px` : /^\d+$/.test(String(w)) ? `${w}px` : String(w);
  }
  if (h !== undefined && h !== null && h !== '') {
    out.height = typeof h === 'number' ? `${h}px` : /^\d+$/.test(String(h)) ? `${h}px` : String(h);
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Detect whether the element has an explicit background — either via a
 * Tailwind / DaisyUI / CSS-modules `bg-*` class or via an inline
 * `background` / `background-color` / `background-image` style. When false,
 * surface-bearing elements (button, a, label, …) fall back to the default
 * skeleton fill so they don't render as a transparent gap during loading.
 */
function hasExplicitBackground(cls: unknown, styl: unknown): boolean {
  if (hasBackgroundInStyle(styl)) return true;
  if (hasBackgroundInClass(cls)) return true;
  return false;
}

const BG_CLASS_RE = /(?:^|\s|:)bg-(?!skel)(?:\[|[a-z])/i;

function hasBackgroundInClass(cls: unknown): boolean {
  if (cls == null || cls === false) return false;
  if (typeof cls === 'string') return BG_CLASS_RE.test(cls);
  if (Array.isArray(cls)) {
    for (const item of cls) {
      if (hasBackgroundInClass(item)) return true;
    }
    return false;
  }
  if (typeof cls === 'object') {
    for (const k of Object.keys(cls as Record<string, unknown>)) {
      if ((cls as Record<string, unknown>)[k] && BG_CLASS_RE.test(k)) return true;
    }
  }
  return false;
}

function hasBackgroundInStyle(styl: unknown): boolean {
  if (!styl) return false;
  if (typeof styl === 'string') return /background(?:-color|-image)?\s*:/i.test(styl);
  if (typeof styl === 'object') {
    const s = styl as Record<string, unknown>;
    return (
      'background' in s ||
      'backgroundColor' in s ||
      'backgroundImage' in s ||
      'background-color' in s ||
      'background-image' in s
    );
  }
  return false;
}

function mergeStyle(
  a: Record<string, string>,
  b: Record<string, string> | string | undefined | null
): Record<string, string> | string {
  if (!b) return a;
  if (typeof b === 'string') {
    /* Preserve user's inline style; prepend dim style so user values still win
     * if they explicitly set the same property. */
    const dimsStr = Object.entries(a)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    return `${dimsStr}; ${b}`;
  }
  return { ...a, ...(b as Record<string, string>) };
}

function cloneTag(
  tag: string,
  cls: unknown,
  styl: Record<string, string> | string | undefined,
  children: VNode[]
): VNode {
  /* We deliberately don't forward arbitrary props (`v.props`) — preserving
   * the tag + class + style is enough for visual fidelity, and dropping the
   * rest (onClick handlers, href, etc.) keeps the skeleton non-interactive. */
  return h(tag, { class: cls, style: styl }, children);
}

function textContentSpan(text: string, animationClass: string | null): VNode {
  return h(
    'span',
    {
      class: ['a-skel-text-content', animationClass],
      'aria-hidden': 'true',
    },
    text
  );
}

/* Re-export for advanced consumers who want to construct skeleton vnodes
 * themselves (e.g. inside a render function component). */
export { cloneVNode };
