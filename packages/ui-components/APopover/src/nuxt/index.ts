import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-popover/nuxt` — registers the popover components for Nuxt
 * auto-import. Add `'@alikhalilll/a-ui-base/tokens.css'` and
 * `'@alikhalilll/a-popover/styles.css'` to your Nuxt `css` array.
 */

export interface ModuleOptions {
  prefix?: string;
}

const COMPONENTS: Record<string, string> = {
  APopover: '@alikhalilll/a-popover',
  APopoverContent: '@alikhalilll/a-popover',
  APopoverTrigger: '@alikhalilll/a-popover',
  APopoverOverlay: '@alikhalilll/a-popover',
};

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/a-popover',
    configKey: 'aPopover',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: { prefix: '' },
  setup(opts) {
    const prefix = opts.prefix ?? '';
    for (const [exportName, from] of Object.entries(COMPONENTS)) {
      const baseName = exportName.startsWith('A') ? exportName.slice(1) : exportName;
      const registeredName = `${prefix}${prefix ? baseName : exportName}`;
      addComponent({ name: registeredName, export: exportName, filePath: from });
    }
  },
});

export default module;
