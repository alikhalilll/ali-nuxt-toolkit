import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';
import { componentTsdownConfig } from '../tsdown.shared.mjs';

export default defineConfig(
  componentTsdownConfig({
    plugins: [Vue()],
    extraExternals: [
      'libphonenumber-js',
      'libphonenumber-js/examples.mobile.json',
      'class-variance-authority',
      // Optional peer deps for the `./vee-validate` and `./zod` subpath entries — must
      // stay external so consumers' own copies are used (and so the main bundle stays
      // free of them when those subpaths aren't imported).
      'vee-validate',
      'zod',
    ],
  })
);
