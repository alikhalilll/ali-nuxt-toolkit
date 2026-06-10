// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { setFavicon, isEmoji, renderEmojiToDataUrl, FaviconController } from '../src/core';

beforeEach(() => {
  document.head.innerHTML = '';
});

describe('isEmoji', () => {
  it('accepts a simple emoji', () => {
    expect(isEmoji('⚡')).toBe(true);
  });
  it('rejects a plain letter', () => {
    expect(isEmoji('A')).toBe(false);
  });
  it('rejects an empty string', () => {
    expect(isEmoji('')).toBe(false);
  });
});

describe('renderEmojiToDataUrl', () => {
  it('returns a data: URL for a valid emoji', () => {
    const url = renderEmojiToDataUrl('⚡');
    expect(url).toBeTypeOf('string');
    expect(url!.startsWith('data:image/')).toBe(true);
  });
});

describe('setFavicon', () => {
  it('rejects invalid input with reason', () => {
    expect(setFavicon('not an emoji')).toEqual({
      ok: false,
      reason: 'invalid_emoji',
    });
  });

  it('inserts a <link rel="icon"> when given a valid emoji', () => {
    const before = document.querySelector('link[rel="icon"]');
    expect(before).toBeNull();

    const result = setFavicon('⚡');
    expect(result.ok).toBe(true);

    const after = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(after).not.toBeNull();
    expect(after!.href.startsWith('data:image/')).toBe(true);
  });
});

describe('FaviconController', () => {
  it('tracks current emoji', () => {
    const ctrl = new FaviconController();
    expect(ctrl.value).toBeNull();
    const r = ctrl.set('⚡');
    expect(r.ok).toBe(true);
    expect(ctrl.value).toBe('⚡');
  });

  it('clear() removes the link element', () => {
    const ctrl = new FaviconController();
    ctrl.set('⚡');
    expect(document.querySelector('link[rel="icon"]')).not.toBeNull();
    ctrl.clear();
    expect(document.querySelector('link[rel="icon"]')).toBeNull();
    expect(ctrl.value).toBeNull();
  });
});
