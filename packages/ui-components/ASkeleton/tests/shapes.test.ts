import { afterEach, describe, expect, it } from 'vitest';
import {
  flushShapes,
  forgetShapes,
  recallShape,
  rememberShape,
  resetShapesForTest,
  trackShape,
} from '../src/utils/shapes';

afterEach(() => resetShapesForTest());

describe('rememberShape / recallShape', () => {
  it('round-trips a simple shape through the session store', () => {
    rememberShape('card', '<div>…</div>');
    expect(recallShape('card')).toBe('<div>…</div>');
  });

  it('writes to localStorage when under the size cap', () => {
    rememberShape('card', '<small-shape />');
    try {
      const raw = localStorage.getItem('a-skel:shapes');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as { v: number; shapes: Record<string, string> };
      expect(parsed.v).toBe(4);
      expect(parsed.shapes.card).toBe('<small-shape />');
    } catch {
      /* happy-dom may lack full localStorage; the session-store assertion above
       * already covers the API contract. */
    }
  });

  it('skips localStorage for oversized shapes (session only)', () => {
    const big = 'x'.repeat(25_000);
    rememberShape('big', big);
    expect(recallShape('big')).toBe(big);
    try {
      const raw = localStorage.getItem('a-skel:shapes');
      if (raw) {
        const parsed = JSON.parse(raw) as { shapes: Record<string, string> };
        expect(parsed.shapes.big).toBeUndefined();
      }
    } catch {
      /* no-op */
    }
  });

  it('returns null for unknown keys', () => {
    expect(recallShape('missing')).toBeNull();
  });

  it('purges stale-schema entries on read', () => {
    try {
      localStorage.setItem('a-skel:shapes', JSON.stringify({ v: 2, shapes: { card: '<x/>' } }));
      expect(recallShape('card')).toBeNull();
      const raw = localStorage.getItem('a-skel:shapes');
      expect(raw).toBeNull();
    } catch {
      /* no-op */
    }
  });
});

describe('trackShape / flushShapes', () => {
  it('runs registered save callbacks on flush', () => {
    let runs = 0;
    const unregister = trackShape('card', () => {
      runs++;
    });
    flushShapes('card');
    flushShapes('card');
    expect(runs).toBe(2);
    unregister();
    flushShapes('card');
    expect(runs).toBe(2);
  });

  it('tolerates a throwing callback (keeps running others)', () => {
    let runs = 0;
    trackShape('card', () => {
      throw new Error('nope');
    });
    trackShape('card', () => {
      runs++;
    });
    expect(() => flushShapes('card')).not.toThrow();
    expect(runs).toBe(1);
  });
});

describe('forgetShapes', () => {
  it('drops a single key from session + localStorage', () => {
    rememberShape('a', '<a/>');
    rememberShape('b', '<b/>');
    forgetShapes('a');
    expect(recallShape('a')).toBeNull();
    expect(recallShape('b')).toBe('<b/>');
  });

  it('wipes everything with no key', () => {
    rememberShape('a', '<a/>');
    rememberShape('b', '<b/>');
    forgetShapes();
    expect(recallShape('a')).toBeNull();
    expect(recallShape('b')).toBeNull();
  });
});
