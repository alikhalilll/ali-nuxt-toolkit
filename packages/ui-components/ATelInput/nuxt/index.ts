import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-tel-input/nuxt` — registers the tel-input components for Nuxt
 * auto-import. The country picker renders a-popover/a-drawer, so also import
 * their stylesheets plus a-ui-base tokens and a-tel-input styles.
 */

export interface ModuleOptions {
  prefix?: string;
}

const COMPONENTS: Record<string, string> = {
  ATelInput: '@alikhalilll/a-tel-input',
  ACountrySelect: '@alikhalilll/a-tel-input',
  ACountryFlag: '@alikhalilll/a-tel-input',
};

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/a-tel-input',
    configKey: 'aTelInput',
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
