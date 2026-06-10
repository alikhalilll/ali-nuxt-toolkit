import type { App, Plugin } from 'vue';
import { setFavicon, type SetFaviconOptions } from '../core';
import EmojiFavicon from './EmojiFavicon.vue';
import { useEmojiFavicon } from './use-emoji-favicon';

export interface EmojiFaviconVueOptions extends SetFaviconOptions {
  initial?: string;
  registerComponent?: boolean;
}

export const EmojiFaviconPlugin: Plugin<EmojiFaviconVueOptions> = {
  install(app: App, options: EmojiFaviconVueOptions = {}) {
    if (options.initial) setFavicon(options.initial, options);
    app.provide('emojiFavicon', {
      set: (e: string) => setFavicon(e, options),
    });
    if (options.registerComponent !== false) {
      app.component('EmojiFavicon', EmojiFavicon);
    }
  },
};

export { EmojiFavicon, useEmojiFavicon };
export default EmojiFaviconPlugin;
