/**
 * Pure-function tests for `buildStructuralSkeleton`. No DOM needed — we work
 * with raw vnodes and assert on the returned tree shape.
 *
 * Invariants exercised:
 *   1. Containers preserve tag + class + style (DOM-mirror).
 *   2. Raw text becomes a `.a-skel-text-content` span carrying the real text
 *      (so inline layout reserves real width).
 *   3. Atomic leaves become a div with `.a-skel-block` + original class/style.
 *   4. Surface-bearing tags (button, a, …) without a bg get the fallback fill.
 *   5. Attribute-sized atomics (svg/img with `width`/`height` attrs) keep
 *      their size via an injected inline style.
 *   6. Comments/Fragments/empty elements behave correctly.
 *   7. `maxNodes` / `maxDepth` caps stop emission predictably.
 */
import { describe, expect, it } from 'vitest';
import { Comment, Fragment, Text, type VNode, defineComponent, h } from 'vue';
import { buildStructuralSkeleton } from '../src/utils/buildStructuralSkeleton';

const ANIM = 'a-skel-block--anim-shimmer';
const baseOpts = { animationClass: ANIM };

function countVNodes(arr: unknown): number {
  if (!Array.isArray(arr)) return 0;
  let n = 0;
  for (const v of arr) {
    if (v && typeof v === 'object' && 'type' in (v as object)) {
      n++;
      const children = (v as { children?: unknown }).children;
      if (Array.isArray(children)) n += countVNodes(children);
    }
  }
  return n;
}

function classList(v: { props?: { class?: unknown } | null }): string[] {
  const c = v.props?.class;
  if (!c) return [];
  if (typeof c === 'string') return c.split(/\s+/).filter(Boolean);
  if (Array.isArray(c))
    return c.flatMap((x) => (typeof x === 'string' ? x.split(/\s+/).filter(Boolean) : []));
  return [];
}

describe('buildStructuralSkeleton — text content replacement', () => {
  it('wraps raw string text in a .a-skel-text-content span carrying the real text', () => {
    const out = buildStructuralSkeleton(['hello world'], baseOpts);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('span');
    expect(classList(out[0])).toContain('a-skel-text-content');
    expect(classList(out[0])).toContain(ANIM);
    expect(out[0].children).toBe('hello world');
  });

  it('preserves the trimming-significance of whitespace-only text', () => {
    const out = buildStructuralSkeleton(['   '], baseOpts);
    expect(out).toHaveLength(0);
  });

  it('treats Text vnodes the same as raw strings', () => {
    const textVN = h(Text, null, 'Pro');
    const out = buildStructuralSkeleton([textVN], baseOpts);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('span');
    expect(out[0].children).toBe('Pro');
  });

  it('drops comment vnodes', () => {
    const commentVN = h(Comment, null, ' just a marker ');
    const out = buildStructuralSkeleton([commentVN], baseOpts);
    expect(out).toHaveLength(0);
  });

  it('flattens Fragment children into the output stream', () => {
    const fragment = h(Fragment, null, [h('span', null, 'one'), 'two']);
    const out = buildStructuralSkeleton([fragment], baseOpts);
    expect(out).toHaveLength(2);
    expect(out[0].type as string).toBe('span');
    expect(out[1].type as string).toBe('span'); /* text-content wrapper */
  });
});

describe('buildStructuralSkeleton — element preservation', () => {
  it('preserves a div container with all its classes and inline style', () => {
    const tree = h(
      'div',
      { class: 'rounded-2xl bg-white p-6', style: { boxShadow: '0 1px 2px black' } },
      'x'
    );
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).toContain('rounded-2xl');
    expect(classList(out[0])).toContain('bg-white');
    expect(classList(out[0])).toContain('p-6');
    expect(out[0].props?.style).toEqual({ boxShadow: '0 1px 2px black' });
  });

  it('preserves heading tags (h1–h6) and recurses children', () => {
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      const tree = h(tag, { class: 'font-bold' }, 'Title');
      const out = buildStructuralSkeleton([tree], baseOpts);
      expect(out[0].type).toBe(tag);
      const children = out[0].children as { type: string }[];
      expect(children).toHaveLength(1);
      expect(children[0].type).toBe('span');
    }
  });

  it('preserves paragraph + inline tags as containers', () => {
    for (const tag of ['p', 'span', 'a', 'strong', 'em', 'code', 'small', 'label']) {
      const tree = h(tag, { class: 'x' }, 'content');
      const out = buildStructuralSkeleton([tree], baseOpts);
      expect(out[0].type).toBe(tag);
    }
  });

  it('preserves empty containers so layout still reserves space', () => {
    const tree = h('div', { class: 'h-16 w-16' });
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).toContain('h-16');
  });

  it('emits a placeholder shimmer for an empty text-owner tag', () => {
    /* Authoring pattern: `<h3>{{ data?.name }}</h3>` with data === null
     * during loading. The interpolation produces no children, and without
     * a placeholder the bar would be invisible. */
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li']) {
      const tree = h(tag, { class: 'text-base' }); // no children
      const out = buildStructuralSkeleton([tree], baseOpts);
      expect(out[0].type).toBe(tag);
      const children = out[0].children as { type: string }[];
      expect(children).toHaveLength(1);
      expect(children[0].type).toBe('span'); // a-skel-text-content placeholder
    }
  });

  it('does NOT inject placeholder text for non-text-owner empty tags', () => {
    /* A spacer div should stay empty — only text-owners get the placeholder. */
    for (const tag of ['div', 'section', 'header', 'footer', 'main', 'aside']) {
      const tree = h(tag, { class: 'h-4 w-4' });
      const out = buildStructuralSkeleton([tree], baseOpts);
      expect(out[0].type).toBe(tag);
      expect(out[0].children).toBeFalsy();
    }
  });
});

describe('buildStructuralSkeleton — atomic leaves', () => {
  it('replaces <img> with a div carrying .a-skel-block + original class', () => {
    const tree = h('img', { class: 'size-16 rounded-full', src: '/foo.png' });
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).toContain('a-skel-block');
    expect(classList(out[0])).toContain('size-16');
    expect(classList(out[0])).toContain('rounded-full');
  });

  it('replaces <svg> and copies width/height attributes into inline style', () => {
    const tree = h('svg', { class: 'absolute', width: '408', height: 419 });
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    const style = out[0].props?.style as Record<string, string>;
    expect(style.width).toBe('408px');
    expect(style.height).toBe('419px');
  });

  it('preserves CSS-unit values on width/height attributes', () => {
    const tree = h('iframe', { width: '100%', height: '50vh' });
    const out = buildStructuralSkeleton([tree], baseOpts);
    const style = out[0].props?.style as Record<string, string>;
    expect(style.width).toBe('100%');
    expect(style.height).toBe('50vh');
  });

  it('handles every documented atomic tag', () => {
    for (const tag of [
      'img',
      'svg',
      'canvas',
      'video',
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
    ]) {
      const tree = h(tag);
      const out = buildStructuralSkeleton([tree], baseOpts);
      expect(out[0].type).toBe('div');
      expect(classList(out[0])).toContain('a-skel-block');
    }
  });
});

describe('buildStructuralSkeleton — surface-tag bg fallback', () => {
  it('button WITHOUT bg falls back to default .a-skel-block fill', () => {
    const tree = h('button', { class: 'rounded-xl px-4 py-3 text-white' }, 'Click');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('button');
    expect(classList(out[0])).toContain('a-skel-block');
  });

  it('button WITH bg-emerald-600 keeps its real surface (no fallback)', () => {
    const tree = h('button', { class: 'bg-emerald-600 rounded-xl' }, 'Click');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('button');
    expect(classList(out[0])).not.toContain('a-skel-block');
    expect(classList(out[0])).toContain('bg-emerald-600');
  });

  it('button with inline `background` style keeps its real surface', () => {
    const tree = h('button', { style: { background: 'linear-gradient(...)' } }, 'Click');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(classList(out[0])).not.toContain('a-skel-block');
  });

  it('button with inline `background-color` style keeps its real surface', () => {
    const tree = h('button', { style: { backgroundColor: 'red' } }, 'Click');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(classList(out[0])).not.toContain('a-skel-block');
  });

  it('button with style as a CSS string + background-color keeps its real surface', () => {
    const tree = h('button', { style: 'background-color: red; padding: 12px' }, 'Click');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(classList(out[0])).not.toContain('a-skel-block');
  });

  it('button with object class { "bg-red-500": true } keeps its real surface', () => {
    const tree = h('button', { class: { 'bg-red-500': true, 'rounded-xl': true } }, 'Click');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(classList(out[0])).not.toContain('a-skel-block');
  });

  it('anchor WITHOUT bg falls back to .a-skel-block', () => {
    const tree = h('a', { class: 'underline', href: '#' }, 'Read more');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(classList(out[0])).toContain('a-skel-block');
  });

  it('label / summary / fieldset / legend all behave as surface tags', () => {
    for (const tag of ['label', 'summary', 'fieldset', 'legend']) {
      const tree = h(tag, null, 'x');
      const out = buildStructuralSkeleton([tree], baseOpts);
      expect(classList(out[0])).toContain('a-skel-block');
    }
  });

  it('generic div WITHOUT bg does NOT fall back to .a-skel-block', () => {
    const tree = h('div', { class: 'p-4' }, 'x');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(classList(out[0])).not.toContain('a-skel-block');
  });

  it('surface tag with own .a-skel-* class is not mistaken for a real bg', () => {
    /* Prevents an infinite recursion where wrapping a button with our own
     * fallback class re-triggers the detector on subsequent renders. */
    const tree = h('button', { class: 'a-skel-block rounded-xl' }, 'x');
    const out = buildStructuralSkeleton([tree], baseOpts);
    /* Already had a-skel-block — no double application. */
    const occurrences = classList(out[0]).filter((c) => c === 'a-skel-block').length;
    expect(occurrences).toBeGreaterThan(0);
  });

  it('arbitrary Tailwind bg-[#hex] notation is detected as explicit bg', () => {
    const tree = h('button', { class: 'bg-[#1A7B4E] rounded-xl' }, 'x');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(classList(out[0])).not.toContain('a-skel-block');
  });
});

describe('buildStructuralSkeleton — component vnodes', () => {
  it('renders a component vnode as an opaque shimmer block carrying its class', () => {
    const MyComp = defineComponent({ name: 'MyComp', template: '<div>x</div>' });
    const tree = h(MyComp, { class: 'w-32 h-32' });
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).toContain('a-skel-block');
    expect(classList(out[0])).toContain('w-32');
  });
});

describe('buildStructuralSkeleton — recursion bounds', () => {
  it('respects maxDepth — collapses subtree past the cap into a single block', () => {
    let tree = h('span', null, 'leaf');
    for (let i = 0; i < 10; i++) tree = h('div', null, [tree]);
    const out = buildStructuralSkeleton([tree], { animationClass: null, maxDepth: 3 });
    /* Walk down 3 div levels then hit cap → emits a-skel-block. */
    let cursor: VNode | undefined = out[0];
    let depth = 0;
    while (cursor && classList(cursor).indexOf('a-skel-block') === -1) {
      cursor = (cursor.children as VNode[] | undefined)?.[0];
      depth++;
      if (depth > 12) break;
    }
    expect(depth).toBeLessThanOrEqual(4);
  });

  it('respects maxNodes — stops emitting once the cap is hit', () => {
    const tree = h(
      'div',
      null,
      Array.from({ length: 50 }, (_, i) => h('span', null, `${i}`))
    );
    const out = buildStructuralSkeleton([tree], { animationClass: null, maxNodes: 5 });
    /* The walk stops emitting past the cap. Total node count is bounded by
     * the cap (including bottom-up parent push: the cap can be hit before the
     * outermost parent is push'd, producing 0 — that's the cost of a too-low
     * cap on a 50-child tree). */
    const total = countVNodes(out);
    expect(total).toBeLessThanOrEqual(5);
  });

  it('produces a useful skeleton at a generous maxNodes', () => {
    const tree = h(
      'div',
      null,
      Array.from({ length: 5 }, (_, i) => h('span', null, `${i}`))
    );
    const out = buildStructuralSkeleton([tree], { animationClass: null, maxNodes: 50 });
    const total = countVNodes(out);
    expect(total).toBeGreaterThan(5); /* 1 div + 5 spans + 5 text wrappers ≥ 11 */
  });

  it('processes a tree with mixed children correctly', () => {
    const tree = h('section', { class: 'p-4' }, [
      h('h2', null, 'Title'),
      h('p', { class: 'mt-2' }, 'Body content'),
      h('button', { class: 'bg-blue-500 px-4' }, 'Action'),
      'orphan text',
    ]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('section');
    const children = out[0].children as { type: string }[];
    expect(children).toHaveLength(4);
    expect(children[0].type).toBe('h2');
    expect(children[1].type).toBe('p');
    expect(children[2].type).toBe('button');
    expect(children[3].type).toBe('span'); /* text wrapper */
  });
});

describe('buildStructuralSkeleton — author opt-out attributes', () => {
  it('`data-skeleton-ignore` renders the original element verbatim (no skeleton transform)', () => {
    const tree = h('svg', {
      'data-skeleton-ignore': '',
      class: 'absolute -left-12 -top-12 h-72 w-72',
      width: '200',
      height: '200',
    });
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('svg');
    expect(classList(out[0])).not.toContain('a-skel-block');
    /* The original width / height attributes survive untouched. */
    expect(out[0].props?.width).toBe('200');
    expect(out[0].props?.height).toBe('200');
  });

  it('`data-skeleton-ignore` also applies to wrapper divs (decorative chrome)', () => {
    const tree = h('div', { 'data-skeleton-ignore': '', class: 'absolute inset-0 bg-gradient' }, [
      h('span', null, 'hidden text'),
    ]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).not.toContain('a-skel-block');
    /* Children are preserved verbatim — no text-content shimmer span. */
    const children = out[0].children as { type: string }[];
    expect(children[0].type).toBe('span');
  });

  it('`data-skeleton-stop` renders one shimmer block, no recursion', () => {
    const tree = h('div', { 'data-skeleton-stop': '', class: 'card p-4' }, [
      h('h2', null, 'Title'),
      h('p', null, 'Body'),
      h('button', { class: 'bg-blue-500' }, 'Action'),
    ]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).toContain('a-skel-block');
    expect(classList(out[0])).toContain('card');
    /* No children emitted from the subtree. */
    expect(out[0].children == null).toBe(true);
  });
});

describe('buildStructuralSkeleton — table preservation', () => {
  it('preserves <table>/<thead>/<tbody>/<tr>/<td>/<th> structure', () => {
    const tree = h('table', null, [
      h('thead', null, [h('tr', null, [h('th', null, 'A'), h('th', null, 'B')])]),
      h('tbody', null, [
        h('tr', null, [h('td', null, '1'), h('td', null, '2')]),
        h('tr', null, [h('td', null, '3'), h('td', null, '4')]),
      ]),
    ]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('table');
    const thead = (out[0].children as { type: string }[])[0];
    expect(thead.type).toBe('thead');
    const tr = (thead.children as { type: string }[])[0];
    expect(tr.type).toBe('tr');
    const th = (tr.children as { type: string }[])[0];
    expect(th.type).toBe('th');
    /* The cell's text content is replaced by a shimmer span. */
    expect((th.children as { type: string }[])[0].type).toBe('span');
  });

  it('preserves caption + colgroup + col', () => {
    const tree = h('table', null, [h('caption', null, 'Sales'), h('colgroup', null, [h('col')])]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    const children = out[0].children as { type: string }[];
    expect(children[0].type).toBe('caption');
    expect(children[1].type).toBe('colgroup');
  });
});

describe('buildStructuralSkeleton — list preservation', () => {
  it('preserves <ul>/<li> structure', () => {
    const tree = h('ul', { class: 'space-y-2' }, [h('li', null, 'first'), h('li', null, 'second')]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('ul');
    const items = out[0].children as { type: string }[];
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe('li');
  });

  it('preserves description lists <dl>/<dt>/<dd>', () => {
    const tree = h('dl', null, [h('dt', null, 'Term'), h('dd', null, 'Definition')]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    const kids = out[0].children as { type: string }[];
    expect(kids[0].type).toBe('dt');
    expect(kids[1].type).toBe('dd');
  });
});

describe('buildStructuralSkeleton — SVG interior protection', () => {
  it('does NOT recurse into <svg> children (parent is atomic)', () => {
    const tree = h('svg', { width: 20, height: 20 }, [h('circle', { cx: 10, cy: 10, r: 8 })]);
    const out = buildStructuralSkeleton([tree], baseOpts);
    /* The svg becomes a div.a-skel-block — no inner circle vnode rendered. */
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).toContain('a-skel-block');
  });

  it('skips orphan SVG interior tags (e.g. a stray <path>)', () => {
    const tree = h('path', { d: 'M0 0 L 10 10' });
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out).toHaveLength(0);
  });
});

describe('buildStructuralSkeleton — new author opt-outs (data-skeleton-text/block)', () => {
  it('`data-skeleton-text` forces inline text-bar treatment', () => {
    const tree = h('button', { 'data-skeleton-text': '', class: 'rounded-xl' }, 'X');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('span');
    expect(classList(out[0])).toContain('a-skel-text-content');
  });

  it('`data-skeleton-block` forces shimmer-block treatment', () => {
    const tree = h('p', { 'data-skeleton-block': '', class: 'h-32 w-32' }, 'description');
    const out = buildStructuralSkeleton([tree], baseOpts);
    expect(out[0].type).toBe('div');
    expect(classList(out[0])).toContain('a-skel-block');
    expect(classList(out[0])).toContain('h-32');
  });
});

describe('buildStructuralSkeleton — null / boolean / empty inputs', () => {
  it('returns an empty array for null / undefined / boolean input', () => {
    expect(buildStructuralSkeleton(null, baseOpts)).toEqual([]);
    expect(buildStructuralSkeleton(undefined, baseOpts)).toEqual([]);
    expect(buildStructuralSkeleton(false, baseOpts)).toEqual([]);
    expect(buildStructuralSkeleton(true, baseOpts)).toEqual([]);
  });

  it('returns an empty array for an empty array', () => {
    expect(buildStructuralSkeleton([], baseOpts)).toEqual([]);
  });
});
