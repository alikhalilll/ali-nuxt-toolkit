import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/a-skeleton/nuxt` — registers the skeleton components for Nuxt
 * auto-import. The auto-imported names are the package's native names:
 *
 *   <ASkeleton :loading>…</ASkeleton>     <!-- slot wrapper, two-layer flow -->
 *   <ASkeletonLayer :shape="…" />          <!-- replay a CachedShape directly -->
 *   <ASkeletonBlock type="circle" w="64" h="64" />  <!-- hand-crafted skeleton primitive -->
 *
 *   modules: ['@alikhalilll/a-skeleton/nuxt'],
 *   aSkeleton: { prefix: 'A' },   // optional
 *
 * Styles are not auto-injected; add `'@alikhalilll/a-skeleton/styles.css'` to
 * your Nuxt `css` array.
 */

export interface ModuleOptions {
  /** Optional prefix prepended to the registered component name. */
  prefix?: string;
}

const COMPONENTS: Record<string, string> = {
  ASkeleton: '@alikhalilll/a-skeleton',
  ASkeletonLayer: '@alikhalilll/a-skeleton',
  ASkeletonBlock: '@alikhalilll/a-skeleton',
  /* Variant primitives */
  ASkeletonText: '@alikhalilll/a-skeleton',
  ASkeletonHeading: '@alikhalilll/a-skeleton',
  ASkeletonAvatar: '@alikhalilll/a-skeleton',
  ASkeletonImage: '@alikhalilll/a-skeleton',
  ASkeletonVideo: '@alikhalilll/a-skeleton',
  ASkeletonButton: '@alikhalilll/a-skeleton',
  ASkeletonInput: '@alikhalilll/a-skeleton',
  ASkeletonListItem: '@alikhalilll/a-skeleton',
  ASkeletonCard: '@alikhalilll/a-skeleton',
  ASkeletonTable: '@alikhalilll/a-skeleton',
  ASkeletonChart: '@alikhalilll/a-skeleton',
  ASkeletonForm: '@alikhalilll/a-skeleton',
  ASkeletonArticle: '@alikhalilll/a-skeleton',
  ASkeletonDivider: '@alikhalilll/a-skeleton',
  ASkeletonChip: '@alikhalilll/a-skeleton',
};

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/a-skeleton',
    configKey: 'aSkeleton',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: { prefix: '' },
  setup(opts) {
    const prefix = opts.prefix ?? '';
    for (const [exportName, from] of Object.entries(COMPONENTS)) {
      const baseName = exportName.startsWith('A') ? exportName.slice(1) : exportName;
      const registeredName = `${prefix}${prefix ? baseName : exportName}`;
      addComponent({ name: registeredName, export: exportName, filePath: from });
    }
  },
});

export default module;
