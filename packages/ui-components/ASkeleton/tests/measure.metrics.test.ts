/**
 * `metricsOf` + `barOf` — font-metric-aware text bar placement.
 *
 * happy-dom lacks a canvas 2D context, so `metricsOf` returns `null` and
 * `barOf` falls back to the geometric 72%-of-fontSize centre. We verify
 * (a) the cache keys are consistent and (b) the fallback produces a
 * centred bar.
 */
import { describe, expect, it } from 'vitest';
import { barOf, metricsOf, resetMetricsForTest } from '../src/measure/metrics';

function style(partial: Partial<Record<string, string>>): CSSStyleDeclaration {
  const map: Record<string, string> = {
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: '16px',
    fontFamily: 'sans-serif',
    ...partial,
  };
  return {
    fontStyle: map.fontStyle,
    fontWeight: map.fontWeight,
    fontSize: map.fontSize,
    fontFamily: map.fontFamily,
    getPropertyValue: (name: string) => map[name] ?? '',
  } as unknown as CSSStyleDeclaration;
}

describe('metricsOf', () => {
  it('returns null when canvas is unavailable (happy-dom)', () => {
    resetMetricsForTest();
    expect(metricsOf(style({}))).toBeNull();
  });

  it('caches by font key so repeated lookups do not recompute', () => {
    resetMetricsForTest();
    const first = metricsOf(style({ fontSize: '18px' }));
    const second = metricsOf(style({ fontSize: '18px' }));
    expect(first).toBe(second);
  });
});

describe('barOf (fallback path)', () => {
  it('centres a 72%-of-fontSize bar in the rect when metrics are null', () => {
    resetMetricsForTest();
    const rect = { top: 0, bottom: 24, left: 0, right: 100 };
    const { barTop, barBottom } = barOf(rect, style({}), 16);
    const expectedHeight = Math.min(16 * 0.72, 24);
    const middle = (0 + 24) / 2;
    expect(barTop).toBeCloseTo(middle - expectedHeight / 2, 5);
    expect(barBottom).toBeCloseTo(middle + expectedHeight / 2, 5);
  });

  it('clamps the bar height to the rect height when fontSize exceeds it', () => {
    resetMetricsForTest();
    const rect = { top: 0, bottom: 10, left: 0, right: 100 };
    const { barTop, barBottom } = barOf(rect, style({}), 20);
    expect(barBottom - barTop).toBeLessThanOrEqual(10);
  });
});
