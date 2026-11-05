import { describe, expect, it } from 'vitest';
import { canAnimate, prefersReducedMotion } from '../src/utils/motion';

describe('motion', () => {
  it('canAnimate returns a boolean', () => {
    expect(typeof canAnimate()).toBe('boolean');
  });

  it('prefersReducedMotion is boolean', () => {
    expect(typeof prefersReducedMotion()).toBe('boolean');
  });

  it('tolerates missing window.matchMedia', () => {
    const original = window.matchMedia;
    (window as unknown as { matchMedia?: unknown }).matchMedia = undefined;
    try {
      /* happy-dom's Element.prototype.animate is also mocked out; the second
       * guard inside prefersReducedMotion falls through to false. */
      expect(typeof prefersReducedMotion()).toBe('boolean');
    } finally {
      window.matchMedia = original;
    }
  });
});
