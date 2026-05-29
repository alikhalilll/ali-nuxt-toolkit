import type { ComponentResolver } from 'unplugin-vue-components';

/**
 * `@alikhalilll/a-drawer/resolver` — auto-import resolver for non-Nuxt
 * Vite/Webpack consumers via `unplugin-vue-components`.
 */

export interface ResolverOptions {
  prefix?: string;
}

const COMPONENT_TO_ENTRY: Record<string, string> = {
  ADrawer: '@alikhalilll/a-drawer',
  ADrawerContent: '@alikhalilll/a-drawer',
  ADrawerTrigger: '@alikhalilll/a-drawer',
  ADrawerOverlay: '@alikhalilll/a-drawer',
};

export default function ADrawerResolver(opts: ResolverOptions = {}): ComponentResolver {
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
