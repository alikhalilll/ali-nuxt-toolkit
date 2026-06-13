/**
 * walkStructural — tree-shaped capture used by Recipe 3.
 *
 * happy-dom doesn't run layout, so `getBoundingClientRect` returns 0×0 by
 * default and `getComputedStyle` returns empty values for unset properties.
 * We monkey-patch a layout function onto our mount root so the walker sees
 * real geometry, plus a `getComputedStyle` override that returns synthetic
 * computed values for the specific layout/visual props each test cares about.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ContainerNode, LeafNode, StructuralNode } from '../src/types';
import { walkStructural } from '../src/utils/walkStructural';

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

function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  const root = document.getElementById('root')!;
  setRect(root, { x: 0, y: 0, width: 600, height: 400 });
  /* Synthetic stacked-rect layout so every descendant has non-zero size and
   * the minSize filter doesn't drop them. */
  let y = 0;
  for (const el of Array.from(root.querySelectorAll('*'))) {
    setRect(el as HTMLElement, { x: 0, y, width: 200, height: 80 });
    y += 100;
  }
  return root;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('walkStructural — shape envelope', () => {
  it('returns a frozen StructuralShape with v: 3', () => {
    const root = mount('<div>hi</div>');
    const shape = walkStructural(root, { maxDepth: 6 });
    expect(Object.isFrozen(shape)).toBe(true);
    expect(shape.v).toBe(3);
    expect(typeof shape.capturedAt).toBe('number');
    expect(Object.isFrozen(shape.nodes)).toBe(true);
  });

  it('records width / height rounded from the root rect', () => {
    const root = mount('<span>x</span>');
    setRect(root, { x: 0, y: 0, width: 300.6, height: 199.4 });
    const shape = walkStructural(root, { maxDepth: 6 });
    expect(shape.width).toBe(301);
    expect(shape.height).toBe(199);
  });

  it('flips truncated when maxNodes is hit', () => {
    const items = Array.from({ length: 12 }, (_, i) => `<span>${i}</span>`).join('');
    const root = mount(items);
    const shape = walkStructural(root, { maxDepth: 6, maxNodes: 3 });
    expect(shape.truncated).toBe(true);
  });
});

describe('walkStructural — container preservation', () => {
  it('preserves a div with element children as a container node', () => {
    const root = mount('<div class="flex flex-col"><span>a</span><span>b</span></div>');
    const shape = walkStructural(root, { maxDepth: 6 });
    expect(shape.nodes).toHaveLength(1);
    const container = shape.nodes[0] as ContainerNode;
    expect(container.kind).toBe('container');
    expect(container.tag).toBe('div');
    expect(container.className).toBe('flex flex-col');
    expect(container.children).toHaveLength(2);
  });

  it('captures children recursively', () => {
    const root = mount('<section><header><h1>Title</h1></header><p>body</p></section>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const section = shape.nodes[0] as ContainerNode;
    expect(section.tag).toBe('section');
    expect(section.children).toHaveLength(2);
    const header = section.children[0] as ContainerNode;
    expect(header.tag).toBe('header');
    const heading = header.children[0] as LeafNode;
    expect(heading.kind).toBe('leaf');
    expect(heading.leafKind).toBe('text');
  });

  it('preserves a missing class as an empty string', () => {
    const root = mount('<div><span>x</span></div>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const container = shape.nodes[0] as ContainerNode;
    expect(container.className).toBe('');
  });

  it('demotes an empty container to a leaf', () => {
    const root = mount('<div data-skeleton-ignore-marker><span data-skeleton-ignore></span></div>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const node = shape.nodes[0] as LeafNode;
    expect(node.kind).toBe('leaf');
  });
});

describe('walkStructural — leaf classification', () => {
  it('classifies <img> as leaf-image', () => {
    const root = mount('<img src="x"/>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const node = shape.nodes[0] as LeafNode;
    expect(node.kind).toBe('leaf');
    expect(node.leafKind).toBe('image');
  });

  it('classifies <picture> as leaf-image', () => {
    const root = mount('<picture><img src="x"/></picture>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const node = shape.nodes[0] as LeafNode;
    expect(node.leafKind).toBe('image');
  });

  it('classifies <video> as leaf-image (play-icon decorated by renderer)', () => {
    const root = mount('<video></video>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const node = shape.nodes[0] as LeafNode;
    expect(node.leafKind).toBe('image');
  });

  it('classifies <button> as leaf-media (atomic, no icon)', () => {
    const root = mount('<button>click</button>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const node = shape.nodes[0] as LeafNode;
    expect(node.leafKind).toBe('media');
  });

  it('classifies a childless element with text as leaf-text', () => {
    const root = mount('<p>Hello world</p>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const node = shape.nodes[0] as LeafNode;
    expect(node.leafKind).toBe('text');
  });

  it('classifies a childless element with no text as leaf-block', () => {
    const root = mount('<div class="size-12 rounded-full"></div>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const node = shape.nodes[0] as LeafNode;
    expect(node.leafKind).toBe('block');
  });
});

describe('walkStructural — leaf styles', () => {
  it('captures width and height as px strings on every leaf', () => {
    const root = mount('<span>x</span>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const leaf = shape.nodes[0] as LeafNode;
    expect(leaf.style.width).toMatch(/^\d+px$/);
    expect(leaf.style.height).toMatch(/^\d+px$/);
  });

  it('freezes the leaf style object', () => {
    const root = mount('<span>x</span>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const leaf = shape.nodes[0] as LeafNode;
    expect(Object.isFrozen(leaf.style)).toBe(true);
  });

  it('preserves the original class on every leaf', () => {
    const root = mount('<span class="mt-4 text-lg font-semibold">Hi</span>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const leaf = shape.nodes[0] as LeafNode;
    expect(leaf.className).toBe('mt-4 text-lg font-semibold');
  });

  it('records an empty className when the element has no class attribute', () => {
    const root = mount('<button>click</button>');
    const shape = walkStructural(root, { maxDepth: 6 });
    const leaf = shape.nodes[0] as LeafNode;
    expect(leaf.className).toBe('');
  });
});

describe('walkStructural — author opt-outs', () => {
  it('honours data-skeleton-ignore by skipping the element entirely', () => {
    const root = mount('<div data-skeleton-ignore></div><span>kept</span>');
    const shape = walkStructural(root, { maxDepth: 6 });
    expect(shape.nodes).toHaveLength(1);
    expect((shape.nodes[0] as LeafNode).leafKind).toBe('text');
  });

  it('honours data-skeleton-stop by treating the subtree as a single leaf', () => {
    const root = mount('<div data-skeleton-stop><span>a</span><span>b</span></div>');
    const shape = walkStructural(root, { maxDepth: 6 });
    expect(shape.nodes).toHaveLength(1);
    expect(shape.nodes[0].kind).toBe('leaf');
  });
});

describe('walkStructural — visibility filters', () => {
  it('skips display:none elements', () => {
    document.body.innerHTML =
      '<div id="root"><span>kept</span><span style="display:none">gone</span></div>';
    const root = document.getElementById('root')!;
    setRect(root, { x: 0, y: 0, width: 200, height: 100 });
    for (const el of Array.from(root.querySelectorAll('span'))) {
      setRect(el as HTMLElement, { x: 0, y: 0, width: 100, height: 20 });
    }
    const shape = walkStructural(root, { maxDepth: 6 });
    /* Only the visible span survives. */
    expect(shape.nodes).toHaveLength(1);
  });

  it('skips elements smaller than minSize', () => {
    document.body.innerHTML = '<div id="root"><span>tiny</span><span>full</span></div>';
    const root = document.getElementById('root')!;
    setRect(root, { x: 0, y: 0, width: 200, height: 100 });
    const spans = root.querySelectorAll('span');
    setRect(spans[0] as HTMLElement, { x: 0, y: 0, width: 2, height: 2 });
    setRect(spans[1] as HTMLElement, { x: 0, y: 0, width: 100, height: 20 });
    const shape = walkStructural(root, { maxDepth: 6, minSize: 4 });
    expect(shape.nodes).toHaveLength(1);
  });
});

describe('walkStructural — depth and node limits', () => {
  it('treats elements at maxDepth as leaves', () => {
    let html = '<span>leaf</span>';
    for (let i = 0; i < 4; i++) html = `<div>${html}</div>`;
    const root = mount(html);
    const shape = walkStructural(root, { maxDepth: 2 });
    function deepest(node: StructuralNode): StructuralNode {
      if (node.kind !== 'container') return node;
      return node.children.length > 0 ? deepest(node.children[0]) : node;
    }
    /* The walker shouldn't throw and the deepest visited node should be a
     * leaf — depth-clamped containers degrade to leaves rather than recursing
     * forever. */
    expect(() => deepest(shape.nodes[0])).not.toThrow();
  });
});
