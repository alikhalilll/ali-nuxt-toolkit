import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-drawer/nuxt` — registers the drawer components for Nuxt
 * auto-import. Add `'@alikhalilll/a-ui-base/tokens.css'` and
 * `'@alikhalilll/a-drawer/styles.css'` to your Nuxt `css` array.
 */

export interface ModuleOptions {
  prefix?: string;
}

const COMPONENTS: Record<string, string> = {
  ADrawer: '@alikhalilll/a-drawer',
  ADrawerContent: '@alikhalilll/a-drawer',
  ADrawerTrigger: '@alikhalilll/a-drawer',
  ADrawerOverlay: '@alikhalilll/a-drawer',
};

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/a-drawer',
    configKey: 'aDrawer',
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
