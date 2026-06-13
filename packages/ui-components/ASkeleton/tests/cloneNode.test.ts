/**
 * `CloneNode` — regression coverage for the coordinate-translation contract.
 *
 * `CapturedNode.{x,y}` is root-relative, but containers render their children
 * inside a `position: absolute` parent. The renderer subtracts the container's
 * offset from each child's coords so descendants land at their captured
 * root-relative position regardless of how deeply they're nested. If this
 * regression slips, the first symptom is doubled offsets — a leaf at (50, 100)
 * inside a container at (50, 100) lands at (100, 200) on screen.
 */
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { CloneNode } from '../src/components/CloneNode';
import type { CapturedNode, TextLineRect } from '../src/utils/captureStyles';

const ROOT_BLOCK_STYLE = (n: CapturedNode): Record<string, unknown> => ({
  position: 'absolute',
  left: `${n.x}px`,
  top: `${n.y}px`,
  width: `${n.w}px`,
  height: `${n.h}px`,
  ...n.style,
});

const LINE_STYLE = (line: TextLineRect): Record<string, unknown> => ({
  position: 'absolute',
  left: `${line.x}px`,
  top: `${line.y}px`,
  width: `${line.w}px`,
  height: `${line.h}px`,
});

function makeContainer(
  partial: Partial<CapturedNode> & { x: number; y: number; w: number; h: number },
  children: CapturedNode[]
): CapturedNode {
  return Object.freeze({
    tag: 'div',
    kind: 'container' as const,
    style: Object.freeze({}),
    children: Object.freeze(children),
    ...partial,
  }) as CapturedNode;
}

function makeLeaf(
  partial: Partial<CapturedNode> & { x: number; y: number; w: number; h: number }
): CapturedNode {
  return Object.freeze({
    tag: 'span',
    kind: 'block' as const,
    style: Object.freeze({}),
    ...partial,
  }) as CapturedNode;
}

function mountTree(node: CapturedNode) {
  const Wrapper = defineComponent({
    render: () =>
      h(CloneNode, {
        node,
        animClass: null,
        blockStyle: ROOT_BLOCK_STYLE,
        lineStyle: LINE_STYLE,
      }),
  });
  return mount(Wrapper);
}

describe('CloneNode — coordinate translation', () => {
  it('renders a top-level leaf at its root-relative coords', () => {
    const wrapper = mountTree(makeLeaf({ x: 10, y: 20, w: 40, h: 30 }));
    const leaf = wrapper.element as HTMLElement;
    expect(leaf.classList.contains('a-skel-clone-leaf')).toBe(true);
    expect(leaf.style.left).toBe('10px');
    expect(leaf.style.top).toBe('20px');
  });

  it("renders a container's child at coords relative to the container, not the root", () => {
    /* Container at root (21, 141) with a leaf inside at root (21, 141).
     * Without the fix, the leaf's `position: absolute; left: 21px; top: 141px`
     * resolves inside the container (which is itself at (21, 141)),
     * doubling the offset to (42, 282). With the fix, it's (0, 0). */
    const container = makeContainer({ x: 21, y: 141, w: 200, h: 40 }, [
      makeLeaf({ x: 21, y: 141, w: 60, h: 40 }),
    ]);
    const wrapper = mountTree(container);
    const outer = wrapper.element as HTMLElement;
    expect(outer.classList.contains('a-skel-clone-container')).toBe(true);
    expect(outer.style.left).toBe('21px');
    expect(outer.style.top).toBe('141px');
    const leaf = outer.querySelector('.a-skel-clone-leaf') as HTMLElement;
    expect(leaf).not.toBeNull();
    expect(leaf.style.left).toBe('0px');
    expect(leaf.style.top).toBe('0px');
  });

  it('translates grandchildren correctly through nested containers', () => {
    /* Root container (0,0). Inner container (10, 20). Leaf (50, 100).
     *   Inner renders at (10, 20) inside root → root-coords (10, 20).
     *   Leaf renders at (50-10, 100-20) = (40, 80) inside inner →
     *   root-coords (10+40, 20+80) = (50, 100). ✓ */
    const tree = makeContainer({ x: 0, y: 0, w: 300, h: 300 }, [
      makeContainer({ x: 10, y: 20, w: 200, h: 200 }, [makeLeaf({ x: 50, y: 100, w: 30, h: 30 })]),
    ]);
    const wrapper = mountTree(tree);
    const outer = wrapper.element as HTMLElement;
    expect(outer.style.left).toBe('0px');
    expect(outer.style.top).toBe('0px');
    const inner = outer.querySelector('.a-skel-clone-container') as HTMLElement;
    expect(inner).not.toBeNull();
    expect(inner.style.left).toBe('10px');
    expect(inner.style.top).toBe('20px');
    const leaf = inner.querySelector('.a-skel-clone-leaf') as HTMLElement;
    expect(leaf).not.toBeNull();
    expect(leaf.style.left).toBe('40px');
    expect(leaf.style.top).toBe('80px');
  });
});
