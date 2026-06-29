import { defineNuxtModule, addComponent, addPluginTemplate } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-tel-input/nuxt` — registers the tel-input components for Nuxt
 * auto-import and (when an `apiKey` is configured) wires the REST Countries v5
 * defaults via `installTelInputDefaults` at app startup.
 */

export interface ModuleOptions {
  prefix?: string;
  /**
   * REST Countries v5 API key. When set, every `<ATelInput>` / `<ACountrySelect>`
   * fires one fetch per browser to upgrade the country list (cached for 30 days).
   * Without a key the components stay on the synchronous libphonenumber baseline.
   */
  apiKey?: string;
  /** Override the v5 base URL (rarely useful). */
  restCountriesBaseUrl?: string;
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
  setup(opts, nuxt) {
    const prefix = opts.prefix ?? '';
    for (const [exportName, from] of Object.entries(COMPONENTS)) {
      const baseName = exportName.startsWith('A') ? exportName.slice(1) : exportName;
      const registeredName = `${prefix}${prefix ? baseName : exportName}`;
      addComponent({ name: registeredName, export: exportName, filePath: from });
    }

    // Skip the runtime-config + plugin if no v5 config is set — keeps Nuxt-only
    // consumers with no API key on the pure-sync baseline, zero added overhead.
    if (!opts.apiKey && !opts.restCountriesBaseUrl) return;

    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public ?? {};
    const publicCfg = nuxt.options.runtimeConfig.public as Record<string, unknown>;
    publicCfg.aTelInput = {
      ...((publicCfg.aTelInput as Record<string, unknown> | undefined) ?? {}),
      apiKey: opts.apiKey,
      restCountriesBaseUrl: opts.restCountriesBaseUrl,
    };

    addPluginTemplate({
      filename: 'a-tel-input-defaults.client.mjs',
      mode: 'all',
      getContents: () => `
import { defineNuxtPlugin, useRuntimeConfig } from '#app';
import { installTelInputDefaults } from '@alikhalilll/a-tel-input';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const ours = (config.public && config.public.aTelInput) || null;
  if (!ours) return;
  installTelInputDefaults(nuxtApp.vueApp, {
    apiKey: ours.apiKey,
    restCountriesBaseUrl: ours.restCountriesBaseUrl,
  });
});
`,
    });
  },
});

export default module;
