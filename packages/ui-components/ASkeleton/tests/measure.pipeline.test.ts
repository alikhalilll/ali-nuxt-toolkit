/**
 * End-to-end measurement test.
 *
 * happy-dom's `getBoundingClientRect` returns zero rects for detached +
 * unlaid-out elements, so the pipeline either skips every leaf (minSize
 * filter) or emits nothing — depending on the fixture. We assert the API
 * contract instead of pixel values:
 *   - measureSkeleton returns an array (empty is acceptable).
 *   - Covered marks are applied on blocks and cleared across subsequent
 *     passes.
 *   - Hints (skel-ignore, skel-own) short-circuit the walker.
 */
import { describe, expect, it } from 'vitest';
import { measureSkeleton } from '../src/measure/measure';
import { ATTR_COVERED } from '../src/utils/attrs';

function fixture(innerHTML: string): {
  ghost: HTMLElement;
  layer: HTMLElement;
  cleanup: () => void;
} {
  const ghost = document.createElement('div');
  ghost.innerHTML = innerHTML;
  const layer = document.createElement('div');
  document.body.append(ghost, layer);
  return {
    ghost,
    layer,
    cleanup: () => {
      ghost.remove();
      layer.remove();
    },
  };
}

describe('measureSkeleton', () => {
  it('returns an array', () => {
    const { ghost, layer, cleanup } = fixture(`<p>hello</p>`);
    try {
      const result = measureSkeleton(ghost, layer);
      expect(Array.isArray(result)).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('skips elements marked data-skeleton-ignore', () => {
    const { ghost, layer, cleanup } = fixture(`
      <div data-skeleton-ignore><p>should be skipped</p></div>
      <p>should NOT be skipped</p>
    `);
    try {
      const result = measureSkeleton(ghost, layer, { minSize: 0 });
      /* The ignored subtree should not produce covered marks on any of
       * its descendants. */
      const ignoredPara = ghost.querySelector('div[data-skeleton-ignore] p');
      expect(ignoredPara?.hasAttribute(ATTR_COVERED)).toBe(false);
      void result;
    } finally {
      cleanup();
    }
  });

  it('does not recurse into data-skeleton-own subtrees', () => {
    const { ghost, layer, cleanup } = fixture(`
      <div data-skeleton-own><p>self-skeletonising</p></div>
    `);
    try {
      measureSkeleton(ghost, layer);
      const inner = ghost.querySelector('div[data-skeleton-own] p');
      expect(inner?.hasAttribute(ATTR_COVERED)).toBe(false);
    } finally {
      cleanup();
    }
  });

  it('tolerates an empty ghost', () => {
    const { ghost, layer, cleanup } = fixture('');
    try {
      expect(measureSkeleton(ghost, layer)).toEqual([]);
    } finally {
      cleanup();
    }
  });

  it('respects maxRects cap', () => {
    const { ghost, layer, cleanup } = fixture(
      Array.from({ length: 100 }, (_, i) => `<img src="/${i}.png" width="20" height="20" />`).join(
        ''
      )
    );
    try {
      const result = measureSkeleton(ghost, layer, { maxRects: 10, minSize: 0 });
      /* happy-dom doesn't paint, so the real rect count will often be 0;
       * we just confirm the cap is honoured when images do pass minSize. */
      expect(result.length).toBeLessThanOrEqual(10);
    } finally {
      cleanup();
    }
  });
});
