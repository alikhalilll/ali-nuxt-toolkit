import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';
import { componentTsdownConfig } from '../tsdown.shared.mjs';

export default defineConfig(
  componentTsdownConfig({
    plugins: [Vue()],
    extraExternals: ['@alikhalilll/a-popover', '@alikhalilll/a-drawer'],
  })
);
