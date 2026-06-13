/**
 * walkDom is the legacy positioned-block capture used by `useSkeleton` /
 * `<ASkeletonLayer>` power-user paths. ASkeleton.vue itself now uses DOM-mirror
 * (buildStructuralSkeleton), but walkDom still needs to be correct because
 * consumers can call it directly.
 *
 * happy-dom doesn't run layout, so `getBoundingClientRect` returns 0×0 by
 * default. We monkey-patch a layout function onto our mount root that walks
 * the DOM and assigns synthetic rects so the capture exercises every branch.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { walkDom } from '../src/utils/walkDom';

/**
 * Mount HTML and stamp synthetic `getBoundingClientRect` results onto every
 * descendant so walkDom has real geometry to capture. Each call to
 * `setRect(el, rect)` overrides the proto-level method on that element.
 */
function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  const root = document.getElementById('root')!;
  /* Default rect for the root */
  setRect(root, { x: 0, y: 0, width: 600, height: 400 });
  /* Walk descendants and give each a non-zero rect so the minSize filter
   * doesn't drop them. Layout is fake — top-down vertical stack at 100px
   * intervals, 80px tall. */
  let y = 0;
  for (const el of Array.from(root.querySelectorAll('*'))) {
    setRect(el as HTMLElement, { x: 0, y, width: 200, height: 80 });
    y += 100;
  }
  return root;
}

interface FakeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function setRect(el: HTMLElement, rect: FakeRect): void {
  (el as unknown as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect = () =>
    ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
      toJSON: () => rect,
    }) as DOMRect;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('walkDom — basics', () => {
  it('returns a frozen CachedShape with width / height / nodes', () => {
    const root = mount('<div>hi</div>');
    const shape = walkDom(root, { maxDepth: 6 });
    expect(shape).toBeDefined();
    expect(Object.isFrozen(shape)).toBe(true);
    expect(Object.isFrozen(shape.nodes)).toBe(true);
    expect(shape.nodes.length).toBeGreaterThan(0);
  });

  it('returns truncated:true when maxNodes is hit', () => {
    const items = Array.from({ length: 20 }, (_, i) => `<span>${i}</span>`).join('');
    const root = mount(`<div>${items}</div>`);
    const shape = walkDom(root, { maxDepth: 6, maxNodes: 3 });
    expect(shape.truncated).toBe(true);
  });

  it('captures zero nodes for an empty root', () => {
    const root = mount('');
    const shape = walkDom(root, { maxDepth: 6 });
    expect(shape.nodes.length).toBe(0);
  });

  it('does not throw on a deeply nested structure', () => {
    let html = '<span>leaf</span>';
    for (let i = 0; i < 30; i++) html = `<div>${html}</div>`;
    const root = mount(html);
    expect(() => walkDom(root, { maxDepth: 6, maxNodes: 50 })).not.toThrow();
  });
});

describe('walkDom — element opt-out attributes', () => {
  it('honours data-skeleton-ignore by skipping the element entirely', () => {
    const root = mount('<div data-skeleton-ignore></div><span>kept</span>');
    const shape = walkDom(root, { maxDepth: 6 });
    expect(shape.nodes.length).toBe(1);
  });

  it('honours data-skeleton-stop by treating the element as a leaf', () => {
    const root = mount('<div data-skeleton-stop><span>a</span><span>b</span></div>');
    const shape = walkDom(root, { maxDepth: 6 });
    expect(shape.nodes.length).toBe(1);
  });
});

describe('walkDom — leaf shapes', () => {
  it('captures atomic HTML leaves (img/svg/button/…) as a single node each', () => {
    const root = mount('<img src="x"/><svg></svg><button></button>');
    const shape = walkDom(root, { maxDepth: 6 });
    expect(shape.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it('classifies text-bearing elements as type=text', () => {
    const root = mount('<p>some content here</p>');
    const shape = walkDom(root, { maxDepth: 6 });
    const types = shape.nodes.map((n) => n.type);
    expect(types).toContain('text');
  });
});

describe('walkDom — geometry', () => {
  it('returns root-relative coordinates as rounded integers', () => {
    const root = mount('<div>x</div>');
    const shape = walkDom(root, { maxDepth: 6 });
    const node = shape.nodes[0];
    expect(node).toBeDefined();
    expect(Number.isInteger(node!.x)).toBe(true);
    expect(Number.isInteger(node!.y)).toBe(true);
    expect(Number.isInteger(node!.w)).toBe(true);
    expect(Number.isInteger(node!.h)).toBe(true);
  });

  it('subtracts the root rect from descendant rects so coords are root-relative', () => {
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById('root')!;
    setRect(root, { x: 100, y: 50, width: 600, height: 400 });
    root.innerHTML = '<span>foo</span>';
    setRect(root.firstElementChild as HTMLElement, { x: 110, y: 60, width: 80, height: 24 });
    const shape = walkDom(root, { maxDepth: 6 });
    /* 110 - 100 = 10, 60 - 50 = 10. */
    expect(shape.nodes[0]!.x).toBe(10);
    expect(shape.nodes[0]!.y).toBe(10);
  });
});

describe('walkDom — pre-computed style', () => {
  it('attaches a frozen pre-computed style to every node', () => {
    const root = mount('<div>x</div>');
    const shape = walkDom(root, { maxDepth: 6 });
    for (const n of shape.nodes) {
      expect(n.style).toBeDefined();
      expect(Object.isFrozen(n.style!)).toBe(true);
      expect(n.style?.left).toBeDefined();
      expect(n.style?.top).toBeDefined();
      expect(n.style?.width).toBeDefined();
      expect(n.style?.height).toBeDefined();
    }
  });
});
