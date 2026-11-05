/**
 * Reveal planner — strategy selection + delay math.
 *
 * The planner is pure; we construct `RevealContext` values by hand and assert
 * the resulting `Plan` matches the mode. Delay numbers come from the exported
 * constants so tests stay in sync when skullet's defaults change.
 */
import { describe, expect, it } from 'vitest';
import {
  FADE_DURATION,
  QUICK_FADE,
  SKELETON_DELAY,
  SMALL_HEIGHT,
  SMALL_PIECES,
  byPosition,
  byRow,
  noteSkeleton,
  planReveal,
  quickly,
  revealContext,
  type RevealContext,
} from '../src/reveal/plan';

function ctx(partial: Partial<RevealContext> = {}): RevealContext {
  return {
    content: document.createElement('div'),
    reveal: document.createElement('div'),
    waited: 1_000,
    input: false,
    refetch: false,
    height: 400,
    pieces: 10,
    ...partial,
  };
}

describe('planReveal', () => {
  it('returns instant for mode="instant" unconditionally', () => {
    const plan = planReveal('instant', ctx());
    expect(plan.kind).toBe('instant');
  });

  it('returns together for mode="together"', () => {
    const plan = planReveal('together', ctx());
    expect(plan.kind).toBe('together');
    if (plan.kind === 'together') {
      expect(plan.duration).toBe(FADE_DURATION);
    }
  });

  it('smart short-circuits to instant on recent input', () => {
    const plan = planReveal('smart', ctx({ input: true }));
    expect(plan.kind).toBe('instant');
  });

  it('smart short-circuits to instant for sub-SKELETON_DELAY waits', () => {
    const plan = planReveal('smart', ctx({ waited: SKELETON_DELAY - 1 }));
    expect(plan.kind).toBe('instant');
  });

  it('smart picks a quick together for refetch', () => {
    const plan = planReveal('smart', ctx({ refetch: true }));
    expect(plan.kind).toBe('together');
    if (plan.kind === 'together') expect(plan.duration).toBe(QUICK_FADE);
  });

  it('smart picks together for small reveals (height or piece count)', () => {
    const small = planReveal('smart', ctx({ height: SMALL_HEIGHT - 1, pieces: SMALL_PIECES }));
    expect(small.kind).toBe('together');
  });

  it('smart picks sequence for larger reveals', () => {
    /* Needs real DOM content so pieces() + unitOf() return non-empty.
     * We attach a simple structure to the document so getBoundingClientRect
     * returns usable (zero-but-defined) values in happy-dom. */
    const content = document.createElement('div');
    content.innerHTML = `
      <p>paragraph one</p>
      <p>paragraph two</p>
      <p>paragraph three</p>
      <p>paragraph four</p>
    `;
    const reveal = document.createElement('div');
    reveal.appendChild(content);
    document.body.appendChild(reveal);
    const plan = planReveal(
      'smart',
      ctx({ content, reveal, height: SMALL_HEIGHT + 100, pieces: 4 })
    );
    expect(plan.kind).toBe('sequence');
    document.body.removeChild(reveal);
  });
});

describe('quickly', () => {
  it('is null for the base case (waited enough, no input, no refetch)', () => {
    expect(quickly(ctx())).toBeNull();
  });
});

describe('byPosition', () => {
  it('monotonically increases down + right', () => {
    const reveal = new DOMRect(0, 0, 1000, 1000);
    const top = byPosition({
      rect: new DOMRect(0, 0, 10, 10),
      unit: null,
      secondary: false,
      reveal,
      late: 0,
    });
    const bottom = byPosition({
      rect: new DOMRect(0, 900, 10, 10),
      unit: null,
      secondary: false,
      reveal,
      late: 0,
    });
    expect(bottom).toBeGreaterThan(top);
  });
});

describe('byRow', () => {
  it('returns 0 for pieces outside the viewport', () => {
    const reveal = new DOMRect(0, 0, 100, 100);
    const delay = byRow({
      rect: new DOMRect(0, -500, 10, 10),
      unit: new DOMRect(0, -500, 10, 10),
      secondary: false,
      reveal,
      late: 0,
    });
    expect(delay).toBe(0);
  });
});

describe('noteSkeleton', () => {
  it('records a served skeleton as -Infinity waited', () => {
    const reveal = document.createElement('div');
    noteSkeleton(reveal, { served: true });
    /* Can't peek at the WeakMap directly; verify the knock-on effect via
     * revealContext(). `served: true` sets `since = -Infinity`, so
     * `performance.now() - (-Infinity) === Infinity`. */
    const c = revealContext(document.createElement('div'), reveal);
    expect(c.waited).toBe(Infinity);
  });
});
