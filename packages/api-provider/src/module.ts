import { addPlugin, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

import { createConfigTemplateContents } from './templates/config.template';
import { createHandlersTemplateContents } from './templates/handlers.template';
import { createTypesTemplateContents } from './templates/types.template';
import type { ApiProviderModuleOptions } from './types/module-options';
import { normalizeProvideName } from './utils/normalize-provide-name';

export * from './types';

const apiProviderModule: NuxtModule<ApiProviderModuleOptions> =
  defineNuxtModule<ApiProviderModuleOptions>({
    meta: {
      name: '@alikhalilll/nuxt-api-provider',
      configKey: 'apiProvider',
      compatibility: { nuxt: '>=3.0.0' },
    },
    defaults: {
      baseURL: '',
      provideName: '$apiProvider',
      defaultTimeoutMs: 20_000,
    },
    setup(options, nuxt) {
      const resolver = createResolver(import.meta.url);
      const normalizedProvideName = normalizeProvideName(options.provideName, 'apiProvider');

      addTemplate({
        filename: 'api-provider-config.mjs',
        getContents: () => createConfigTemplateContents({ options, normalizedProvideName }),
      });

      addTemplate({
        filename: 'api-provider-handlers.mjs',
        getContents: () => createHandlersTemplateContents(options),
      });

      const typesTemplate = addTemplate({
        filename: 'types/api-provider.d.ts',
        getContents: () =>
          createTypesTemplateContents({
            typesEntryPath: resolver.resolve('./types/index'),
            normalizedProvideName,
          }),
      });

      addPlugin({ mode: 'all', src: resolver.resolve('./runtime/plugin') });

      nuxt.hook('prepare:types', ({ references }) => {
        references.push({ path: typesTemplate.dst });
      });
    },
  });

export default apiProviderModule;
