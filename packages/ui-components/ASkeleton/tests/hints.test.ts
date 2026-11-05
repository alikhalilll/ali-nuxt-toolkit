/**
 * `hints` — centralised author opt-outs. Each hint has two spellings
 * (data-attribute + class name) and both must resolve through the helpers;
 * walker tests cover the DOM dispatch, these tests cover the predicate.
 */
import { describe, expect, it } from 'vitest';
import {
  HINT_ATTRS,
  HINT_CLASSES,
  isForcedBlock,
  isIgnored,
  isSelfSkeletonising,
  isStopped,
} from '../src/utils/hints';

function el(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.firstElementChild as HTMLElement;
}

describe('hints', () => {
  describe('isIgnored', () => {
    it('returns true for the data-attribute spelling', () => {
      expect(isIgnored(el('<div data-skeleton-ignore></div>'))).toBe(true);
    });
    it('returns true for the class-name spelling', () => {
      expect(isIgnored(el('<div class="a-skel-ignore"></div>'))).toBe(true);
    });
    it('returns false for an unmarked element', () => {
      expect(isIgnored(el('<div></div>'))).toBe(false);
    });
    it('tolerates null', () => {
      expect(isIgnored(null)).toBe(false);
    });
  });

  describe('isStopped', () => {
    it('returns true for the data-attribute spelling', () => {
      expect(isStopped(el('<div data-skeleton-stop></div>'))).toBe(true);
    });
    it('returns true for the class-name spelling', () => {
      expect(isStopped(el('<div class="a-skel-stop"></div>'))).toBe(true);
    });
  });

  describe('isForcedBlock', () => {
    it('resolves the data-attribute', () => {
      expect(isForcedBlock(el('<div data-skeleton-block></div>'))).toBe(true);
    });
    it('resolves the class alias (`a-skel-block-hint`, NOT `a-skel-block`)', () => {
      /* `.a-skel-block` is the visual class painted on real shimmer blocks;
       * using it as a hint alias would conflate "author asked for" with
       * "walker rendered". The alias is deliberately `.a-skel-block-hint`. */
      expect(isForcedBlock(el('<div class="a-skel-block-hint"></div>'))).toBe(true);
      expect(isForcedBlock(el('<div class="a-skel-block"></div>'))).toBe(false);
    });
  });

  describe('isSelfSkeletonising', () => {
    it('resolves the data-attribute', () => {
      expect(isSelfSkeletonising(el('<div data-skeleton-own></div>'))).toBe(true);
    });
    it('resolves the class alias', () => {
      expect(isSelfSkeletonising(el('<div class="a-skel-own"></div>'))).toBe(true);
    });
  });

  it('exports frozen attribute + class name maps', () => {
    expect(HINT_ATTRS.ignore).toBe('data-skeleton-ignore');
    expect(HINT_CLASSES.ignore).toBe('a-skel-ignore');
    expect(() => {
      (HINT_ATTRS as unknown as { ignore: string }).ignore = 'x';
    }).toThrow();
  });
});
