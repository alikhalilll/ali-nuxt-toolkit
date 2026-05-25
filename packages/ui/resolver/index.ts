import type { ComponentResolver } from 'unplugin-vue-components';

/**
 * `@alikhalilll/ui/resolver` — auto-import resolver for non-Nuxt Vite/Webpack
 * consumers via `unplugin-vue-components`.
 *
 * Vite + `<TellInput>` in a template, no manual import → unplugin asks every
 * registered resolver "do you own this name?". This resolver answers yes
 * for any component the toolkit ships and points unplugin at the matching
 * subpath, e.g. `<ATellInput>` → `import { ATellInput } from '@alikhalilll/ui/tell-input'`.
 *
 * Usage in `vite.config.ts`:
 *   import Components from 'unplugin-vue-components/vite';
 *   import AlikhalilllUiResolver from '@alikhalilll/ui/resolver';
 *
 *   export default { plugins: [Components({ resolvers: [AlikhalilllUiResolver()] })] };
 */

export interface ResolverOptions {
  /**
   * Optional prefix the consumer uses for the toolkit's components. If unset,
   * the resolver matches the toolkit's native names (`ATellInput`, `AInput`, …).
   * Pass `'A'` to also accept `<ATellInput>` if a consumer renames the prefix.
   */
  prefix?: string;
}

// Component → subpath registry. Keep in sync with `nuxt/index.ts` and the
// `package.json` exports map.
const COMPONENT_TO_ENTRY: Record<string, string> = {
  // tell-input
  ATellInput: 'tell-input',
  ACountrySelect: 'tell-input',
  ACountryFlag: 'tell-input',
  // input
  AInput: 'input',
  // popover
  APopover: 'popover',
  APopoverContent: 'popover',
  APopoverTrigger: 'popover',
  APopoverOverlay: 'popover',
  // drawer
  ADrawer: 'drawer',
  ADrawerContent: 'drawer',
  ADrawerTrigger: 'drawer',
  ADrawerOverlay: 'drawer',
  // responsive-popover
  AResponsivePopover: 'responsive-popover',
  AResponsivePopoverContent: 'responsive-popover',
  AResponsivePopoverTrigger: 'responsive-popover',
};

export default function AlikhalilllUiResolver(opts: ResolverOptions = {}): ComponentResolver {
  const prefix = opts.prefix ?? '';
  return {
    type: 'component',
    resolve(name) {
      const bare = prefix && name.startsWith(prefix) ? name.slice(prefix.length) : name;
      const entry = COMPONENT_TO_ENTRY[bare];
      if (!entry) return;
      return { name: bare, from: `@alikhalilll/ui/${entry}` };
    },
  };
}
