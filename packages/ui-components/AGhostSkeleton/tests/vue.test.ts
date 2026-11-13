import { describe, expect, it } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { AGhostSkeleton, AGhostSkeletonBox } from '../src/vue';
import { ATTR_BAR, ATTR_LOADING, ATTR_OWN, ATTR_REVEAL, ATTR_STATUS } from '../src/core';

describe('AGhostSkeletonBox', () => {
  it('mounts with ask-bar attribute and dimensional styles', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render: () => h(AGhostSkeletonBox, { width: '120px', height: '32px', radius: '8px' }),
    });
    app.mount(root);
    await nextTick();

    const box = root.querySelector(`[${ATTR_BAR}]`) as HTMLElement;
    expect(box).toBeTruthy();
    expect(box.style.width).toBe('120px');
    expect(box.style.height).toBe('32px');
    expect(box.style.borderRadius).toBe('8px');

    app.unmount();
    root.remove();
  });
});

describe('AGhostSkeleton', () => {
  it('renders loading state when loading=true', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render: () =>
        h(
          AGhostSkeleton,
          { loading: true, label: 'Loading profile...' },
          { default: () => h('div', 'Profile details') }
        ),
    });
    app.mount(root);
    await nextTick();

    const reveal = root.querySelector(`[${ATTR_REVEAL}]`);
    expect(reveal).toBeTruthy();
    expect(reveal?.getAttribute('aria-busy')).toBe('true');

    const status = root.querySelector(`[${ATTR_STATUS}]`);
    expect(status?.textContent).toBe('Loading profile...');

    const loading = root.querySelector(`[${ATTR_LOADING}]`);
    expect(loading).toBeTruthy();

    app.unmount();
    root.remove();
  });

  it('renders content when data is loaded', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render: () =>
        h(
          AGhostSkeleton,
          { data: { name: 'Alice' } },
          {
            default: ({ data }: { data: { name: string } }) =>
              h('div', { class: 'content' }, data.name),
          }
        ),
    });
    app.mount(root);
    await nextTick();

    const content = root.querySelector('.content');
    expect(content?.textContent).toBe('Alice');

    app.unmount();
    root.remove();
  });

  it('renders custom skeleton slot when provided', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render: () =>
        h(
          AGhostSkeleton,
          { loading: true },
          {
            default: () => h('div', 'Real Content'),
            skeleton: () => h('div', { class: 'custom-skel' }, 'Custom Skeleton'),
          }
        ),
    });
    app.mount(root);
    await nextTick();

    const own = root.querySelector(`[${ATTR_OWN}]`);
    expect(own).toBeTruthy();
    expect(own?.textContent).toContain('Custom Skeleton');

    app.unmount();
    root.remove();
  });

  it('renders error slot when error is passed', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render: () =>
        h(
          AGhostSkeleton,
          { error: new Error('Failed to load') },
          {
            default: () => h('div', 'Content'),
            error: ({ error }: { error: Error }) => h('div', { class: 'err' }, error.message),
          }
        ),
    });
    app.mount(root);
    await nextTick();

    const err = root.querySelector('.err');
    expect(err?.textContent).toBe('Failed to load');

    app.unmount();
    root.remove();
  });

  it('renders empty slot when empty=true', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render: () =>
        h(
          AGhostSkeleton,
          { empty: true },
          {
            default: () => h('div', 'Content'),
            empty: () => h('div', { class: 'empty' }, 'No items found'),
          }
        ),
    });
    app.mount(root);
    await nextTick();

    const empty = root.querySelector('.empty');
    expect(empty?.textContent).toBe('No items found');

    app.unmount();
    root.remove();
  });
});
