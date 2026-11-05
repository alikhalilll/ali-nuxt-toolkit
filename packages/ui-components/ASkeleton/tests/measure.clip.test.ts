/**
 * `clipWithin` — compose a rounded-corner clip inside an outer clip.
 */
import { describe, expect, it } from 'vitest';
import { clipWithin, cornersOf, intersect, near, radiiOf } from '../src/measure/clip';

function style(partial: Partial<Record<string, string>>): CSSStyleDeclaration {
  const map: Record<string, string> = {
    borderTopLeftRadius: '0px',
    borderTopRightRadius: '0px',
    borderBottomRightRadius: '0px',
    borderBottomLeftRadius: '0px',
    ...partial,
  };
  return map as unknown as CSSStyleDeclaration;
}

describe('intersect', () => {
  it('returns the input rect when no clip is active', () => {
    const r = { left: 0, right: 100, top: 0, bottom: 100 };
    expect(intersect(null, r)).toEqual(r);
  });

  it('shrinks the rect to the clip bounds', () => {
    const clip = { left: 10, right: 90, top: 10, bottom: 90, corners: [0, 0, 0, 0] as const };
    const r = { left: 0, right: 100, top: 0, bottom: 100 };
    expect(intersect(clip, r)).toEqual({ left: 10, right: 90, top: 10, bottom: 90 });
  });
});

describe('cornersOf', () => {
  it('returns top-left, top-right, bottom-right, bottom-left', () => {
    const r = { left: 0, right: 10, top: 0, bottom: 10 };
    expect(cornersOf(r)).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
  });
});

describe('near', () => {
  it('treats sub-1px distances as near', () => {
    expect(near([0, 0], [0.5, 0.5])).toBe(true);
    expect(near([0, 0], [1.5, 0])).toBe(false);
  });
});

describe('radiiOf', () => {
  it('reads px values from the four corner CSS properties', () => {
    const r = { left: 0, right: 100, top: 0, bottom: 100 };
    expect(radiiOf(style({ borderTopLeftRadius: '8px', borderTopRightRadius: '4px' }), r)).toEqual([
      8, 4, 0, 0,
    ]);
  });

  it('converts percentage radii against the smaller axis', () => {
    const r = { left: 0, right: 100, top: 0, bottom: 50 };
    expect(radiiOf(style({ borderTopLeftRadius: '50%' }), r)).toEqual([25, 0, 0, 0]);
  });
});

describe('clipWithin', () => {
  it('inherits the outer clip corner when the child is clipped at the corner', () => {
    /* Outer: 0,0 → 100,100 with `border-top-left-radius: 10px`.
     * Inner (own rect): -10,-10 → 50,50 — extends PAST the outer, so
     * intersection clips its top-left to (0,0). The box's TL (0,0)
     * matches the outer's TL but NOT the inner's own TL (-10,-10), so
     * the clip's radius is inherited. */
    const outerStyle = style({ borderTopLeftRadius: '10px' });
    const outerRect = { left: 0, right: 100, top: 0, bottom: 100 };
    const outer = clipWithin(null, outerRect, outerStyle);
    const inner = clipWithin(outer, { left: -10, right: 50, top: -10, bottom: 50 }, style({}));
    expect(inner?.corners[0]).toBe(10);
    expect(inner?.corners[1]).toBe(0);
  });

  it("uses the child's own radius when the child's corner wins", () => {
    /* Outer with no radius, inner inside outer with its own 5px TL. */
    const outer = clipWithin(null, { left: 0, right: 100, top: 0, bottom: 100 }, style({}));
    const inner = clipWithin(
      outer,
      { left: 20, right: 80, top: 20, bottom: 80 },
      style({ borderTopLeftRadius: '5px' })
    );
    expect(inner?.corners[0]).toBe(5);
  });

  it('returns 0 radius for corners that touch neither', () => {
    /* Inner strictly inside outer: no corners touch either box. */
    const outer = clipWithin(
      null,
      { left: 0, right: 100, top: 0, bottom: 100 },
      style({ borderTopLeftRadius: '10px' })
    );
    const inner = clipWithin(outer, { left: 20, right: 80, top: 20, bottom: 80 }, style({}));
    expect(inner?.corners).toEqual([0, 0, 0, 0]);
  });
});
