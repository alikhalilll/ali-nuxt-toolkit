import { defineNuxtModule, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

/**
 * `@alikhalilll/ui/nuxt` — registers every component shipped by the toolkit
 * with Nuxt's auto-import so consumers don't need to write `import { ... }`
 * statements in `<script setup>`.
 *
 * Each component is registered with a `filePath` pointing at the package's
 * subpath export (e.g. `@alikhalilll/ui/tell-input`) — Nuxt then code-splits
 * per-subpath, so a page that only uses `<ATellInput>` doesn't pull in
 * Drawer/Popover code.
 *
 * Usage in `nuxt.config.ts`:
 *   modules: ['@alikhalilll/ui/nuxt'],
 *   alikhalilllUi: { prefix: 'A' },   // optional; default is no prefix
 *
 * To opt out of styles, omit `css: ['@alikhalilll/ui/styles.css']` from
 * the Nuxt config — the module does NOT auto-inject CSS, by design (lets
 * consumers control style ordering).
 */

export interface ModuleOptions {
  /**
   * Optional prefix prepended to every registered component name. Pass
   * `'A'` to keep the default `<ATellInput>` naming; pass `''` to register
   * as `<TellInput>` etc.
   */
  prefix?: string;
}

// Component → subpath registry. Keep in sync with `tsdown.config.ts` entries
// and `package.json` exports map.
const COMPONENTS: Record<string, string> = {
  // tell-input
  ATellInput: 'tell-input',
  ACountrySelect: 'tell-input',
  ACountryFlag: 'tell-input',
  // input
  AInput: 'input',
  // popover
  APopover: 'popover',
  APopoverContent: 'popover',
  APopoverTrigger: 'popover',
  APopoverOverlay: 'popover',
  // drawer
  ADrawer: 'drawer',
  ADrawerContent: 'drawer',
  ADrawerTrigger: 'drawer',
  ADrawerOverlay: 'drawer',
  // responsive-popover
  AResponsivePopover: 'responsive-popover',
  AResponsivePopoverContent: 'responsive-popover',
  AResponsivePopoverTrigger: 'responsive-popover',
};

// Explicit annotation: without it TS2742 — `defineNuxtModule`'s inferred return
// type names symbols from `@nuxt/schema` via its transitive types, and `vue-tsc`
// refuses to emit a portable declaration when the inferred name isn't directly
// importable. The local re-import resolves to the same shape `@nuxt/kit` ships.
const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@alikhalilll/ui',
    configKey: 'alikhalilllUi',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: { prefix: '' },
  setup(opts) {
    const prefix = opts.prefix ?? '';
    for (const [exportName, subpath] of Object.entries(COMPONENTS)) {
      const baseName = exportName.startsWith('A') ? exportName.slice(1) : exportName;
      const registeredName = `${prefix}${prefix ? baseName : exportName}`;
      addComponent({
        name: registeredName,
        export: exportName,
        filePath: `@alikhalilll/ui/${subpath}`,
      });
    }
  },
});

export default module;
