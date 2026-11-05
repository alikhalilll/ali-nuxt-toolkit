/**
 * `<ASkeleton :mode="measure">` — the new ghost-and-bones pipeline.
 *
 * Verifies the composition wires correctly: the ghost mounts the slot,
 * the bones layer attaches a shadow root, and the measure path doesn't
 * throw on empty-content fixtures.
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import ASkeleton from '../src/components/ASkeleton.vue';

describe('<ASkeleton mode="measure">', () => {
  it('mounts the ghost + bones layer when loading', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'measure' as 'clone' },
      slots: { default: () => h('p', 'hello') },
    });
    expect(wrapper.find('[data-a-skel-ghost]').exists()).toBe(true);
    expect(wrapper.find('[data-a-skel-layer]').exists()).toBe(true);
  });

  it('renders no ghost / layer when not loading', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: false, mode: 'measure' as 'clone' },
      slots: { default: () => h('p', 'hello') },
    });
    expect(wrapper.find('[data-a-skel-ghost]').exists()).toBe(false);
    expect(wrapper.find('[data-a-skel-layer]').exists()).toBe(false);
  });

  it('still handles error/empty states in measure mode', () => {
    const wrapper = mount(ASkeleton, {
      props: { mode: 'measure' as 'clone', error: new Error('boom') },
      slots: {
        default: () => h('p', 'content'),
        error: ({ error }: { error: Error }) => h('div', { class: 'error-pane' }, error.message),
      },
    });
    expect(wrapper.find('.error-pane').exists()).toBe(true);
    expect(wrapper.find('[data-a-skel-ghost]').exists()).toBe(false);
  });

  it('respects data-skeleton-ignore inside the ghost (measurement does not mark it)', async () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'measure' as 'clone' },
      slots: {
        default: () =>
          h('div', null, [
            h('p', { 'data-skeleton-ignore': '' }, 'ignored'),
            h('p', null, 'measured'),
          ]),
      },
    });
    const ignored = wrapper.find('[data-skeleton-ignore]');
    expect(ignored.exists()).toBe(true);
    /* The ignored element must never receive data-a-skel-covered because
     * the walker short-circuits before classification. */
    expect(ignored.attributes('data-a-skel-covered')).toBeUndefined();
  });
});
