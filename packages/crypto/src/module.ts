import { addPlugin, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

import { createConfigTemplateContents } from './templates/config.template';
import { createTypesTemplateContents } from './templates/types.template';
import type { CryptoModuleOptions } from './types/module-options';
import { normalizeProvideName } from './utils/normalize-provide-name';

export * from './types';

const cryptoModule: NuxtModule<CryptoModuleOptions> = defineNuxtModule<CryptoModuleOptions>({
  meta: {
    name: '@alikhalilll/nuxt-crypto',
    configKey: 'crypto',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    passphrase: '',
    provideName: '$crypto',
    iterations: 100_000,
    keyCacheSize: 64,
    serverOnly: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const normalizedProvideName = normalizeProvideName(options.provideName, 'crypto');

    addTemplate({
      filename: 'crypto-config.mjs',
      getContents: () => createConfigTemplateContents({ options, normalizedProvideName }),
    });

    const typesTemplate = addTemplate({
      filename: 'types/crypto.d.ts',
      getContents: () =>
        createTypesTemplateContents({
          typesEntryPath: resolver.resolve('./types/index'),
          normalizedProvideName,
        }),
    });

    addPlugin({
      mode: options.serverOnly ? 'server' : 'all',
      src: resolver.resolve('./runtime/plugin'),
    });

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ path: typesTemplate.dst });
    });
  },
});

export default cryptoModule;
