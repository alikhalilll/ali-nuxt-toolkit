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
      // reka-ui + vaul-vue must be external for the same reason `@alikhalilll/a-drawer`
      // externalises them: their provide/inject context symbols are created per module
      // instance. If this bundle inlines its own copy of vaul-vue while a consumer
      // opens an outer `DrawerRoot` from node_modules, the inner `DrawerRootNested`
      // injects the wrong symbol and throws
      // "Injection Symbol(DrawerRootContext) not found". Sharing one copy fixes this,
      // and mirrors what nested Dialog/Popover primitives inside the picker already
      // rely on.
      'reka-ui',
      'vaul-vue',
    ],
  })
);
