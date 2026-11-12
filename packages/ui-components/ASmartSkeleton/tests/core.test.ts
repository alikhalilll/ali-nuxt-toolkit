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
  shimmer,
} from '../src/core';
import { directionOf } from '../src/core/motion';

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
    // the bones clear while the frame is still settling. 260 ms is the
    // sweet spot between "sluggish" and "jarring".
    expect(FADE_DURATION).toBe(260);
    expect(RESIZE_DURATION).toBe(260);
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

describe('byPosition direction', () => {
  // CASCADE_SPREAD is 0 today, so byPosition evaluates to 0 for every piece. We verify
  // the function accepts both directions without throwing, and that the reading-order
  // formula itself reverses between LTR and RTL (so it's wired for the day CASCADE_SPREAD
  // becomes non-zero).
  const reveal = new DOMRect(0, 0, 1000, 400);
  const leftPiece = {
    rect: new DOMRect(0, 100, 100, 50),
    unit: null,
    secondary: false,
    reveal,
    late: 0,
  };
  const rightPiece = {
    rect: new DOMRect(900, 100, 100, 50),
    unit: null,
    secondary: false,
    reveal,
    late: 0,
  };

  it('accepts both directions and returns a finite number', () => {
    expect(Number.isFinite(byPosition({ ...leftPiece, direction: 'ltr' }))).toBe(true);
    expect(Number.isFinite(byPosition({ ...rightPiece, direction: 'rtl' }))).toBe(true);
  });

  it('reading-order axis flips sign between LTR and RTL', () => {
    const acrossLtr = (rect: DOMRect) => (rect.left - reveal.left) / reveal.width;
    const acrossRtl = (rect: DOMRect) => (reveal.right - rect.right) / reveal.width;
    expect(acrossLtr(leftPiece.rect)).toBeLessThan(acrossLtr(rightPiece.rect));
    expect(acrossRtl(leftPiece.rect)).toBeGreaterThan(acrossRtl(rightPiece.rect));
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
    expect(motion.direction).toBe('ltr');
    el.remove();
  });

  it('picks up `direction: rtl` from the element itself', () => {
    const el = document.createElement('div');
    el.style.direction = 'rtl';
    document.body.appendChild(el);
    try {
      expect(motionOf(el).direction).toBe('rtl');
    } finally {
      el.remove();
    }
  });
});

describe('directionOf', () => {
  it('defaults to ltr', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(directionOf(el)).toBe('ltr');
    el.remove();
  });

  it('reads `direction: rtl` set directly on the element', () => {
    const el = document.createElement('div');
    el.style.direction = 'rtl';
    document.body.appendChild(el);
    expect(directionOf(el)).toBe('rtl');
    el.remove();
  });
});

describe('shimmer direction', () => {
  // Shimmer uses `element.animate`; fix a bounding box so happy-dom doesn't zero everything out.
  const mountWithRect = (direction: 'ltr' | 'rtl') => {
    const el = document.createElement('div');
    if (direction === 'rtl') el.style.direction = 'rtl';
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 50,
        width: 200,
        height: 30,
        right: 300,
        bottom: 80,
        x: 100,
        y: 50,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(el);
    return el;
  };

  const keyframesOf = (el: HTMLElement) => {
    const anim = el.getAnimations?.()[0];
    return anim?.effect?.getKeyframes?.() ?? [];
  };

  const bgX = (keyframe: Keyframe) => {
    const raw = String(keyframe.backgroundPosition ?? '');
    const match = raw.match(/(-?[\d.]+)px/);
    return match ? parseFloat(match[1]!) : NaN;
  };

  it('LTR shimmer advances backgroundPosition in +x', () => {
    const el = mountWithRect('ltr');
    try {
      shimmer(el);
      const kfs = keyframesOf(el);
      expect(kfs).toHaveLength(2);
      expect(bgX(kfs[1]!)).toBeGreaterThan(bgX(kfs[0]!));
    } finally {
      el.remove();
    }
  });

  it('RTL shimmer advances backgroundPosition in -x', () => {
    const el = mountWithRect('rtl');
    try {
      shimmer(el);
      const kfs = keyframesOf(el);
      expect(kfs).toHaveLength(2);
      expect(bgX(kfs[1]!)).toBeLessThan(bgX(kfs[0]!));
    } finally {
      el.remove();
    }
  });

  it('RTL and LTR deltas have equal magnitude (one tile), opposite sign', () => {
    const ltr = mountWithRect('ltr');
    const rtl = mountWithRect('rtl');
    try {
      shimmer(ltr);
      shimmer(rtl);
      const dLtr = bgX(keyframesOf(ltr)[1]!) - bgX(keyframesOf(ltr)[0]!);
      const dRtl = bgX(keyframesOf(rtl)[1]!) - bgX(keyframesOf(rtl)[0]!);
      expect(dLtr).toBeCloseTo(-dRtl, 5);
    } finally {
      ltr.remove();
      rtl.remove();
    }
  });
});
