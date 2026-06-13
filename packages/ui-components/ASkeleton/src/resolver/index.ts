import type { ComponentResolver } from 'unplugin-vue-components';

/**
 * `@alikhalilll/a-skeleton/resolver` — auto-import resolver for non-Nuxt
 * Vite/Webpack consumers via `unplugin-vue-components`.
 *
 *   import Components from 'unplugin-vue-components/vite';
 *   import ASkeletonResolver from '@alikhalilll/a-skeleton/resolver';
 *   export default { plugins: [Components({ resolvers: [ASkeletonResolver()] })] };
 *
 * Registers `<ASkeleton>`, `<ASkeletonLayer>`, `<ASkeletonBlock>`.
 */

export interface ResolverOptions {
  /** Optional prefix the consumer uses (e.g. `'A'`). Defaults to the native `A*` names. */
  prefix?: string;
}

const COMPONENT_TO_ENTRY: Record<string, string> = {
  ASkeleton: '@alikhalilll/a-skeleton',
  ASkeletonLayer: '@alikhalilll/a-skeleton',
  ASkeletonBlock: '@alikhalilll/a-skeleton',
  /* Variant primitives */
  ASkeletonText: '@alikhalilll/a-skeleton',
  ASkeletonHeading: '@alikhalilll/a-skeleton',
  ASkeletonAvatar: '@alikhalilll/a-skeleton',
  ASkeletonImage: '@alikhalilll/a-skeleton',
  ASkeletonVideo: '@alikhalilll/a-skeleton',
  ASkeletonButton: '@alikhalilll/a-skeleton',
  ASkeletonInput: '@alikhalilll/a-skeleton',
  ASkeletonListItem: '@alikhalilll/a-skeleton',
  ASkeletonCard: '@alikhalilll/a-skeleton',
  ASkeletonTable: '@alikhalilll/a-skeleton',
  ASkeletonChart: '@alikhalilll/a-skeleton',
  ASkeletonForm: '@alikhalilll/a-skeleton',
  ASkeletonArticle: '@alikhalilll/a-skeleton',
  ASkeletonDivider: '@alikhalilll/a-skeleton',
  ASkeletonChip: '@alikhalilll/a-skeleton',
};

export default function ASkeletonResolver(opts: ResolverOptions = {}): ComponentResolver {
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
