import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';
import { componentTsdownConfig } from '../tsdown.shared.mjs';

export default defineConfig(
  componentTsdownConfig({
    plugins: [Vue()],
    // vaul-vue + reka-ui must stay external so their provide/inject context symbols
    // match whatever a downstream consumer (or another `@alikhalilll/a-*` bundle in
    // the same app) is using. If we inline them, the `DrawerRoot` context this bundle
    // provides has a *different* Symbol than the one an outer drawer provided from
    // node_modules — so nested `DrawerRootNested` inject throws
    // "Injection Symbol(DrawerRootContext) not found".
    extraExternals: ['reka-ui', 'vaul-vue'],
  })
);
