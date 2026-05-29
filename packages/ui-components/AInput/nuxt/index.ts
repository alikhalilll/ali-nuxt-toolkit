import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-input/nuxt` — registers AInput for Nuxt auto-import.
 *
 *   modules: ['@alikhalilll/a-input/nuxt'],
 *   aInput: { prefix: 'A' },   // optional
 *
 * Styles are not auto-injected; add `'@alikhalilll/a-ui-base/tokens.css'` and
 * `'@alikhalilll/a-input/styles.css'` to your Nuxt `css` array.
 */

export interface ModuleOptions {
  /** Optional prefix prepended to the registered component name. */
  prefix?: string;
}

const COMPONENTS: Record<string, string> = {
  AInput: '@alikhalilll/a-input',
};

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/a-input',
    configKey: 'aInput',
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
