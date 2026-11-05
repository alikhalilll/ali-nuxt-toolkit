/**
 * Canvas-based font metrics + typography-aware bar placement.
 *
 * Port of `/measure.ts:120-215`. Each unique font (style + weight
 * + size + family) is measured once via Canvas 2D `measureText()` and cached.
 * `barOf(rect, style, fontSize)` turns the metrics into a single-line bar's
 * top/bottom edges — the bar lives between two typographic lines (defaults
 * `ascender → descender`, both themeable per-element via CSS vars).
 *
 * Why ascender→descender by default: hanging letters like `g`, `j`, `p`, `y`
 * sit below the baseline. A bar that stopped at the baseline would read as
 * "clipped text" to a reader scanning the skeleton; descender-inclusive
 * bars match the shape of the real letters.
 */

import { textContext } from './canvas';

export type TextTop = 'ascender' | 'cap-height' | 'x-height';
export type TextBottom = 'baseline' | 'descender';

export const DEFAULT_TEXT = {
  top: 'ascender' as TextTop,
  bottom: 'descender' as TextBottom,
};

interface Metrics {
  ascent: number;
  descent: number;
  ascender: number;
  capHeight: number;
  xHeight: number;
  descender: number;
}

const metricsByFont = new Map<string, Metrics | null>();

function fontKey(style: CSSStyleDeclaration): string {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

/** Resolve font metrics for `style`. Returns `null` when canvas is unusable. */
export function metricsOf(style: CSSStyleDeclaration): Metrics | null {
  const key = fontKey(style);
  if (metricsByFont.has(key)) return metricsByFont.get(key)!;
  const context = textContext();
  if (!context) {
    metricsByFont.set(key, null);
    return null;
  }
  context.font = key;
  const box = context.measureText('H');
  const up = (text: string) => context.measureText(text).actualBoundingBoxAscent;
  const metrics: Metrics = {
    ascent: box.fontBoundingBoxAscent,
    descent: box.fontBoundingBoxDescent,
    ascender: up('bdfhkl'),
    capHeight: box.actualBoundingBoxAscent,
    xHeight: up('xz'),
    descender: context.measureText('gjpqy').actualBoundingBoxDescent,
  };
  metricsByFont.set(key, metrics);
  return metrics;
}

const TOPS: Record<TextTop, keyof Metrics> = {
  ascender: 'ascender',
  'cap-height': 'capHeight',
  'x-height': 'xHeight',
};

function rule<T extends string>(
  style: CSSStyleDeclaration,
  name: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = style.getPropertyValue(name).trim() as T;
  return allowed.includes(value) ? value : fallback;
}

export interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Compute the top + bottom pixel edges for a text bar within `rect`,
 * honouring the font's typographic metrics + per-element CSS variables
 * `--ak-skel-text-top` and `--ak-skel-text-bottom`.
 */
export function barOf(
  rect: Rect,
  style: CSSStyleDeclaration,
  fontSize: number
): { barTop: number; barBottom: number } {
  const metrics = metricsOf(style);
  if (!metrics) {
    /* No canvas (or metrics unresolvable) — centre a bar at 72% of
     * fontSize across the box. Matches the upstream library's fallback. */
    const height = Math.min(fontSize * 0.72, rect.bottom - rect.top);
    const middle = (rect.top + rect.bottom) / 2;
    return { barTop: middle - height / 2, barBottom: middle + height / 2 };
  }
  const top = rule(style, '--ak-skel-text-top', Object.keys(TOPS) as TextTop[], DEFAULT_TEXT.top);
  const bottom = rule(
    style,
    '--ak-skel-text-bottom',
    ['baseline', 'descender'] as const,
    DEFAULT_TEXT.bottom
  );
  const box = metrics.ascent + metrics.descent;
  const baseline = rect.top + (rect.bottom - rect.top - box) / 2 + metrics.ascent;
  return {
    barTop: baseline - metrics[TOPS[top]],
    barBottom: baseline + (bottom === 'descender' ? metrics.descender : 0),
  };
}

/** Test-only. */
export function resetMetricsForTest(): void {
  metricsByFont.clear();
}
