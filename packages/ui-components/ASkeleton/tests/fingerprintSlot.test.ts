import { describe, expect, it } from 'vitest';
import { Comment, Fragment, Text, defineComponent, h } from 'vue';
import { fingerprintSlot } from '../src/utils/fingerprint';

describe('fingerprintSlot', () => {
  it('returns "anonymous" for undefined input', () => {
    expect(fingerprintSlot(undefined)).toBe('anonymous');
  });

  it('returns the first child component name', () => {
    const UserCard = defineComponent({ name: 'UserCard', template: '<div/>' });
    expect(fingerprintSlot([h(UserCard)])).toBe('UserCard');
  });

  it('returns the first child component __name (script-setup default)', () => {
    const UserCard = { __name: 'UserCard', setup: () => () => h('div') };
    expect(fingerprintSlot([h(UserCard as never)])).toBe('UserCard');
  });

  it('returns the first child HTML tag when no component is wrapped', () => {
    expect(fingerprintSlot([h('section', null, [h('p')])])).toBe('section');
  });

  it('skips Comment and Text vnodes when finding the fingerprint', () => {
    const commentVN = h(Comment);
    const textVN = h(Text, null, ' ');
    const realVN = h('article');
    expect(fingerprintSlot([commentVN, textVN, realVN])).toBe('article');
  });

  it('recurses into Fragments to find the first identifiable child', () => {
    const inner = h('header');
    const frag = h(Fragment, null, [inner]);
    expect(fingerprintSlot([frag])).toBe('header');
  });

  it('returns "anonymous" when the slot contains only comments / text', () => {
    expect(fingerprintSlot([h(Comment), h(Text, null, ' ')])).toBe('anonymous');
  });
});
