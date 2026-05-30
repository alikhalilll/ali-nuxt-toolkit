import type { ComponentResolver } from 'unplugin-vue-components';

/**
 * `@alikhalilll/a-popover/resolver` — auto-import resolver for non-Nuxt
 * Vite/Webpack consumers via `unplugin-vue-components`.
 */

export interface ResolverOptions {
  prefix?: string;
}

const COMPONENT_TO_ENTRY: Record<string, string> = {
  APopover: '@alikhalilll/a-popover',
  APopoverContent: '@alikhalilll/a-popover',
  APopoverTrigger: '@alikhalilll/a-popover',
  APopoverOverlay: '@alikhalilll/a-popover',
};

export default function APopoverResolver(opts: ResolverOptions = {}): ComponentResolver {
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
