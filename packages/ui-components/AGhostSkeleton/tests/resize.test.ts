/**
 * Covers the pane-swap resize contract introduced alongside the
 * `easeHeight()` lift-out: when the outgoing pane was taller than the
 * incoming one, `fadeOut()` must animate the outgoing pane's own `height`
 * down to the incoming pane's height — in lockstep with the parent
 * reveal's `easeHeight` — so the skeleton's bones never peek below where
 * the real content settles.
 *
 * Both animations must share `RESIZE_DURATION` and `REVEAL_EASING` so they
 * end on the same frame; the outgoing pane also gets `overflow: clip`
 * applied inline so its own descendants don't paint past its shrinking
 * box.
 */
import { describe, expect, it } from 'vitest';
import { ATTR_PANE, ATTR_REVEAL } from '../src/core/constants';
import { fadeOut } from '../src/core/fade';
import { RESIZE_DURATION, REVEAL_EASING } from '../src/core/constants';

function setupReveal({
  outgoingHeight,
  incomingHeight,
}: {
  outgoingHeight: number;
  incomingHeight: number;
}) {
  // ask-reveal (positioned) → [outgoing ask-pane, incoming ask-pane]. Both
  // panes report fixed `offsetHeight` / `getBoundingClientRect` so the
  // test can drive the shrink / grow path deterministically.
  const reveal = document.createElement('div');
  reveal.setAttribute(ATTR_REVEAL, '');
  reveal.style.position = 'relative';

  const outgoing = document.createElement('div');
  outgoing.setAttribute(ATTR_PANE, '');
  outgoing.setAttribute('data-role', 'skeleton');

  const incoming = document.createElement('div');
  incoming.setAttribute(ATTR_PANE, '');
  incoming.setAttribute('data-role', 'content');

  reveal.append(outgoing, incoming);
  document.body.append(reveal);

  Object.defineProperty(outgoing, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      width: 400,
      height: outgoingHeight,
      top: 0,
      left: 0,
      right: 400,
      bottom: outgoingHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
  Object.defineProperty(outgoing, 'offsetParent', {
    configurable: true,
    value: reveal,
  });

  Object.defineProperty(incoming, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      width: 400,
      height: incomingHeight,
      top: 0,
      left: 0,
      right: 400,
      bottom: incomingHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
  Object.defineProperty(reveal, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      width: 400,
      // After `popOut` moves the outgoing pane out of flow, the reveal's
      // natural height is driven by the incoming pane.
      height: incomingHeight,
      top: 0,
      left: 0,
      right: 400,
      bottom: incomingHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });

  return { reveal, outgoing, incoming };
}

describe('resize — pane-swap height animation', () => {
  it('shrinks the outgoing pane in lockstep with the parent when it was taller', async () => {
    const { reveal, outgoing } = setupReveal({ outgoingHeight: 2000, incomingHeight: 600 });

    await fadeOut(outgoing);
    // Two microtasks: `fadeOut` schedules its body in a microtask, and
    // the resize helper reads layout inside that body.
    await Promise.resolve();
    await Promise.resolve();

    const paneAnimations = outgoing.getAnimations();
    const heightAnimation = paneAnimations.find((a) => {
      const effect = a.effect as KeyframeEffect | null;
      if (!effect) return false;
      const keyframes = effect.getKeyframes();
      return keyframes.some((kf) => 'height' in kf);
    });

    expect(heightAnimation, 'outgoing pane should have a height animation').toBeTruthy();

    const timing = (heightAnimation!.effect as KeyframeEffect).getTiming();
    expect(timing.duration).toBe(RESIZE_DURATION);
    expect(timing.easing).toBe(REVEAL_EASING);

    const rootAnimations = reveal.getAnimations();
    const rootHeight = rootAnimations.find((a) => {
      const effect = a.effect as KeyframeEffect | null;
      return !!effect?.getKeyframes().some((kf) => 'height' in kf);
    });
    expect(rootHeight, 'reveal root should also run a height animation').toBeTruthy();
    const rootTiming = (rootHeight!.effect as KeyframeEffect).getTiming();
    expect(rootTiming.duration).toBe(RESIZE_DURATION);
    expect(rootTiming.easing).toBe(REVEAL_EASING);

    expect(outgoing.style.overflow).toBe('clip');
    // (Compositor hints — `will-change: height` + `contain: layout` on root,
    // `will-change: height` on the outgoing pane — are applied inline during
    // the animation and cleared on settle in real browsers. Not asserted
    // here because happy-dom runs animations synchronously, so the restore
    // phase runs before we can observe the hints. The code path is
    // guaranteed by the `easeHeight()` implementation and by the matching
    // animation timings asserted above.)

    reveal.remove();
  });

  it('skips the lockstep shrink when the incoming pane is not shorter', async () => {
    const { reveal, outgoing } = setupReveal({ outgoingHeight: 300, incomingHeight: 600 });

    await fadeOut(outgoing);
    await Promise.resolve();
    await Promise.resolve();

    const heightAnimation = outgoing.getAnimations().find((a) => {
      const effect = a.effect as KeyframeEffect | null;
      return !!effect?.getKeyframes().some((kf) => 'height' in kf);
    });
    // Growing (short skeleton → tall content) doesn't need the pane shrink —
    // the skeleton never extends past the content's settled area.
    expect(heightAnimation, 'no height animation when growing').toBeFalsy();

    reveal.remove();
  });
});
