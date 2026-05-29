import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-responsive-popover/nuxt` — registers the responsive-popover
 * components for Nuxt auto-import. Also import the a-popover and a-drawer
 * stylesheets (this component renders them), plus a-ui-base tokens.
 */

export interface ModuleOptions {
  prefix?: string;
}

const COMPONENTS: Record<string, string> = {
  AResponsivePopover: '@alikhalilll/a-responsive-popover',
  AResponsivePopoverContent: '@alikhalilll/a-responsive-popover',
  AResponsivePopoverTrigger: '@alikhalilll/a-responsive-popover',
};

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/a-responsive-popover',
    configKey: 'aResponsivePopover',
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
