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

  it('strips skeleton classes / attributes when loading=false and no class is provided', () => {
    /* Bug fix: previously the `a-skeleton` + `a-skeleton__capture` divs
     * persisted with full skeleton classes after loading completed. The
     * component now collapses to a single `<div class="a-skeleton--unmounted">`
     * wrapper styled `display: contents` — invisible to flex/grid layout, no
     * skeleton classes, no skeleton attributes, no inner `__capture`. */
    const wrapper = mount(ASkeleton, {
      props: { loading: false },
      slots: { default: () => h('article', { class: 'real' }, 'content') },
    });
    expect(wrapper.find('.a-skeleton').exists()).toBe(false);
    expect(wrapper.find('.a-skeleton__capture').exists()).toBe(false);
    expect(wrapper.find('.a-skeleton__mirror').exists()).toBe(false);
    expect(wrapper.attributes('aria-busy')).toBeUndefined();
    expect(wrapper.attributes('data-loading')).toBeUndefined();
    expect(wrapper.attributes('role')).toBeUndefined();
    /* The unmounted-state class signals display:contents — wrapper is
     * transparent to the parent's layout. */
    expect((wrapper.element as HTMLElement).classList.contains('a-skeleton--unmounted')).toBe(true);
    expect(wrapper.find('article.real').exists()).toBe(true);
  });

  it('preserves the consumer class on a single wrapper when loading=false', () => {
    /* The consumer's layout class (e.g. `grid grid-cols-3`) must persist
     * across the loading → loaded transition so the layout doesn't shift.
     * When loading=false and a class is provided, render one wrapper
     * carrying just that class — no skeleton classes. */
    const wrapper = mount(ASkeleton, {
      props: { loading: false, class: 'grid grid-cols-3 gap-4' },
      slots: { default: () => h('article', { class: 'real' }, 'content') },
    });
    const root = wrapper.element as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe('div');
    expect(root.className).toBe('grid grid-cols-3 gap-4');
    /* No skeleton classes leak in. */
    expect(root.className).not.toContain('a-skeleton');
    expect(wrapper.find('article.real').exists()).toBe(true);
  });

  it('applies the consumer class to the wrapper during loading too (no layout shift)', () => {
    const wrapper = mount(ASkeleton, {
      props: { loading: true, class: 'grid grid-cols-3 gap-4', mode: 'mirror' },
      slots: { default: () => h('article', { class: 'card' }, 'x') },
    });
    const root = wrapper.element as HTMLElement;
    expect(root.classList.contains('a-skeleton')).toBe(true);
    expect(root.classList.contains('grid')).toBe(true);
    expect(root.classList.contains('grid-cols-3')).toBe(true);
  });

  it('renders `repeat` copies of the prototype during loading (mirror mode)', () => {
    /* `:repeat="3"` produces 3 structural skeletons as direct children of the
     * wrapper, so a `grid grid-cols-3` layout fills the row 1:1. */
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'mirror', repeat: 3 },
      slots: { default: () => h('article', { class: 'card' }, 'x') },
    });
    /* The structural walker emits one <article> per copy. */
    expect(wrapper.findAll('article.card')).toHaveLength(3);
  });

  it('downshifts clone mode to mirror when repeat > 1 (hydration safety)', () => {
    /* Clone mode mounts the prototype as real DOM for getComputedStyle() — but
     * Vue's SFC compiler hoists static slot templates as module-level constants,
     * so all N copies of a clone-mode prototype would share the same VNode
     * references. During SSR-to-CSR hydration, Vue's renderer mutates `vnode.el`
     * per copy and copy #2's hydration finds copy #1's `.el` already wired to a
     * different DOM neighbourhood — `element.nextSibling` returns null and the
     * hydration walker crashes.
     *
     * Workaround: when repeat > 1, transparently fall back to mirror mode for
     * the visible cells (mirror's walker produces fresh output vnodes per copy
     * via `h()`, no sharing). The root wrapper carries `a-skeleton--mode-mirror`
     * to make the downshift observable. */
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'clone', repeat: 3 },
      slots: { default: () => h('article', { class: 'card' }, 'x') },
    });
    const root = wrapper.element as HTMLElement;
    expect(root.classList.contains('a-skeleton--mode-mirror')).toBe(true);
    expect(root.classList.contains('a-skeleton--mode-clone')).toBe(false);
    /* And the visible cells are real mirror StructuralSkeletons, one per copy. */
    expect(wrapper.findAll('article.card')).toHaveLength(3);
  });

  it('keeps clone mode for single-copy renders (repeat === 1)', () => {
    /* Single-copy clone mode has no VNode sharing — there's only one ShapeHost,
     * referenced once. Vue's hoist optimisation is safe in this case. */
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'clone', repeat: 1 },
      slots: { default: () => h('article', { class: 'card' }, 'x') },
    });
    const root = wrapper.element as HTMLElement;
    expect(root.classList.contains('a-skeleton--mode-clone')).toBe(true);
    expect(root.classList.contains('a-skeleton--mode-mirror')).toBe(false);
  });

  it('uses the `#prototype` slot as the shape source, not the default slot', () => {
    /* When the consumer's v-for is empty but they've provided a prototype,
     * the skeleton uses the prototype's structure. */
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'mirror' },
      slots: {
        default: () => [] /* v-for over an empty list */,
        prototype: () => h('article', { class: 'shape' }, 'x'),
      },
    });
    expect(wrapper.find('article.shape').exists()).toBe(true);
  });

  it('uses the default slot verbatim (no auto-trim) when no #prototype is given', () => {
    /* The component does NOT auto-detect v-for and pick the first sibling.
     * Heuristics misfire on similar-but-distinct markup. Consumers iterating
     * with v-for should supply a #prototype slot explicitly; otherwise the
     * default slot is used as the shape source verbatim. */
    const wrapper = mount(ASkeleton, {
      props: { loading: true, mode: 'mirror' },
      slots: {
        default: () => [
          h('article', { key: 'a', class: 'card' }, 'A'),
          h('article', { key: 'b', class: 'card' }, 'B'),
          h('article', { key: 'c', class: 'card' }, 'C'),
        ],
      },
    });
    expect(wrapper.findAll('article.card')).toHaveLength(3);
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
