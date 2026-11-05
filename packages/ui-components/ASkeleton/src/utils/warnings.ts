/**
 * Dev-mode warnings surfaced from the engine when it detects a shape it
 * can guess at but not reliably reproduce.
 *
 * Three warnings, each `warnOnce`-dedup'd by cache key so a 1000-iteration
 * list of cards doesn't scream a thousand times:
 *
 *   - `warnMissingSample(key, data)` — data-driven mode saw a non-null
 *     `data` but no `sample` prop. The skeleton it drew during the
 *     initial loading pass was guessed from empty structure. Emit a
 *     `sampleFrom(data)` suggestion so the user can paste a shape-accurate
 *     sample into the template.
 *   - `warnSizeMismatch(key, skeletonBox, contentBox)` — after the
 *     content pane lands, the engine measures its box and compares it
 *     against the skeleton's final rect. If they differ by >10% on either
 *     axis, the loading state visibly jumped and the user saw it. Suggest
 *     a `sample` or fixed-height variant.
 *   - `warnUnsizedImage(src)` — a measured `<img>` had no `width`,
 *     `height`, or `aspect-ratio`. These images jump into their final
 *     dimensions after decode; the skeleton can't predict them without
 *     intrinsic sizing hints.
 */

import { sampleFrom } from './sample';
import { warnOnce } from './dev';

export interface Box {
  width: number;
  height: number;
}

export function warnMissingSample(key: string, data: unknown): void {
  const sample = sampleFrom(data);
  warnOnce(
    `missing-sample:${key}`,
    `Data-driven <ASkeleton> at "${key}" has no :sample prop — the first paint's shape was guessed. Pass :sample so the skeleton matches your layout:\n\nsample={${safeStringify(sample)}}`
  );
}

export function warnSizeMismatch(key: string, skel: Box, content: Box): void {
  const dw = relativeDiff(skel.width, content.width);
  const dh = relativeDiff(skel.height, content.height);
  if (dw < 0.1 && dh < 0.1) return;
  warnOnce(
    `size-mismatch:${key}`,
    `<ASkeleton :cache-key="${key}">: skeleton (${skel.width}×${skel.height}) differs from loaded content (${content.width}×${content.height}) by >10%. Consider passing :sample or fixing a height on the wrapper.`
  );
}

export function warnUnsizedImage(src: string): void {
  warnOnce(
    `unsized-image:${src || '(no src)'}`,
    `<img src="${src}"> inside <ASkeleton> has no intrinsic width/height/aspect-ratio — the layout jumps when it decodes. Set width + height attributes or an aspect-ratio style.`
  );
}

function relativeDiff(a: number, b: number): number {
  const base = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / base;
}

/**
 * Stringify in a way that survives Dates, circular refs, and functions
 * without throwing. Dev-only — we never serialise user data in production.
 */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === 'function') return '[Function]';
        if (v instanceof Date) return v.toISOString();
        return v;
      },
      2
    );
  } catch {
    return '[unserialisable]';
  }
}
