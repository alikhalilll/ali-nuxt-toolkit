import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit';

export interface ModuleOptions {
  emoji?: string;
  size?: number;
  background?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@yourname/emoji-favicon',
    configKey: 'emojiFavicon',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    emoji: '',
    size: 64,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // 1. Runtime client plugin — installs the Vue plugin in the browser.
    addPlugin({
      src: resolve('./runtime/plugin.client'),
      mode: 'client',
    });

    // 2. Auto-import the composable.
    addImports({
      name: 'useEmojiFavicon',
      from: '@yourname/emoji-favicon/vue',
    });

    // 3. Auto-register the component.
    addComponent({
      name: 'EmojiFavicon',
      filePath: '@yourname/emoji-favicon/vue',
    });

    // 4. Push options into runtime config so the plugin can read them.
    nuxt.options.runtimeConfig.public.emojiFavicon = {
      ...(nuxt.options.runtimeConfig.public.emojiFavicon as Record<string, unknown> | undefined),
      ...options,
    };
  },
});
