import { describe, expect, it } from 'vitest';
import {
  ATTR_BAR,
  ATTR_BLOCK,
  ATTR_GHOST,
  ATTR_IGNORE,
  ATTR_LAYER,
  ATTR_LOADING,
  ATTR_OWN,
  ATTR_PANE,
  ATTR_RECT,
  ATTR_REVEAL,
  ATTR_SNAPSHOT,
  ATTR_STATUS,
  ATTR_XRAY,
  CASCADE_SPREAD,
  DURATIONS,
  FADE_DURATION,
  SKELETON_FADE_DURATION,
  RESIZE_DURATION,
  IMAGE_TIMEOUT,
  together,
  sequence,
  instant,
  smart,
  planReveal,
  SKELETON_DELAY,
  byPosition,
  byRow as _byRow,
  createSkeletonBox,
  skeletonBoxStyle,
  motionOf,
} from '../src/core';

describe('constants', () => {
  it('defines correct ask-* attributes', () => {
    expect(ATTR_REVEAL).toBe('ask-reveal');
    expect(ATTR_PANE).toBe('ask-pane');
    expect(ATTR_LOADING).toBe('ask-loading');
    expect(ATTR_GHOST).toBe('ask-ghost');
    expect(ATTR_SNAPSHOT).toBe('ask-snapshot');
    expect(ATTR_LAYER).toBe('ask-layer');
    expect(ATTR_RECT).toBe('ask-rect');
    expect(ATTR_BAR).toBe('ask-bar');
    expect(ATTR_OWN).toBe('ask-own');
    expect(ATTR_IGNORE).toBe('ask-ignore');
    expect(ATTR_BLOCK).toBe('ask-block');
    expect(ATTR_STATUS).toBe('ask-status');
    expect(ATTR_XRAY).toBe('ask-xray');
  });

  it('defines expected animation timings', () => {
    // Content fade and the parent height ease share one duration so they end
    // on the same frame; the skeleton's own fade is deliberately shorter so
    // the bones clear while the frame is still settling.
    expect(FADE_DURATION).toBe(320);
    expect(RESIZE_DURATION).toBe(320);
    expect(CASCADE_SPREAD).toBe(0);
    expect(CASCADE_SPREAD + FADE_DURATION).toBe(RESIZE_DURATION);
    expect(SKELETON_FADE_DURATION).toBeLessThan(FADE_DURATION);
    expect(IMAGE_TIMEOUT).toBe(10000);
    expect(DURATIONS.shimmer.slow).toBe(4000);
    expect(DURATIONS.shimmer.fast).toBe(2000);
    expect(DURATIONS.pulse.slow).toBe(2400);
    expect(DURATIONS.pulse.fast).toBe(1200);
  });
});

describe('reveal plans', () => {
  it('together spec sets order="together"', () => {
    expect(together.order).toBe('together');
  });

  it('instant plan has 0 duration', () => {
    expect(instant.duration).toBe(0);
  });

  it('sequence plan sets byPosition ordering', () => {
    expect(sequence.order).toBe(byPosition);
  });

  it('smart plan configures hold delay', () => {
    expect(smart.hold).toBe(SKELETON_DELAY);
    expect(typeof smart.choose).toBe('function');
  });

  it('planReveal returns together plan for together spec', () => {
    const root = document.createElement('div');
    const content = document.createElement('div');
    root.appendChild(content);
    const plan = planReveal(content, root, together);
    expect(plan.kind).toBe('together');
  });
});

describe('createSkeletonBox', () => {
  it('creates span with ask-bar and dimensions', () => {
    const el = createSkeletonBox({ width: '80%', height: '24px', radius: '4px' });
    expect(el.tagName.toLowerCase()).toBe('span');
    expect(el.hasAttribute(ATTR_BAR)).toBe(true);
    expect(el.style.width).toBe('80%');
    expect(el.style.height).toBe('24px');
    expect(el.style.borderRadius).toBe('4px');
  });

  it('converts number props to px', () => {
    const style = skeletonBoxStyle({ width: 100, height: 20, radius: 8 });
    expect(style.width).toBe('100px');
    expect(style.height).toBe('20px');
    expect(style.borderRadius).toBe('8px');
  });
});

describe('motionOf', () => {
  it('reads animation and speed from computed styles', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const motion = motionOf(el);
    expect(motion.animation).toBe('shimmer');
    expect(motion.duration).toBe(DURATIONS.shimmer.slow);
    el.remove();
  });
});
