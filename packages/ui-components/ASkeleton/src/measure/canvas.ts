/**
 * Shared canvas context used by `metrics.ts`.
 *
 * One canvas per runtime (lazy singleton); its 2D context is reused across
 * every `measureText()` call. Returns `null` in environments without
 * canvas (jsdom / happy-dom) — the metrics computation falls back to a
 * geometric default when that happens.
 *
 * Port of `/canvas.ts:1-7`.
 */

let context: CanvasRenderingContext2D | null | undefined;

export function textContext(): CanvasRenderingContext2D | null {
  if (context !== undefined) return context;
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    context = null;
    return context;
  }
  try {
    const canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
  } catch {
    context = null;
  }
  return context ?? null;
}
