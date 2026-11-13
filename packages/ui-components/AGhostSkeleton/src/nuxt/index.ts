import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-ghost-skeleton/nuxt` — registers the components for Nuxt
 * auto-import and adds the stylesheet to the app.
 *
 *   modules: ['@alikhalilll/a-ghost-skeleton/nuxt'],
 *   aGhostSkeleton: { prefix: 'A', styles: true },
 *
 * Components registered natively:
 *   <AGhostSkeleton>           measured skeleton wrapper
 *   <AGhostSkeletonBox>        one shimmering bar
 *   <AGhostSkeletonSuspense>   Suspense boundary with a measured fallback
 *   <AGhostSkeletonProvider>   theme / nonce / reveal defaults
 *
 * The stylesheet is added to `nuxt.options.css` by default. It is also
 * injected at runtime, but shipping it in the page is what lets a
 * server-rendered skeleton be hidden before the first paint.
 */

export interface ModuleOptions {
  /** Optional prefix prepended to the registered component name. */
  prefix?: string;
  /** Add `@alikhalilll/a-ghost-skeleton/styles.css` to the Nuxt css array. Default `true`. */
  styles?: boolean;
}

const COMPONENTS: Record<string, string> = {
  AGhostSkeleton: '@alikhalilll/a-ghost-skeleton',
  AGhostSkeletonBox: '@alikhalilll/a-ghost-skeleton',
  AGhostSkeletonSuspense: '@alikhalilll/a-ghost-skeleton',
  AGhostSkeletonProvider: '@alikhalilll/a-ghost-skeleton',
};

const STYLES = '@alikhalilll/a-ghost-skeleton/styles.css';

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/a-ghost-skeleton',
    configKey: 'aGhostSkeleton',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: { prefix: '', styles: true },
  setup(opts, nuxt) {
    const prefix = opts.prefix ?? '';
    for (const [exportName, from] of Object.entries(COMPONENTS)) {
      const baseName = exportName.startsWith('A') ? exportName.slice(1) : exportName;
      const registeredName = `${prefix}${prefix ? baseName : exportName}`;
      addComponent({ name: registeredName, export: exportName, filePath: from });
    }

    if (opts.styles !== false && !nuxt.options.css.includes(STYLES)) {
      nuxt.options.css.push(STYLES);
    }
  },
});

export default module;
