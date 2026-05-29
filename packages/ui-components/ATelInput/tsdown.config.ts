import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';
import { componentTsdownConfig } from '../tsdown.shared.mjs';

export default defineConfig(
  componentTsdownConfig({
    plugins: [Vue()],
    extraExternals: [
      '@alikhalilll/a-responsive-popover',
      'libphonenumber-js',
      'libphonenumber-js/examples.mobile.json',
      'class-variance-authority',
    ],
  })
);
