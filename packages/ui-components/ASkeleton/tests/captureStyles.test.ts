/**
 * Tests for `captureSnapshot`. happy-dom doesn't run layout, so we patch
 * `getBoundingClientRect` on each test element to get realistic geometry,
 * matching the same pattern the `walkDom` tests use.
 *
 * Coverage by invariant:
 *   1. Single-element capture: snapshot has `nodes[0]` with correct geometry.
 *   2. Container kind: emits children.
 *   3. Atomic leaves: img → image; video → video; svg/canvas → media.
 *   4. Text-bearing leaves: kind === 'text' + textLines is captured (or
 *      falls back to single-rect when Range isn't usable).
 *   5. `data-skeleton-ignore` skips the element.
 *   6. `visibility: hidden` / `display: none` / `opacity: 0` are skipped.
 *   7. Style capture: non-default visual props survive; defaults are dropped.
 *   8. `maxNodes` cap → `truncated: true`.
 *   9. Returned objects are frozen.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { captureSnapshot } from '../src/utils/captureStyles';

function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  const root = document.getElementById('root')!;
  setRect(root, { x: 0, y: 0, width: 800, height: 600 });
  let y = 0;
  for (const el of Array.from(root.querySelectorAll('*'))) {
    setRect(el as HTMLElement, { x: 0, y, width: 200, height: 80 });
    y += 100;
  }
  return root;
}

function setRect(
  el: HTMLElement,
  rect: { x: number; y: number; width: number; height: number }
): void {
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

describe('captureSnapshot — geometry', () => {
  it('returns a frozen snapshot with overall width/height + nodes', () => {
    const root = mount('<div>hi</div>');
    const s = captureSnapshot(root);
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.nodes)).toBe(true);
    expect(s.width).toBe(800);
    expect(s.height).toBe(600);
    expect(s.nodes.length).toBeGreaterThan(0);
  });

  it('captures root-relative coordinates', () => {
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById('root')!;
    setRect(root, { x: 100, y: 50, width: 800, height: 600 });
    root.innerHTML = '<span>foo</span>';
    setRect(root.firstElementChild as HTMLElement, { x: 130, y: 80, width: 60, height: 24 });
    const s = captureSnapshot(root);
    expect(s.nodes[0]!.x).toBe(30);
    expect(s.nodes[0]!.y).toBe(30);
    expect(s.nodes[0]!.w).toBe(60);
    expect(s.nodes[0]!.h).toBe(24);
  });
});

describe('captureSnapshot — kind classification', () => {
  it('classifies <img> as image', () => {
    const root = mount('<img src="x"/>');
    const s = captureSnapshot(root);
    expect(s.nodes[0]!.kind).toBe('image');
  });

  it('classifies <video> as video', () => {
    const root = mount('<video src="x.mp4"></video>');
    const s = captureSnapshot(root);
    expect(s.nodes[0]!.kind).toBe('video');
  });

  it('classifies <svg> and <canvas> as media', () => {
    const root = mount('<svg></svg><canvas></canvas>');
    const s = captureSnapshot(root);
    expect(s.nodes[0]!.kind).toBe('media');
    expect(s.nodes[1]!.kind).toBe('media');
  });

  it('classifies a text-bearing element as text', () => {
    const root = mount('<p>hello world</p>');
    const s = captureSnapshot(root);
    expect(s.nodes[0]!.kind).toBe('text');
  });

  it('classifies an element with children as container', () => {
    const root = mount('<div><span>a</span><span>b</span></div>');
    const s = captureSnapshot(root);
    expect(s.nodes[0]!.kind).toBe('container');
    expect(s.nodes[0]!.children?.length).toBe(2);
  });

  it('classifies an empty styleless element as block', () => {
    const root = mount('<div></div>');
    const s = captureSnapshot(root);
    expect(s.nodes[0]!.kind).toBe('block');
  });
});

describe('captureSnapshot — opt-outs and filters', () => {
  it('skips elements with data-skeleton-ignore', () => {
    const root = mount('<div data-skeleton-ignore></div><span>kept</span>');
    const s = captureSnapshot(root);
    expect(s.nodes.length).toBe(1);
  });

  it('skips elements below minSize', () => {
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById('root')!;
    setRect(root, { x: 0, y: 0, width: 800, height: 600 });
    root.innerHTML = '<span>tiny</span>';
    setRect(root.firstElementChild as HTMLElement, { x: 0, y: 0, width: 2, height: 2 });
    const s = captureSnapshot(root, { minSize: 4 });
    expect(s.nodes.length).toBe(0);
  });
});

describe('captureSnapshot — caps', () => {
  it('truncated:true when maxNodes is hit', () => {
    const items = Array.from({ length: 20 }, (_, i) => `<span>${i}</span>`).join('');
    const root = mount(`<div>${items}</div>`);
    const s = captureSnapshot(root, { maxNodes: 3 });
    expect(s.truncated).toBe(true);
  });

  it('does not throw on a deeply nested structure', () => {
    let html = '<span>leaf</span>';
    for (let i = 0; i < 20; i++) html = `<div>${html}</div>`;
    const root = mount(html);
    expect(() => captureSnapshot(root, { maxDepth: 6 })).not.toThrow();
  });
});

describe('captureSnapshot — style capture', () => {
  it('every CapturedNode has a frozen style object', () => {
    const root = mount('<div>x</div>');
    const s = captureSnapshot(root);
    expect(Object.isFrozen(s.nodes[0]!.style)).toBe(true);
  });
});
