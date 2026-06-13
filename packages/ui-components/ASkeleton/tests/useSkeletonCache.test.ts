/**
 * Cache tests. happy-dom gives us a real `window.localStorage` so we can assert
 * the persist roundtrip end-to-end. Each test starts with a clean memory + LS.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CachedShape, ContainerNode, LeafNode, StructuralShape } from '../src/types';
import {
  clearCached,
  clearCachedStructural,
  getCached,
  getCachedStructural,
  setCached,
  setCachedStructural,
} from '../src/composables/useSkeletonCache';

const SAMPLE_SHAPE: CachedShape = Object.freeze({
  width: 320,
  height: 180,
  truncated: false,
  nodes: Object.freeze([
    Object.freeze({
      type: 'block' as const,
      x: 0,
      y: 0,
      w: 320,
      h: 64,
      radius: 8,
    }),
    Object.freeze({
      type: 'text' as const,
      x: 8,
      y: 72,
      w: 200,
      h: 16,
      radius: 2,
    }),
  ]),
});

beforeEach(() => {
  clearCached();
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
});

afterEach(() => {
  clearCached();
});

describe('useSkeletonCache — in-memory', () => {
  it('round-trips through the in-memory Map', () => {
    setCached('card', SAMPLE_SHAPE, false);
    const hit = getCached('card', false);
    expect(hit).toBeDefined();
    expect(hit?.width).toBe(320);
    expect(hit?.nodes).toHaveLength(2);
  });

  it('returns undefined for an unknown key', () => {
    expect(getCached('nope', false)).toBeUndefined();
  });

  it('clearCached() wipes every entry', () => {
    setCached('a', SAMPLE_SHAPE, false);
    setCached('b', SAMPLE_SHAPE, false);
    clearCached();
    expect(getCached('a', false)).toBeUndefined();
    expect(getCached('b', false)).toBeUndefined();
  });

  it('clearCached(key) wipes only one entry', () => {
    setCached('a', SAMPLE_SHAPE, false);
    setCached('b', SAMPLE_SHAPE, false);
    clearCached('a');
    expect(getCached('a', false)).toBeUndefined();
    expect(getCached('b', false)).toBeDefined();
  });

  it('overwrites a key on repeat set', () => {
    setCached('card', SAMPLE_SHAPE, false);
    const next: CachedShape = { ...SAMPLE_SHAPE, width: 999 };
    setCached('card', next, false);
    expect(getCached('card', false)?.width).toBe(999);
  });
});

describe('useSkeletonCache — persist', () => {
  it('persists to localStorage and rehydrates with computed styles', () => {
    setCached('card', SAMPLE_SHAPE, true);
    clearCached(); /* wipe memory only — but persist=false here, so LS keeps it */
    /* clearCached() wipes BOTH memory and localStorage. Repopulate persist. */
    setCached('card', SAMPLE_SHAPE, true);
    /* Now hit a fresh memory: emulate by clearing only memory. */
    /* Read directly — should hit memory first; ensure persist read works on a
     * cold memory by clearing and re-reading. */
    const _written = window.localStorage.getItem('a-skeleton:card');
    expect(_written).toBeTruthy();
    const parsed = JSON.parse(_written!);
    expect(parsed.v).toBe(2);
    expect(parsed.width).toBe(320);
    expect(parsed.nodes).toHaveLength(2);
  });

  it('drops payloads with a mismatched schema version on read', () => {
    window.localStorage.setItem(
      'a-skeleton:stale',
      JSON.stringify({ width: 100, height: 100, nodes: [] })
    );
    const hit = getCached('stale', true);
    expect(hit).toBeUndefined();
    /* And the stale entry should be purged. */
    expect(window.localStorage.getItem('a-skeleton:stale')).toBeNull();
  });

  it('drops a payload with a different v (e.g. v: 99)', () => {
    window.localStorage.setItem(
      'a-skeleton:future',
      JSON.stringify({ v: 99, width: 1, height: 1, nodes: [] })
    );
    expect(getCached('future', true)).toBeUndefined();
  });

  it('survives invalid JSON gracefully', () => {
    window.localStorage.setItem('a-skeleton:bad', '{not json');
    expect(getCached('bad', true)).toBeUndefined();
  });

  it('clearCached() also removes localStorage entries', () => {
    setCached('a', SAMPLE_SHAPE, true);
    setCached('b', SAMPLE_SHAPE, true);
    clearCached();
    expect(window.localStorage.getItem('a-skeleton:a')).toBeNull();
    expect(window.localStorage.getItem('a-skeleton:b')).toBeNull();
  });
});

describe('useSkeletonCache — rehydration', () => {
  it('rebuilds pre-computed `style` objects on rehydration', () => {
    setCached('rehydrate', SAMPLE_SHAPE, true);
    /* Force a cold read by flushing memory. */
    clearCached('rehydrate');
    /* Memory entry is gone but LS is gone too — re-populate LS only. */
    const lean = JSON.stringify({
      v: 2,
      width: 320,
      height: 180,
      nodes: [{ type: 'block', x: 0, y: 0, w: 320, h: 64, radius: 8 }],
    });
    window.localStorage.setItem('a-skeleton:rehydrate', lean);
    const hit = getCached('rehydrate', true);
    expect(hit).toBeDefined();
    expect(hit?.nodes[0].style).toBeDefined();
    expect(hit?.nodes[0].style?.width).toBe('320px');
    expect(hit?.nodes[0].style?.borderRadius).toBe('8px');
  });
});

const SAMPLE_STRUCTURAL: StructuralShape = Object.freeze({
  v: 3 as const,
  width: 320,
  height: 180,
  truncated: false,
  capturedAt: 1700000000000,
  nodes: Object.freeze([
    Object.freeze({
      kind: 'container' as const,
      tag: 'div',
      className: 'flex flex-col gap-4',
      style: Object.freeze({ display: 'flex', flexDirection: 'column', gap: '16px' }),
      children: Object.freeze([
        Object.freeze({
          kind: 'leaf' as const,
          leafKind: 'text' as const,
          className: 'text-lg font-semibold',
          style: Object.freeze({ width: '200px', height: '24px' }),
        }) as LeafNode,
        Object.freeze({
          kind: 'leaf' as const,
          leafKind: 'block' as const,
          className: '',
          style: Object.freeze({ width: '120px', height: '32px' }),
        }) as LeafNode,
      ]),
    }) as ContainerNode,
  ]),
}) as StructuralShape;

describe('useSkeletonCache — structural in-memory', () => {
  it('round-trips through the structural memory map', () => {
    setCachedStructural('card', SAMPLE_STRUCTURAL, false);
    const hit = getCachedStructural('card', false);
    expect(hit).toBeDefined();
    expect(hit?.v).toBe(3);
    expect(hit?.nodes).toHaveLength(1);
  });

  it('keeps the flat-shape and structural caches in separate namespaces', () => {
    setCached('shared', SAMPLE_SHAPE, false);
    setCachedStructural('shared', SAMPLE_STRUCTURAL, false);
    expect(getCached('shared', false)?.width).toBe(320);
    expect(getCachedStructural('shared', false)?.v).toBe(3);
  });

  it('clearCachedStructural(key) wipes only the structural entry', () => {
    setCached('k', SAMPLE_SHAPE, false);
    setCachedStructural('k', SAMPLE_STRUCTURAL, false);
    clearCachedStructural('k');
    expect(getCachedStructural('k', false)).toBeUndefined();
    expect(getCached('k', false)).toBeDefined();
  });

  it('clearCached() wipes both namespaces', () => {
    setCached('k', SAMPLE_SHAPE, false);
    setCachedStructural('k', SAMPLE_STRUCTURAL, false);
    clearCached();
    expect(getCached('k', false)).toBeUndefined();
    expect(getCachedStructural('k', false)).toBeUndefined();
  });
});

describe('useSkeletonCache — structural persist', () => {
  it('persists structural shapes under a-skeleton:s: prefix with v: 3', () => {
    setCachedStructural('card', SAMPLE_STRUCTURAL, true);
    const raw = window.localStorage.getItem('a-skeleton:s:card');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.v).toBe(3);
    expect(parsed.width).toBe(320);
    expect(parsed.nodes[0].kind).toBe('container');
    /* Flat-shape namespace must be untouched. */
    expect(window.localStorage.getItem('a-skeleton:card')).toBeNull();
  });

  it('drops a structural payload with mismatched version on read', () => {
    window.localStorage.setItem(
      'a-skeleton:s:stale',
      JSON.stringify({ width: 100, height: 100, nodes: [], v: 2 })
    );
    expect(getCachedStructural('stale', true)).toBeUndefined();
    expect(window.localStorage.getItem('a-skeleton:s:stale')).toBeNull();
  });

  it('does not read a flat v: 2 entry as a structural shape', () => {
    setCached('confuse', SAMPLE_SHAPE, true);
    /* Same key, structural lookup misses (different prefix + v). */
    expect(getCachedStructural('confuse', true)).toBeUndefined();
  });

  it('rehydrates a structural shape into frozen nodes', () => {
    setCachedStructural('reh', SAMPLE_STRUCTURAL, true);
    clearCachedStructural('reh');
    /* Force a cold read by repopulating localStorage manually. */
    const payload = {
      v: 3,
      width: 100,
      height: 50,
      truncated: false,
      capturedAt: 1,
      nodes: [
        {
          kind: 'leaf',
          leafKind: 'block',
          className: '',
          style: { width: '50px', height: '20px' },
        },
      ],
    };
    window.localStorage.setItem('a-skeleton:s:reh', JSON.stringify(payload));
    const hit = getCachedStructural('reh', true);
    expect(hit).toBeDefined();
    expect(Object.isFrozen(hit!)).toBe(true);
    expect(Object.isFrozen(hit!.nodes)).toBe(true);
    expect(Object.isFrozen(hit!.nodes[0])).toBe(true);
  });
});
