/**
 * Component-level integration: mount <ASkeleton> with happy-dom and assert the
 * DOM the user actually sees in each major state.
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import ASkeleton from '../src/components/ASkeleton.vue';

describe('<ASkeleton>', () => {
  it('renders the slot as-is when loading=false', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: false },
      slots: { default: () => h('p', { class: 'real-content' }, 'Hello') },
    });
    expect(wrapper.find('.real-content').exists()).toBe(true);
    expect(wrapper.find('.real-content').text()).toBe('Hello');
  });

  it('renders the DOM-mirror skeleton when loading=true', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true },
      slots: {
        default: () =>
          h('div', { class: 'card bg-white rounded-2xl p-6' }, [
            h('h3', null, 'Pro'),
            h('p', null, 'Description text'),
            h('button', { class: 'bg-emerald-600 px-4' }, 'Buy now'),
          ]),
      },
    });
    /* The white card wrapper survives. */
    expect(wrapper.find('.card').exists()).toBe(true);
    expect(wrapper.find('.bg-white').exists()).toBe(true);
    /* The button keeps its real bg (no .a-skel-block applied). */
    expect(wrapper.find('button.bg-emerald-600').exists()).toBe(true);
    /* Headings + paragraphs are preserved and contain text-content spans. */
    expect(wrapper.find('h3').exists()).toBe(true);
    expect(wrapper.find('h3 .a-skel-text-content').exists()).toBe(true);
    expect(wrapper.find('p .a-skel-text-content').exists()).toBe(true);
    /* The real text is kept inside the span (it's the source of inline width). */
    expect(wrapper.find('h3 .a-skel-text-content').text()).toBe('Pro');
  });

  it('emits a fallback shimmer block when the slot is empty during loading (mirror mode)', () => {
    /* `.a-skeleton__fallback` is a mirror-mode-only branch — clone mode always
     * has a capture mount + replay layer (or nothing during cache miss). */
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'mirror' },
      slots: { default: () => [] },
    });
    expect(wrapper.find('.a-skeleton__fallback').exists()).toBe(true);
  });

  it('respects the animation prop', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true, animation: 'pulse' },
      slots: { default: () => h('p', null, 'x') },
    });
    expect(wrapper.find('.a-skel-block--anim-pulse').exists()).toBe(true);
  });

  it('disables animation when animation="none"', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true, animation: 'none' },
      slots: { default: () => h('p', null, 'x') },
    });
    expect(wrapper.find('.a-skel-block--anim-shimmer').exists()).toBe(false);
    expect(wrapper.find('.a-skel-block--anim-pulse').exists()).toBe(false);
  });

  it('sets aria-busy + role=status only while loading', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true },
      slots: { default: () => h('p', null, 'x') },
    });
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.attributes('role')).toBe('status');
  });

  it('renders an outlined button with surface fallback when no bg is supplied', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true },
      slots: {
        default: () => h('button', { class: 'border border-zinc-300 px-4 py-3' }, 'Talk to sales'),
      },
    });
    expect(wrapper.find('button.a-skel-block').exists()).toBe(true);
  });

  it('preserves explicit-bg buttons without the skeleton fallback', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true },
      slots: {
        default: () => h('button', { class: 'bg-emerald-600 px-4 py-3' }, 'Start free trial'),
      },
    });
    const btn = wrapper.find('button.bg-emerald-600');
    expect(btn.exists()).toBe(true);
    expect(btn.classes()).not.toContain('a-skel-block');
  });

  it('copies width/height attributes from <svg> into the replacement style (mirror mode)', () => {
    /* HTML-attribute → inline-style projection is mirror-mode-specific
     * (atomicDimensionStyle in buildStructuralSkeleton). Clone mode reads
     * computed styles from the live DOM, so this projection isn't needed. */
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'mirror' },
      slots: {
        default: () => h('svg', { width: '408', height: '419', class: 'absolute' }),
      },
    });
    const div = wrapper.find('.absolute');
    expect(div.exists()).toBe(true);
    /* The size attributes survive as inline style. */
    expect(div.attributes('style')).toMatch(/width:\s*408px/);
    expect(div.attributes('style')).toMatch(/height:\s*419px/);
  });

  it('flips between loading and not-loading states reactively', async () => {
    const Host = defineComponent({
      props: { loading: { type: Boolean, default: true } },
      setup(props) {
        return () =>
          h(
            ASkeleton,
            { loading: props.loading },
            { default: () => h('p', { class: 'real' }, 'Hello') }
          );
      },
    });
    const wrapper = mount(Host, { props: { loading: true } });
    /* In DOM-mirror mode the <p class="real"> element is preserved during
     * loading — only its text is replaced by a shimmer span. So the right
     * "loading state" signal is the presence of the shimmer span (and the
     * absence of the raw text node). */
    expect(wrapper.find('p.real').exists()).toBe(true);
    expect(wrapper.find('.a-skel-text-content').exists()).toBe(true);
    expect(wrapper.find('p.real').text()).toBe('Hello'); /* text is kept for width */

    await wrapper.setProps({ loading: false });
    expect(wrapper.find('p.real').exists()).toBe(true);
    expect(wrapper.find('.a-skel-text-content').exists()).toBe(false);
    expect(wrapper.find('p.real').text()).toBe('Hello');
  });
});
