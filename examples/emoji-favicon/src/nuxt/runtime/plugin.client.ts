// Nuxt resolves `#imports` / `#app` at build time; the import paths only
// exist in the consumer's project, never in this package's standalone test.
// @ts-expect-error -- virtual import resolved by Nuxt at the consumer build
import { defineNuxtPlugin, useRuntimeConfig } from '#imports';
import EmojiFaviconPlugin from '@yourname/emoji-favicon/vue';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.emojiFavicon ?? {};
  nuxtApp.vueApp.use(EmojiFaviconPlugin, {
    initial: config.emoji ?? '',
    size: config.size,
    background: config.background,
  });
});
