import { describe, expect, it } from 'vitest';
import { clearSkeleton, drawSkeleton } from '../src/measure/shimmer';
import { ATTR_RECT } from '../src/utils/attrs';

describe('drawSkeleton', () => {
  it("mounts one bone per rect in the layer's shadow root", () => {
    const layer = document.createElement('div');
    document.body.appendChild(layer);
    try {
      drawSkeleton(layer, [
        { x: 0, y: 0, width: 40, height: 10, radius: '4px' },
        { x: 50, y: 0, width: 40, height: 10, radius: '4px' },
      ]);
      const bones = layer.shadowRoot!.querySelectorAll(`[${ATTR_RECT}]`);
      expect(bones).toHaveLength(2);
      expect((bones[0] as HTMLElement).style.width).toBe('40px');
    } finally {
      layer.remove();
    }
  });

  it('reuses bone elements across redraws (pool pattern)', () => {
    const layer = document.createElement('div');
    document.body.appendChild(layer);
    try {
      drawSkeleton(layer, [{ x: 0, y: 0, width: 40, height: 10, radius: '4px' }]);
      const first = layer.shadowRoot!.querySelector(`[${ATTR_RECT}]`);
      drawSkeleton(layer, [
        { x: 0, y: 0, width: 60, height: 20, radius: '4px' },
        { x: 70, y: 0, width: 30, height: 20, radius: '4px' },
      ]);
      const after = layer.shadowRoot!.querySelectorAll(`[${ATTR_RECT}]`);
      expect(after).toHaveLength(2);
      /* The first bone should have been reused (same reference). */
      expect(after[0]).toBe(first);
    } finally {
      layer.remove();
    }
  });

  it('shrinks the pool when rects decrease', () => {
    const layer = document.createElement('div');
    document.body.appendChild(layer);
    try {
      drawSkeleton(layer, [
        { x: 0, y: 0, width: 40, height: 10, radius: '0' },
        { x: 0, y: 20, width: 40, height: 10, radius: '0' },
      ]);
      drawSkeleton(layer, [{ x: 0, y: 0, width: 40, height: 10, radius: '0' }]);
      const bones = layer.shadowRoot!.querySelectorAll(`[${ATTR_RECT}]`);
      expect(bones).toHaveLength(1);
    } finally {
      layer.remove();
    }
  });

  it('clearSkeleton removes all bones', () => {
    const layer = document.createElement('div');
    document.body.appendChild(layer);
    try {
      drawSkeleton(layer, [{ x: 0, y: 0, width: 40, height: 10, radius: '0' }]);
      clearSkeleton(layer);
      const bones = layer.shadowRoot!.querySelectorAll(`[${ATTR_RECT}]`);
      expect(bones).toHaveLength(0);
    } finally {
      layer.remove();
    }
  });
});
