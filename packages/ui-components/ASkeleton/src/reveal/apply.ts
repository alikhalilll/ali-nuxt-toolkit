/**
 * Reveal applier — turns a `Plan` into actual `Element.animate()` calls.
 *
 * Scoped port of `/fade.ts`. Delegates planning to `./plan.ts`
 * and animation primitives to the Web Animations API. Each pane goes
 * through two phases:
 *
 *   - `fadeIn(el, mode)`  — the entry animation. For skeleton panes, this
 *     is a `hold → appear` sequence that lets quick loads skip showing a
 *     flash. For content panes, it runs `planReveal(ctx) → Plan` and
 *     dispatches on the plan kind.
 *   - `fadeOut(el)` — the exit. Reads the entry's plan from a `WeakMap`
 *     and reverses it so the pair feels symmetric.
 *
 * The applier is side-effectful (DOM animations) but still structured:
 * the plan→animation dispatch is a lookup table (`PLAN_APPLIERS`), not a
 * branch; new plan kinds slot in as new entries.
 *
 * `prefers-reduced-motion` short-circuits every path to a resolved promise
 * with no animation — the pane snaps to its final visual state.
 */

import { ATTR_EXITING, ATTR_PANE } from '../utils/attrs';
import { animationsOf, canAnimate, prefersReducedMotion } from '../utils/motion';
import {
  CASCADE_SPREAD,
  FADE_DURATION,
  noteSkeleton,
  planReveal,
  revealContext,
  type Plan,
  type RevealMode,
} from './plan';

/** How long the parent-height ease lasts when a reveal grows/shrinks between panes. */
const RESIZE_DURATION = 280;

/** How long we wait between animation frames before deciding a plan has stalled. */
const noop = (): void => {};
const settle = (anim: Animation): Promise<void> => anim.finished.then(noop, noop);

/* Each reveal keeps the plan its entering pane picked so the exit can match. */
const plans = new WeakMap<Element, Plan | { kind: 'skeleton'; hold: number }>();

/* Each in-flight entrance caches a promise so `<Transition>`'s double-mount
 * guard (React StrictMode, Vue appear + enter) doesn't trigger the fade twice. */
const arrivals = new WeakMap<Element, Promise<void>>();

/** Core animation primitive — fade from `from` to opaque. */
function appear(el: Element, delay = 0, duration = FADE_DURATION, from = 0): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();
  if (typeof (el as unknown as { animate?: unknown }).animate !== 'function') {
    return Promise.resolve();
  }
  const anim = (el as HTMLElement).animate([{ opacity: from }, { opacity: 1 }], {
    duration,
    delay,
    easing: 'ease',
    fill: 'backwards',
  });
  return settle(anim);
}

/** `together` — one crossfade for the whole pane. */
function togetherIn(el: HTMLElement, plan: Plan & { kind: 'together' }): Promise<void> {
  return appear(el, plan.delay, plan.duration);
}

/** `sequence` — per-piece delayed appear. */
function sequenceIn(el: HTMLElement, plan: Plan & { kind: 'sequence' }): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();
  const found = Array.from(el.querySelectorAll('*')) as Element[];
  const promises: Promise<void>[] = [];
  for (const piece of found) {
    const delay = plan.pieceDelay(piece);
    if (delay === null) continue;
    promises.push(appear(piece, delay, FADE_DURATION));
  }
  if (promises.length === 0) promises.push(appear(el, 0, FADE_DURATION));
  return Promise.all(promises).then(noop);
}

/** Instant: no animation; the pane is already in its final state. */
function instantIn(_el: HTMLElement): Promise<void> {
  return Promise.resolve();
}

/* Strategy table — adding a new plan kind means adding one row here, not
 * a new branch in `fadeIn`. */
const PLAN_APPLIERS: Record<Plan['kind'], (el: HTMLElement, plan: Plan) => Promise<void>> = {
  instant: (el) => instantIn(el),
  together: (el, plan) => togetherIn(el, plan as Plan & { kind: 'together' }),
  sequence: (el, plan) => sequenceIn(el, plan as Plan & { kind: 'sequence' }),
};

/**
 * True when `el` is the skeleton pane of its reveal. Detected
 * by the presence of the ghost / layer / self-skeleton attrs inside the
 * pane; our equivalent is the pane's `data-a-skel-pane="skeleton"` key.
 */
function isSkeletonPane(el: HTMLElement): boolean {
  return el.getAttribute('data-a-skel-pane') === 'skeleton';
}

/**
 * Entry — call from the Transition's `onEnter` / `onAppear` hook. Returns
 * a promise that resolves once the pane is visually settled.
 */
export function fadeIn(
  el: HTMLElement,
  mode: RevealMode = 'smart',
  opts: { initial?: boolean } = {}
): Promise<void> {
  const cached = arrivals.get(el);
  if (cached) return cached;
  const promise = enter(el, mode, opts.initial ?? false);
  arrivals.set(el, promise);
  return promise;
}

function enter(el: HTMLElement, mode: RevealMode, initial: boolean): Promise<void> {
  const reveal = el.parentElement;
  if (!reveal) return Promise.resolve();

  if (isSkeletonPane(el)) {
    /* The skeleton pane went up. Record when so subsequent content fades
     * can tell how long it was visible (`waited` in RevealContext).
     * `initial` panes (first mount / SSR) are treated as served — their
     * hold is zero so content never waits. */
    const served = initial;
    noteSkeleton(reveal, { served, refetch: false });
    plans.set(reveal, { kind: 'skeleton', hold: served ? 0 : FADE_DURATION });
    return served ? Promise.resolve() : appear(el);
  }

  /* Content pane — plan and dispatch. */
  const ctx = revealContext(el, reveal);
  const plan = planReveal(mode, ctx);
  plans.set(reveal, plan);
  const applier = PLAN_APPLIERS[plan.kind];
  return applier(el, plan);
}

/** Measured box of an exiting pane, relative to its offset parent. */
export interface PaneBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Measure `element` as it leaves — fractional (not `offsetWidth` / `offsetHeight`),
 * so a shrink-to-fit pane's text doesn't rewrap on the way out when a width
 * gets rounded down. Port of `/fade.ts:244-255`.
 */
export function boxOf(element: HTMLElement): PaneBox {
  const rect = element.getBoundingClientRect();
  const parent = (element.offsetParent as HTMLElement | null) ?? document.documentElement;
  const origin = parent.getBoundingClientRect();
  return {
    top: rect.top - origin.top - parent.clientTop,
    left: rect.left - origin.left - parent.clientLeft,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Pin an exiting pane absolutely at its measured box so the incoming pane
 * can lay out from zero without fighting for space. Marks the pane
 * `[data-a-skel-exiting]` so CSS can hide it from pointer/keyboard events.
 * Port of `/fade.ts:258-272`.
 */
function popOut(element: HTMLElement, box: PaneBox = boxOf(element)): PaneBox {
  Object.assign(element.style, {
    position: 'absolute',
    top: `${box.top}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    margin: '0',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  });
  element.inert = true;
  element.setAttribute(ATTR_EXITING, '');
  return box;
}

interface Resize {
  animation: Animation;
  overflow: string;
  boxSizing: string;
}

/* Tracks the running height ease per reveal root so a second resize mid-flight
 * starts from where the first got to. Port of `/fade.ts:277`. */
const resizes = new WeakMap<HTMLElement, Resize>();

/**
 * Ease a reveal's height from the outgoing pane's final height to the
 * incoming pane's natural height. Called from `fadeOut` after `popOut` has
 * removed the outgoing pane from flow.
 *
 * Port of `/fade.ts:280-308`.
 */
function resize(root: HTMLElement, box: PaneBox): void {
  const incoming = root.querySelector<HTMLElement>(
    `:scope > [${ATTR_PANE}]:not([${ATTR_EXITING}])`
  );
  if (!incoming) return;
  const running = resizes.get(root);
  const shown = root.getBoundingClientRect().height;
  running?.animation.cancel();
  const to = root.getBoundingClientRect().height;
  const from = running ? shown : to - incoming.getBoundingClientRect().height + box.height;
  if (Math.abs(from - to) < 0.5) {
    if (running) restoreRoot(root, running);
    return;
  }
  const base = running ?? root.style;
  const { overflow, boxSizing } = base;
  Object.assign(root.style, { overflow: 'clip', boxSizing: 'border-box' });
  const animation = root.animate([{ height: `${from}px` }, { height: `${to}px` }], {
    duration: RESIZE_DURATION,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
  });
  const current: Resize = { animation, overflow, boxSizing };
  resizes.set(root, current);
  void settle(animation).then(() => {
    if (resizes.get(root) === current) restoreRoot(root, current);
  });
}

function restoreRoot(root: HTMLElement, { overflow, boxSizing }: Resize): void {
  resizes.delete(root);
  Object.assign(root.style, { overflow, boxSizing });
}

/** Sequence-exit: bones fade out piece-by-piece using the entry plan's
 * `pieceDelay`, reused in reverse. Covers skeleton→content handoff when
 * the entry used `sequence`. Simplified from `the upstream library/fade.ts:367-405`. */
function sequenceOut(element: HTMLElement, plan: Plan & { kind: 'sequence' }): Promise<void> {
  if (!canAnimate()) return Promise.resolve();
  const pieces = Array.from(element.querySelectorAll('*')) as HTMLElement[];
  const promises: Promise<void>[] = [];
  for (const piece of pieces) {
    const delay = plan.pieceDelay(piece);
    if (delay === null) continue;
    const anim = piece.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: FADE_DURATION,
      delay: Math.min(delay, CASCADE_SPREAD),
      easing: 'ease',
      fill: 'forwards',
    });
    promises.push(settle(anim));
  }
  if (promises.length === 0) {
    const anim = element.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: FADE_DURATION,
      easing: 'ease',
      fill: 'forwards',
    });
    return settle(anim);
  }
  return Promise.all(promises).then(noop);
}

/**
 * Exit — call from the Transition's `onLeave`. Reads the entry plan from
 * the `plans` WeakMap so entry and exit stay symmetric: a `sequence` entry
 * gets a `sequenceOut`; a `together` entry gets a crossfade over the same
 * duration; `instant` snaps to opacity 0.
 *
 * Pins the exiting pane absolutely via `popOut` so the incoming pane can
 * layout from zero, then eases the reveal root's height from old → new via
 * `resize` so the user sees no shift.
 */
export function fadeOut(el: HTMLElement, box?: PaneBox): Promise<void> {
  const parent = el.parentElement;

  if (prefersReducedMotion() || !canAnimate()) {
    el.setAttribute(ATTR_EXITING, '');
    el.style.opacity = '0';
    return Promise.resolve();
  }

  /* Read opacity BEFORE cancelling in-flight animations so an interrupted
   * entry leaves from where it got to (not from fully opaque). */
  const currentOpacity = parseFloat(getComputedStyle(el).opacity);
  const from = Number.isNaN(currentOpacity) ? 1 : currentOpacity;
  for (const anim of animationsOf(el)) anim.cancel();

  const stood = popOut(el, box);

  function fade(delay: number, duration: number): Promise<void> {
    const anim = el.animate([{ opacity: from }, { opacity: 0 }], {
      duration: Math.max(duration * from, 1),
      delay,
      easing: 'ease',
      fill: 'forwards',
    });
    return settle(anim);
  }

  /* A microtask on so the pane replacing this one has registered its
   * plan into the `plans` WeakMap. The entry's plan is what decides how
   * the exit animates. */
  return Promise.resolve().then(() => {
    const plan = parent ? plans.get(parent) : undefined;
    const instant = plan?.kind === 'instant';
    if (parent && !instant) resize(parent, stood);
    if (!plan) return fade(0, FADE_DURATION);
    if (plan.kind === 'skeleton') {
      /* Skeleton entering — content stays until the skeleton is up for its
       * hold duration (so a quick load never flashes a half-faded card). */
      return fade(plan.hold, FADE_DURATION);
    }
    if (instant) {
      el.style.opacity = '0';
      return;
    }
    if (plan.kind === 'sequence') return sequenceOut(el, plan);
    if (plan.kind === 'together') return fade(plan.delay, plan.duration);
    return fade(0, FADE_DURATION);
  });
}

/** Test-only: forget cached arrival + plan state so tests don't bleed. */
export function resetRevealStateForTest(): void {
  /* WeakMaps aren't iterable; the only way to "forget" entries from the
   * outside is to let them GC when their keys drop. In tests the keys do
   * drop (test wrappers unmount), so there's nothing to do here except
   * document the intent. Kept as a hook for symmetry with
   * `resetWarnedForTest`. */
}
