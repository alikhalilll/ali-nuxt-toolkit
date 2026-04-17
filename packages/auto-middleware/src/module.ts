import { addPlugin, defineNuxtModule } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

import { buildMap } from './build/build-map';
import { buildDispatcherPlugin } from './build/build-plugin';
import { buildTypesTemplate } from './build/build-types';
import type { AutoMiddlewareOptions } from './types';

export * from './types';

const autoMiddlewareModule: NuxtModule<AutoMiddlewareOptions> =
  defineNuxtModule<AutoMiddlewareOptions>({
    meta: {
      name: '@alikhalilll/nuxt-auto-middleware',
      configKey: 'autoMiddleware',
      compatibility: { nuxt: '>=3.0.0' },
    },
    defaults: {
      rules: [],
      groups: {},
      debug: false,
      pageMetaField: 'middlewares',
    },
    setup(options, nuxt) {
      const rules = Array.isArray(options.rules) ? options.rules : [];

      if (rules.length === 0) {
        if (nuxt.options.dev) {
          // eslint-disable-next-line no-console
          console.warn(
            '[@alikhalilll/nuxt-auto-middleware] No rules provided; nothing to do.'
          );
        }
        return;
      }

      const { allMiddlewares, mapTpl } = buildMap(options);

      const pluginTpl = buildDispatcherPlugin({
        allMiddlewares,
        mapFilename: mapTpl.filename,
        debug: options.debug ?? false,
        pageMetaField: options.pageMetaField ?? 'middlewares',
      });

      const typesTpl = buildTypesTemplate({
        allMiddlewares,
        pageMetaField: options.pageMetaField ?? 'middlewares',
      });

      addPlugin({ src: pluginTpl.dst });

      nuxt.hook('prepare:types', ({ references }) => {
        references.push({ path: typesTpl.dst });
      });
    },
  });

export default autoMiddlewareModule;
