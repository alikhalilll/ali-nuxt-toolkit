import { ATTR_RECT, DURATIONS, HIGHLIGHT } from './constants';
import type { SkeletonAnimation, SkeletonSpeed } from './theme';
import { animationsOf, directionOf, prefersReducedMotion, type SkeletonDirection } from './motion';
import type { SkeletonRect } from './measure';

const SWEEP = 0.7; // of a duration a sweep takes at the reference width — sweeps run back to back, so this sets the pace
const REFERENCE_WIDTH = 1280; // A shimmer's duration is one loop across this; any other width keeps its pace
const MAX_BAND = 320; // The highlight's width, so it doesn't grow heavier on a wide screen
const SPACING = 2.5; // bands follow each other this many band-widths apart, start to start — the gap between sweeps
const PULSE_LOW = 0.45; // opacity at the bottom of a pulse

const ANIMATIONS: readonly SkeletonAnimation[] = ['shimmer', 'group-shimmer', 'pulse', 'none'];

export type Motion = {
  animation: SkeletonAnimation;
  duration: number;
  direction: SkeletonDirection;
};

/** The animation an element inherits from the theme: `--ask-animation` and `--ask-speed`.
 *  `direction` comes from the native CSS `direction` cascade (`<html dir>` or any ancestor) —
 *  no new API, so a consumer flips RTL by the same handle Bootstrap, Tailwind, and React use. */
export function motionOf(element: Element): Motion {
  const style = getComputedStyle(element);
  const read = <T extends string>(name: string, allowed: readonly T[], fallback: T): T => {
    const value = style.getPropertyValue(name).trim() as T;
    return allowed.includes(value) ? value : fallback;
  };
  const animation = read('--ask-animation', ANIMATIONS, 'shimmer');
  const speed = read<SkeletonSpeed>('--ask-speed', ['slow', 'fast'], 'slow');
  return {
    animation,
    duration: DURATIONS[animation === 'pulse' ? 'pulse' : 'shimmer'][speed],
    direction: style.direction === 'rtl' ? 'rtl' : 'ltr',
  };
}

type Span = { left: number; top: number; width: number; height: number };

const SLANT = 20; // degrees from vertical: the highlight is a diagonal, top right to bottom left
const SIN = Math.sin((SLANT * Math.PI) / 180);
const COS = Math.cos((SLANT * Math.PI) / 180);
export const SLANT_TAN = SIN / COS;
export const SLANT_COS = COS;
export const SLANT_ANGLE = `${90 + SLANT}deg`;
export const PEAK = 0.85; // Where across the band the highlight is brightest: 0 → PEAK eases up, PEAK → 1 eases down — later is a harder leading edge
export const STEPS = 12; // stops per ramp — enough for an eased curve to read as one, with no banding

// Every gradient ramps on this (a scrim), so no stop shows as a hard line
export const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** Highlights `SPACING` band-widths apart, in px from the box's corner, so every rect draws the same stream. */
function highlights(band: number) {
  const period = band * SPACING;
  const stop = (at: number, alpha: number) =>
    `color-mix(in srgb, ${HIGHLIGHT} ${(alpha * 100).toFixed(1)}%, transparent) ${(at * band).toFixed(2)}px`;
  const stops: string[] = [];
  for (let i = 0; i <= STEPS; i++) stops.push(stop((i / STEPS) * PEAK, ease(i / STEPS)));
  for (let i = 1; i <= STEPS; i++) {
    stops.push(stop(PEAK + (i / STEPS) * (1 - PEAK), ease(1 - i / STEPS)));
  }

  return {
    // Across, the stream repeats every `period` along the slant
    width: period / COS,
    image: `repeating-linear-gradient(${SLANT_ANGLE}, ${stops.join(', ')}, transparent ${period.toFixed(2)}px)`,
  };
}

/** Animates `element` as its slice of one sweep, on the document clock, so however late it mounts it joins the sweep under way. */
export function shimmer(element: HTMLElement, group?: Span, motion: Motion = motionOf(element)) {
  for (const animation of animationsOf(element)) animation.cancel();
  element.style.backgroundImage = '';
  element.style.backgroundRepeat = '';
  if (prefersReducedMotion() || typeof element.animate !== 'function') return;
  if (motion.animation === 'none') return;

  const timing = { duration: motion.duration, iterations: Infinity };

  if (motion.animation === 'pulse') {
    element.animate(
      [
        { opacity: 1, easing: 'ease-in-out' },
        { opacity: PULSE_LOW, easing: 'ease-in-out' },
        { opacity: 1 },
      ],
      timing
    ).startTime = 0;
    return;
  }

  const rect = element.getBoundingClientRect();
  const x = rect.left + scrollX;
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
          width: document.documentElement.clientWidth || innerWidth,
          height: innerHeight,
        };
  const band = Math.min(Math.max(area.width * 0.4, 80), MAX_BAND);
  const { width: tile, image } = highlights(band);

  // Where this bone sits in the area's one stream: further right, and lower down the slant, is further along it
  const along = x - area.left + (rect.top - area.top) * SLANT_TAN;
  // One pace on any screen, as a sweep across the reference width took
  const pace = (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);

  element.style.backgroundImage = image;
  element.style.backgroundSize = `${tile}px 100%`;
  element.style.backgroundRepeat = 'repeat-x';
  // The shared-stream invariant `bg_pos_x_bone = bg_absolute − along` holds as `bg_absolute`
  // moves either way — reversing the delta sign flips travel direction while every bone in
  // the group stays in phase. RTL slides the band leftward so it tracks the reading eye.
  const delta = motion.direction === 'rtl' ? -tile : tile;
  element.animate(
    [{ backgroundPosition: `${-along}px 0` }, { backgroundPosition: `${delta - along}px 0` }],
    { duration: tile * pace, iterations: Infinity }
  ).startTime = 0;
}

/** ms per px of the band in `element`'s shimmer; null when it has no band. */
export function paceOf(element: Element): number | null {
  if (prefersReducedMotion()) return null;
  const motion = motionOf(element);
  if (motion.animation !== 'shimmer' && motion.animation !== 'group-shimmer') return null;
  return (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);
}

/** The rect elements drawn into `layer`. */
export const rectsOf = (layer: Element): HTMLElement[] => [
  ...layer.querySelectorAll<HTMLElement>(`:scope > [${ATTR_RECT}]`),
];

/** Soft floor on skeleton bone corners — anything sharper than this reads as a glyph,
 *  not a placeholder, which fights the whole point of a skeleton. 4 px is the smallest
 *  radius that still reads as "rounded" at typical display DPI. Applied only to
 *  text / media / box bones; chrome bones carry the consumer's own radius verbatim. */
const MIN_BONE_RADIUS = 4;
const clampRadius = (radius: string): string =>
  radius.replace(/(\d+(?:\.\d+)?)px/g, (_, raw) => {
    const n = parseFloat(raw);
    return Number.isFinite(n) && n < MIN_BONE_RADIUS ? `${MIN_BONE_RADIUS}px` : `${n}px`;
  });

/** Draws `rects` into `layer`, reusing the elements already there.
 *
 * Bones live in the light DOM (not a shadow root) so a consumer's stylesheet
 * can reach them — selectors like `[ask-rect="text"]`, `[ask-rect="media"]`,
 * `[ask-rect="box"]`, or the `--ask-base` / `--ask-highlight` custom
 * properties — and theme the skeleton with the consumer's own tokens rather
 * than plugin defaults. Positioning (x/y/width/height/radius) stays inline
 * because it is per-bone; fill colour comes from the stylesheet.
 *
 * Added after mount, so Vue/React hydration never sees them.
 */
export function drawSkeleton(layer: HTMLElement, rects: SkeletonRect[]) {
  const existing = rectsOf(layer);
  const rect = layer.getBoundingClientRect();
  const group = {
    left: rect.left + scrollX,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  // Read once for the layer: every rect in it inherits the same theme
  const motion = motionOf(layer);

  rects.forEach((part, index) => {
    let element = existing[index];
    if (!element) {
      element = document.createElement('div');
      // Positioning-only: the stylesheet owns colour so the consumer can retheme
      element.style.cssText = `position:absolute;display:block;pointer-events:none;background-repeat:no-repeat`;
      layer.append(element);
    }
    // Type attribute set every pass — bone reuse across renders may change type
    element.setAttribute(ATTR_RECT, part.type);

    Object.assign(element.style, {
      left: `${part.x}px`,
      top: `${part.y}px`,
      width: `${part.width}px`,
      height: `${part.height}px`,
      // Chrome reproduces the real element's border-radius exactly (0 stays 0);
      // placeholder bones get a 4-px floor so sharp-cornered text / media / box
      // bones still read as rounded skeletons, not glyphs of the real content.
      borderRadius: part.type === 'chrome' ? part.radius : clampRadius(part.radius),
    });

    if (part.type === 'chrome') {
      // Chrome bones reproduce the container's painted surface (bg / borders / shadow),
      // captured from the consumer's own CSS. Reset shimmer side-effects so an element
      // reused across draws isn't left with a shimmer background from a previous pass,
      // then apply the captured paint inline — the stylesheet default fill would obscure
      // the real colour.
      for (const anim of animationsOf(element)) anim.cancel();
      element.style.backgroundImage = '';
      element.style.backgroundSize = '';
      element.style.backgroundRepeat = '';
      const chrome = part.chrome;
      element.style.background = chrome?.background ?? '';
      element.style.borderTop = chrome?.borderTop ?? '';
      element.style.borderRight = chrome?.borderRight ?? '';
      element.style.borderBottom = chrome?.borderBottom ?? '';
      element.style.borderLeft = chrome?.borderLeft ?? '';
      element.style.boxShadow = chrome?.boxShadow ?? '';
      // Chrome never shimmers — it's the outline, not a loading placeholder
      element.dataset.motion = 'chrome';
      return;
    }

    // Non-chrome bones: drop any chrome state left on a reused element, then shimmer.
    if (element.dataset.motion === 'chrome') {
      element.style.background = '';
      element.style.borderTop = '';
      element.style.borderRight = '';
      element.style.borderBottom = '';
      element.style.borderLeft = '';
      element.style.boxShadow = '';
    }

    // Restarted only when its place, group, the page's width or the motion changes
    const key = `${Math.round(group.left + part.x)}|${Math.round(part.y)}|${Math.round(part.height)}|${Math.round(group.left)}|${Math.round(group.width)}|${Math.round(group.height)}|${document.documentElement.clientWidth}|${motion.animation}|${motion.duration}|${motion.direction}`;
    if (element.dataset.motion !== key) {
      element.dataset.motion = key;
      shimmer(element, group, motion);
    }
  });

  // Trim excess bones left over from a previous, longer draw
  for (let i = existing.length - 1; i >= rects.length; i--) existing[i]!.remove();
}
