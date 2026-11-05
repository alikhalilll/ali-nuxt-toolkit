import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import { ASmartSkeleton } from '../src/vue/Skeleton';
import { ASmartSkeletonProvider } from '../src/vue/config';

it('renders a loading skeleton on the server', async () => {
  const app = createSSRApp({
    render: () =>
      h(
        ASmartSkeleton,
        { data: null, sample: { name: 'Ada' } },
        {
          default: ({ data }: { data: { name: string } }) => h('p', data.name),
        }
      ),
  });
  const html = await renderToString(app);
  expect(html).toContain('ask-loading');
  expect(html).toContain('<p>Ada</p>');
});

it('sets the provider nonce and theme on the server', async () => {
  const app = createSSRApp({
    render: () =>
      h(ASmartSkeletonProvider, { nonce: 'abc123', mode: 'dark' }, () =>
        h(ASmartSkeleton, { loading: true, label: 'Loading' }, () => h('p', 'Ada'))
      ),
  });
  const html = await renderToString(app);
  expect(html).toContain('<script nonce="abc123">');
  expect(html).toContain('<style nonce="abc123">');
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('inert');
  expect(html).toContain('ask-status');
});
