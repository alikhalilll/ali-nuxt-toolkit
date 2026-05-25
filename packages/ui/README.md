# @alikhalilll/ui

[![npm](https://img.shields.io/npm/v/@alikhalilll/ui.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/ui)
[![downloads](https://img.shields.io/npm/dm/@alikhalilll/ui.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/ui)
[![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/ui?label=minzip&color=444)](https://bundlephobia.com/package/@alikhalilll/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-444.svg)](./LICENSE)

Headless, shadcn-vue style Vue 3 component library — every component lives behind its own subpath import so consumers only ship the components they actually use. Built on [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue), themed via prefixed CSS variables, fully typed.

📚 **Live docs:** <https://alikhalilll.github.io/ali-nuxt-toolkit/ui>
📦 **npm:** <https://www.npmjs.com/package/@alikhalilll/ui>
🐙 **Source:** <https://github.com/alikhalilll/ali-nuxt-toolkit/tree/master/packages/ui>

---

## Components

| Component            | Subpath                              | Per-component README                                                             | Live docs                                                                                      |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ATellInput`         | `@alikhalilll/ui/tell-input`         | [./entries/tell-input/README.md](./entries/tell-input/README.md)                 | [/ui/tell-input](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/tell-input)                 |
| `AInput`             | `@alikhalilll/ui/input`              | [./entries/input/README.md](./entries/input/README.md)                           | [/ui/input](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/input)                           |
| `APopover`           | `@alikhalilll/ui/popover`            | [./entries/popover/README.md](./entries/popover/README.md)                       | [/ui/popover](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/popover)                       |
| `ADrawer`            | `@alikhalilll/ui/drawer`             | [./entries/drawer/README.md](./entries/drawer/README.md)                         | [/ui/drawer](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/drawer)                         |
| `AResponsivePopover` | `@alikhalilll/ui/responsive-popover` | [./entries/responsive-popover/README.md](./entries/responsive-popover/README.md) | [/ui/responsive-popover](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/responsive-popover) |

Each README ships inside the npm tarball at `node_modules/@alikhalilll/ui/entries/<name>/README.md` and is rendered on the file browser at <https://www.npmjs.com/package/@alikhalilll/ui?activeTab=code>.

## Install

```bash
pnpm add @alikhalilll/ui
```

Then import the stylesheet **once** in your app entry. That's it — no Tailwind config, no `@theme` block, no `@source` directives. The shipped CSS is fully self-contained: design tokens + every utility class the components use are pre-compiled into a single ~21 KB vanilla CSS file.

**Nuxt 3 / 4:**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@alikhalilll/ui/styles.css'],
});
```

**Vue + Vite (no Nuxt):**

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import '@alikhalilll/ui/styles.css';

createApp(App).mount('#app');
```

Peer dependency: `vue ^3.5.0`. Bundled deps: `reka-ui`, `vaul-vue`, `libphonenumber-js`, `lucide-vue-next`, `@vueuse/core`, `class-variance-authority`, `clsx`, `tailwind-merge`. **No CSS framework required** at the consumer end: the lib's stylesheet only declares its own classes (no preflight reset), so it coexists with Tailwind v4, UnoCSS, vanilla CSS, or nothing at all.

### UnoCSS

Same import — no preset to install, no `--ak-ui-*` mapping to wire up. The components' classes are baked into the shipped stylesheet; UnoCSS keeps handling whatever utilities _your_ templates use.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@unocss/nuxt'],
  css: ['@alikhalilll/ui/styles.css'],
});
```

**If you write `bg-popover` / `text-muted-foreground` / etc. yourself**, UnoCSS will try to generate those too — point them at the same tokens so the two outputs match:

```ts
// uno.config.ts
import { defineConfig, presetWind4 } from 'unocss';

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      background: 'hsl(var(--ak-ui-background))',
      foreground: 'hsl(var(--ak-ui-foreground))',
      popover: 'hsl(var(--ak-ui-popover))',
      'popover-foreground': 'hsl(var(--ak-ui-popover-foreground))',
      muted: 'hsl(var(--ak-ui-muted))',
      'muted-foreground': 'hsl(var(--ak-ui-muted-foreground))',
      accent: 'hsl(var(--ak-ui-accent))',
      'accent-foreground': 'hsl(var(--ak-ui-accent-foreground))',
      destructive: 'hsl(var(--ak-ui-destructive))',
      border: 'hsl(var(--ak-ui-border))',
      input: 'hsl(var(--ak-ui-input))',
      ring: 'hsl(var(--ak-ui-ring))',
    },
  },
});
```

Whatever reset UnoCSS injects (`@unocss/reset/tailwind.css`, etc.) wins on root elements — the lib ships no preflight, so the two don't fight.

### Workspaces / monorepos

If you consume this in a pnpm/yarn workspace **and** use Tailwind v4 in the app, Vite can double-emit the symlinked CSS file (once via `@alikhalilll/ui/styles.css`, once via the resolved filesystem path). The second copy lands after your app CSS in the cascade and the lib's `.hidden { display: none }` ends up clobbering your `md:flex` / `md:block` responsive rules — desktop navs and sidebars silently disappear. The dedupe-friendly form is to `@import` the lib stylesheet from inside your own app CSS, instead of listing it in `nuxt.config.css`:

```css
/* assets/app.css */
@import '@alikhalilll/ui/styles.css';
@import 'tailwindcss';
/* …your own rules… */
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/app.css'], // <-- only your CSS; no separate lib import
});
```

Vite inlines a single copy; the cascade stays sane. Outside a workspace setup this is unnecessary.

### Subpath imports

```ts
// Only the tell-input chunk ships into the bundle.
import { ATellInput } from '@alikhalilll/ui/tell-input';

// Main entry — bundlers still tree-shake unused exports via `sideEffects`.
import { ATellInput, APopover } from '@alikhalilll/ui';
```

Available subpaths: `/tell-input`, `/input`, `/popover`, `/drawer`, `/responsive-popover`, `/utils`, `/nuxt` (Nuxt module), `/resolver` (unplugin-vue-components resolver).

### Dark mode

The lib ships both `.light` and `.dark` blocks. Toggle the class on `<html>` — portaled popovers and drawers inherit via the cascade.

**Nuxt 3 / 4 — locked dark:**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: { head: { htmlAttrs: { class: 'dark' } } },
});
```

**Vue + Vite — locked dark:**

```html
<!-- index.html -->
<html class="dark">
  ...
</html>
```

For Light / Dark / System (persisted, OS-aware, no flash of wrong theme), see [`apps/docs/composables/useColorMode.ts`](https://github.com/alikhalilll/ali-nuxt-toolkit/blob/master/apps/docs/composables/useColorMode.ts) — the pattern is framework-agnostic.

## Quick start

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui/tell-input';

const phone = ref('');
const country = ref<number | null>(null); // dial number, e.g. 20 for Egypt
</script>

<template>
  <ATellInput v-model:phone="phone" v-model:country="country" show-validation />
</template>
```

The picker stays hidden until the user types or pastes something that matches a known dial code, then a flag-only trigger reveals at the end of the field with the dial code as an inline prefix, and `phone` is normalised to the national significant number (`01066105963` → `1066105963`, `+447911123456` → `7911123456`). RTL-aware, localisable via `locale` / `messages`, and accepts alternative numerals.

Full props, slots, theming recipes, and live demos → [tell-input docs](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/tell-input) or [./entries/tell-input/README.md](./entries/tell-input/README.md).

## Nuxt integration

Two paths — pick one:

**1. Plain dependency.** `@alikhalilll/ui` is a plain Vue 3 library — works in Nuxt 3 / 4 with explicit imports.

**2. Auto-import via the bundled Nuxt module.** Register the module and every component the toolkit ships is auto-imported in templates (`<ATellInput>` with no `import` statement):

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/ui/nuxt'],
  css: ['@alikhalilll/ui/styles.css'],
  alikhalilllUi: { prefix: '' }, // optional; default is no prefix
});
```

Nuxt code-splits per-subpath, so a page that only uses `<ATellInput>` still doesn't pull in Drawer/Popover code.

For non-Nuxt Vite consumers, there's an [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components) resolver:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import AlikhalilllUiResolver from '@alikhalilll/ui/resolver';

export default { plugins: [Components({ resolvers: [AlikhalilllUiResolver()] })] };
```

Full guide (SSR behaviour, source globs) on the [docs site](https://alikhalilll.github.io/ali-nuxt-toolkit/ui#nuxt-integration).

```ts
// nuxt.config.ts — optional auto-import
export default defineNuxtConfig({
  components: [{ path: '@alikhalilll/ui', pathPrefix: false, global: true }],
});
```

## Theming

Override any `--ak-ui-*` variable globally, per wrapper, or inline:

```css
.tenant-acme {
  --ak-ui-popover: 220 70% 8%;
  --ak-ui-accent: 220 50% 30%;
  --ak-ui-ring: 220 100% 65%;
}
```

Values are HSL **triplets** — no `hsl(…)` wrapper. Full token list + recipes (brand-only, day/night, multi-tenant, server-driven, state-specific) → [theming guide](https://alikhalilll.github.io/ali-nuxt-toolkit/ui#theming).

## Size scale

| Token | Height              | Tailwind   |
| ----- | ------------------- | ---------- |
| `xs`  | 28 px               | `h-7`      |
| `sm`  | 36 px               | `h-9`      |
| `md`  | **43 px (default)** | `h-[43px]` |
| `lg`  | 52 px               | `h-[52px]` |
| `xl`  | 60 px               | `h-[60px]` |

`controlHeight`, `controlPaddingX`, `controlTextSize`, `controlHeightPx`, `SIZES`, `DEFAULT_SIZE`, and the `Size` type are exported so you can build size-aware components in lockstep with the library.

## Compose your own variant

Every primitive, composable, and helper is re-exported — fork-free composition:

```ts
import {
  // Composables
  usePhoneValidation,
  useCountryDetection,
  detectCountry,

  // Primitives
  AInput,
  APopover,
  APopoverTrigger,
  APopoverContent,
  ADrawer,
  ADrawerTrigger,
  ADrawerContent,
  ADrawerOverlay,
  AResponsivePopover,
  AResponsivePopoverTrigger,
  AResponsivePopoverContent,

  // ATellInput pieces
  ATellInput,
  ACountrySelect,
  ACountryFlag,
  aTellInputVariants,
  DEFAULT_ERROR_MESSAGES,
  defaultFlagUrl,

  // Helpers
  cn,
} from '@alikhalilll/ui';
```

## Exported types

Every component exposes named `*Props` / `*Slots` / `*Emits` interfaces from its subpath. Use them in your own template type inference, refs, or to wrap a component:

```ts
import type {
  // ATellInput
  ATellInputProps,
  ATellInputSlots,
  ATellInputEmits,
  ATellInputSize,
  // ACountrySelect
  ACountrySelectProps,
  ACountrySelectSlots,
  ACountrySelectEmits,
  // shared
  CountryOption,
  PhoneValidationResult,
  PhoneValidationReason,
  PhoneRequiredInfo,
  DetectionStrategy,
} from '@alikhalilll/ui/tell-input';

import type { AInputProps, AInputSlots, AInputEmits } from '@alikhalilll/ui/input';
import type { APopoverProps, APopoverContentProps } from '@alikhalilll/ui/popover';
import type { ADrawerProps, ADrawerContentProps } from '@alikhalilll/ui/drawer';
import type { AResponsivePopoverProps, ScrollLockMode } from '@alikhalilll/ui/responsive-popover';
import type { Size, FlagUrlBuilder } from '@alikhalilll/ui';
```

Slot-prop type inference example (useful when overriding a slot):

```vue
<script setup lang="ts">
import type { ATellInputSlots } from '@alikhalilll/ui/tell-input';
type SuffixProps = Parameters<NonNullable<ATellInputSlots['suffix']>>[0];
//   ↑ { validationState: 'idle' | 'valid' | 'error'; validation: PhoneValidationResult }
</script>
```

## Notes

- **Country detection** runs only in `onMounted` — the input renders immediately with `defaultCountry` (or empty); the detected ISO2 patches in on hydration.
- The default tel-input behaviour is **picker hidden until detected** (`detect-from-input`). Pass `:detect-from-input="false"` to opt out, or `default-country="20"` / `default-country="EG"` to pre-fill the picker at mount.
- Import `@alikhalilll/ui/styles.css` **before** your overrides so your overrides win the cascade.

## License

MIT © alikhalilll
