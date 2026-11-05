import type { ComponentResolver } from 'unplugin-vue-components';

/**
 * `@alikhalilll/a-smart-skeleton/resolver` — auto-import resolver for non-Nuxt
 * Vite / Webpack consumers via `unplugin-vue-components`.
 *
 *   import Components from 'unplugin-vue-components/vite';
 *   import ASmartSkeletonResolver from '@alikhalilll/a-smart-skeleton/resolver';
 *   export default { plugins: [Components({ resolvers: [ASmartSkeletonResolver()] })] };
 */

export interface ResolverOptions {
  /** Optional prefix the consumer uses (e.g. `'A'`). Defaults to the native `A*` names. */
  prefix?: string;
}

const COMPONENT_TO_ENTRY: Record<string, string> = {
  ASmartSkeleton: '@alikhalilll/a-smart-skeleton',
  ASmartSkeletonBox: '@alikhalilll/a-smart-skeleton',
  ASmartSkeletonSuspense: '@alikhalilll/a-smart-skeleton',
  ASmartSkeletonProvider: '@alikhalilll/a-smart-skeleton',
};

export default function ASmartSkeletonResolver(opts: ResolverOptions = {}): ComponentResolver {
  const prefix = opts.prefix ?? '';
  return {
    type: 'component',
    resolve(name) {
      const bare = prefix && name.startsWith(prefix) ? name.slice(prefix.length) : name;
      const from = COMPONENT_TO_ENTRY[bare];
      if (!from) return;
      return { name: bare, from };
    },
  };
}
