/**
 * Shimmer painter — mounts `SkeletonRect[]` as shadow-DOM bones and
 * animates them on the **document clock** so every skeleton on the page
 * shimmers in one coherent sweep, however late a particular bone mounts.
 *
 * Full WAAPI port of `skullet/lib/shimmer.ts`. The key trick is
 * `animation.startTime = 0` — pins the animation to `performance.timeOrigin`
 * so a bone mounted at t=5s picks up the sweep where it is right now,
 * instead of restarting from zero. Visually, every bone belongs to one
 * stream.
 *
 * Three animation modes:
 *   - `shimmer` (default) — one diagonal sweep across the whole viewport.
 *     Every bone computes its horizontal offset into the shared stream so
 *     the sweep crosses it in sync with its neighbours.
 *   - `group-shimmer` — same algorithm scoped to each `[data-a-skel-layer]`.
 *     Multiple regions on the page sweep independently.
 *   - `pulse` — opacity 1 → `PULSE_LOW` → 1 cycle, in sync via `startTime = 0`.
 *   - `none` — no animation; bones just show the base fill.
 *
 * `drawSkeleton` pools `<div data-a-skel-rect>` elements inside the layer's
 * shadow root. A **motion key** (position + size + page width + animation
 * settings) gates animation restart — moving a bone 100 px without
 * changing the sweep's pace or the page width DOESN'T restart its
 * `element.animate()` call. This is what prevents the "scroll-driven
 * flicker" that naive implementations suffer from when `ResizeObserver`
 * fires during scroll.
 */

import { ATTR_RECT } from '../utils/attrs';
import { animationsOf, prefersReducedMotion } from '../utils/motion';
import type { SkeletonRect } from './measure';

/** CSS variables (consumer-overridable) — see `styles.src.css`. */
const BASE_FILL = 'var(--ak-skel-base, hsl(220 13% 84%))';
const HIGHLIGHT_FILL = 'var(--ak-skel-highlight, hsl(0 0% 100% / 0.6))';

/** Timings — match skullet's defaults. Consumer tweaks via CSS variables. */
const DURATIONS = {
  shimmer: { slow: 4000, fast: 2000 },
  pulse: { slow: 2400, fast: 1200 },
} as const;

const SWEEP = 0.7;
const REFERENCE_WIDTH = 1280;
const MAX_BAND = 320;
const SPACING = 2.5;
const PULSE_LOW = 0.45;
const SLANT_DEG = 20;
const PEAK = 0.85;
const STEPS = 12;

const SIN = Math.sin((SLANT_DEG * Math.PI) / 180);
const COS = Math.cos((SLANT_DEG * Math.PI) / 180);
const SLANT_TAN = SIN / COS;
const SLANT_ANGLE = `${90 + SLANT_DEG}deg`;

export type ShimmerAnimation = 'shimmer' | 'group-shimmer' | 'pulse' | 'none';
export type ShimmerSpeed = 'slow' | 'fast';

interface Motion {
  animation: ShimmerAnimation;
  duration: number;
}

/** Read the per-element animation + speed from CSS variables. */
export function motionOf(el: Element): Motion {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { animation: 'shimmer', duration: DURATIONS.shimmer.slow };
  }
  const style = getComputedStyle(el);
  const anim = readRule<ShimmerAnimation>(
    style,
    '--ak-skel-animation',
    ['shimmer', 'group-shimmer', 'pulse', 'none'],
    'shimmer'
  );
  const speed = readRule<ShimmerSpeed>(style, '--ak-skel-speed', ['slow', 'fast'], 'slow');
  return {
    animation: anim,
    duration: DURATIONS[anim === 'pulse' ? 'pulse' : 'shimmer'][speed],
  };
}

function readRule<T extends string>(
  style: CSSStyleDeclaration,
  prop: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = style.getPropertyValue(prop).trim() as T;
  return allowed.includes(value) ? value : fallback;
}

/** The `ease(t)` curve used for every ramp — cosine, no cusps. */
const ease = (t: number): number => (1 - Math.cos(Math.PI * t)) / 2;

interface Highlights {
  width: number;
  image: string;
}

/**
 * Build the repeating gradient stops for the shimmer band. Returns the
 * tile width (px, slant-corrected) + the `background-image` value.
 *
 * The stops ramp up then down twice (`PEAK` controls the asymmetry) so
 * the leading edge of each sweep reads as a hard-but-not-sharp wave.
 */
function highlights(band: number): Highlights {
  const period = band * SPACING;
  const stop = (at: number, alpha: number): string =>
    `color-mix(in srgb, ${HIGHLIGHT_FILL} ${(alpha * 100).toFixed(1)}%, transparent) ${(at * band).toFixed(2)}px`;
  const stops: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    stops.push(stop((i / STEPS) * PEAK, ease(i / STEPS)));
  }
  for (let i = 1; i <= STEPS; i++) {
    stops.push(stop(PEAK + (i / STEPS) * (1 - PEAK), ease(1 - i / STEPS)));
  }
  return {
    width: period / COS,
    image: `repeating-linear-gradient(${SLANT_ANGLE}, ${stops.join(', ')}, transparent ${period.toFixed(2)}px)`,
  };
}

interface Span {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Paint + animate a single bone on the document clock. The bone's
 * horizontal offset into the stream is derived from its position inside
 * the `area` (viewport for `shimmer`, parent layer for `group-shimmer`).
 */
export function shimmer(el: HTMLElement, group?: Span, motion: Motion = motionOf(el)): void {
  for (const a of animationsOf(el)) a.cancel();
  el.style.backgroundImage = '';
  el.style.backgroundRepeat = '';
  if (prefersReducedMotion()) return;
  if (typeof el.animate !== 'function') return;
  if (motion.animation === 'none') return;

  const timing: KeyframeAnimationOptions = {
    duration: motion.duration,
    iterations: Infinity,
  };

  if (motion.animation === 'pulse') {
    const anim = el.animate(
      [
        { opacity: 1, easing: 'ease-in-out' },
        { opacity: PULSE_LOW, easing: 'ease-in-out' },
        { opacity: 1 },
      ],
      timing
    );
    try {
      anim.startTime = 0;
    } catch {
      /* some runtimes (older safari) throw when setting startTime; ignore */
    }
    return;
  }

  const rect = el.getBoundingClientRect();
  const x = rect.left + (typeof scrollX === 'number' ? scrollX : 0);
  const area: Span =
    motion.animation === 'group-shimmer'
      ? (group ?? {
          left: x,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
      : {
          left: 0,
          top: 0,
          width:
            (typeof document !== 'undefined' &&
              document.documentElement &&
              document.documentElement.clientWidth) ||
            (typeof innerWidth === 'number' ? innerWidth : 1280),
          height: typeof innerHeight === 'number' ? innerHeight : 800,
        };

  const band = Math.min(Math.max(area.width * 0.4, 80), MAX_BAND);
  const { width: tile, image } = highlights(band);
  const along = x - area.left + (rect.top - area.top) * SLANT_TAN;
  const pace = (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);

  el.style.backgroundImage = image;
  el.style.backgroundSize = `${tile}px 100%`;
  el.style.backgroundRepeat = 'repeat-x';
  const anim = el.animate(
    [{ backgroundPosition: `${-along}px 0` }, { backgroundPosition: `${tile - along}px 0` }],
    { duration: tile * pace, iterations: Infinity }
  );
  try {
    anim.startTime = 0;
  } catch {
    /* older safari */
  }
}

/** ms per px of the shimmer band, or `null` when the animation doesn't sweep. */
export function paceOf(el: Element): number | null {
  if (prefersReducedMotion()) return null;
  const motion = motionOf(el);
  if (motion.animation !== 'shimmer' && motion.animation !== 'group-shimmer') return null;
  return (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);
}

/** Lazily attach the layer's shadow root. */
function shadow(layer: HTMLElement): ShadowRoot {
  return layer.shadowRoot ?? layer.attachShadow({ mode: 'open' });
}

export interface DrawOptions {
  animation?: ShimmerAnimation;
}

/**
 * Paint `rects` into `layer`'s shadow root. Reuses existing bones so a
 * re-measurement doesn't recreate the DOM. The **motion key** gates
 * animation restart: a bone that stayed in roughly the same place keeps
 * its running `element.animate()` call.
 */
export function drawSkeleton(
  layer: HTMLElement,
  rects: SkeletonRect[],
  options: DrawOptions = {}
): void {
  const root = shadow(layer);
  const layerRect = layer.getBoundingClientRect();
  const group: Span = {
    left: layerRect.left + (typeof scrollX === 'number' ? scrollX : 0),
    top: layerRect.top,
    width: layerRect.width,
    height: layerRect.height,
  };
  /* Read theme-driven motion once per paint — every bone in this layer
   * inherits it. The consumer can override per-layer by setting
   * `--ak-skel-animation` on the layer host. */
  const motion = options.animation
    ? {
        animation: options.animation,
        duration: DURATIONS[options.animation === 'pulse' ? 'pulse' : 'shimmer'].slow,
      }
    : motionOf(layer);

  const pageWidth =
    (typeof document !== 'undefined' &&
      document.documentElement &&
      document.documentElement.clientWidth) ||
    0;

  rects.forEach((rect, index) => {
    let bone = root.children[index] as HTMLElement | undefined;
    if (!bone) {
      bone = document.createElement('div');
      bone.setAttribute(ATTR_RECT, '');
      /* Inline cssText — no page stylesheet leaks into the shadow root. */
      bone.style.cssText = `position:absolute;display:block;pointer-events:none;background-color:${BASE_FILL};background-repeat:no-repeat`;
      root.append(bone);
    }

    Object.assign(bone.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: rect.radius || 'var(--ak-skel-radius, 0.5rem)',
    });

    /* Motion key — only restart the animation when position / group / page
     * width / animation setting changes. Avoids thrash on scroll-driven
     * resize observers. */
    const key = `${Math.round(group.left + rect.x)}|${Math.round(rect.y)}|${Math.round(rect.height)}|${Math.round(group.left)}|${Math.round(group.width)}|${Math.round(group.height)}|${pageWidth}|${motion.animation}|${motion.duration}`;
    if (bone.dataset.motion !== key) {
      bone.dataset.motion = key;
      shimmer(bone, group, motion);
    }
  });

  /* Shrink the pool. */
  while (root.children.length > rects.length) {
    root.lastElementChild!.remove();
  }
}

/** The bones currently painted in a layer — useful for test assertions. */
export function rectsOf(layer: Element): HTMLElement[] {
  return layer.shadowRoot ? ([...layer.shadowRoot.children] as HTMLElement[]) : [];
}

/** Test-only. */
export function clearSkeleton(layer: HTMLElement): void {
  if (!layer.shadowRoot) return;
  for (const bone of layer.shadowRoot.querySelectorAll(`[${ATTR_RECT}]`)) {
    bone.remove();
  }
}
