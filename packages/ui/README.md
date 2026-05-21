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

Peer dependency: `vue ^3.5.0`. Bundled deps: `reka-ui`, `vaul-vue`, `libphonenumber-js`, `lucide-vue-next`, `@vueuse/core`, `class-variance-authority`, `clsx`, `tailwind-merge`.

### Subpath imports (recommended)

```ts
// Only the tell-input chunk ships into the bundle.
import { ATellInput } from '@alikhalilll/ui/tell-input';

// Main entry — bundlers still tree-shake unused exports via `sideEffects`.
import { ATellInput, APopover } from '@alikhalilll/ui';
```

Available subpaths: `/tell-input`, `/input`, `/popover`, `/drawer`, `/responsive-popover`, `/utils`.

## Setup

Components style themselves with Tailwind utility classes (`bg-popover`, `text-muted-foreground`, …) resolving to CSS variables shipped at `@alikhalilll/ui/styles.css`. Three steps:

### 1. Import the tokens

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

Every variable is prefixed `--ak-ui-` — guaranteed not to collide with your own CSS.

### 2. Map to Tailwind v4

```css
@import 'tailwindcss';
@import '@alikhalilll/ui/styles.css';
@source '../node_modules/@alikhalilll/ui/dist/index.mjs';

@theme inline {
  --color-background: hsl(var(--ak-ui-background));
  --color-foreground: hsl(var(--ak-ui-foreground));
  --color-popover: hsl(var(--ak-ui-popover));
  --color-popover-foreground: hsl(var(--ak-ui-popover-foreground));
  --color-muted: hsl(var(--ak-ui-muted));
  --color-muted-foreground: hsl(var(--ak-ui-muted-foreground));
  --color-accent: hsl(var(--ak-ui-accent));
  --color-accent-foreground: hsl(var(--ak-ui-accent-foreground));
  --color-destructive: hsl(var(--ak-ui-destructive));
  --color-destructive-foreground: hsl(var(--ak-ui-destructive-foreground));
  --color-border: hsl(var(--ak-ui-border));
  --color-input: hsl(var(--ak-ui-input));
  --color-ring: hsl(var(--ak-ui-ring));
}
```

`@source` tells Tailwind v4 to scan the lib's compiled templates — it skips `node_modules` by default. Inside a pnpm workspace, point at the source so HMR works:

```css
@source '../../packages/ui/index.ts';
@source '../../packages/ui/entries/**/*.{vue,ts}';
@source '../../packages/ui/utils/**/*.ts';
```

### 3. Dark mode

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

The picker stays hidden until the user types or pastes something that matches a known dial code, then slides in pre-filled and `phone` is normalised to the national significant number (`01066105963` → `1066105963`, `+447911123456` → `7911123456`).

Full props, slots, theming recipes, and live demos → [tell-input docs](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/tell-input) or [./entries/tell-input/README.md](./entries/tell-input/README.md).

## Nuxt integration

`@alikhalilll/ui` is a plain Vue 3 library — works in Nuxt 3 / 4 without a module wrapper. Full guide (auto-imports, SSR behaviour, source globs) on the [docs site](https://alikhalilll.github.io/ali-nuxt-toolkit/ui#nuxt-integration).

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

```ts
import type {
  ATellInputProps,
  ATellInputSize,
  ATellInputVariants,
  CountryOption,
  PhoneValidationResult,
  PhoneValidationReason,
  PhoneRequiredInfo,
  DetectionStrategy,
  DetectCountryOptions,
  UseCountryDetectionReturn,
  UsePhoneValidationReturn,
  FlagUrlBuilder,
  Size,
} from '@alikhalilll/ui';
```

## Notes

- **Country detection** runs only in `onMounted` — the input renders immediately with `defaultCountry` (or empty); the detected ISO2 patches in on hydration.
- The default tel-input behaviour is **picker hidden until detected** (`detect-from-input`). Pass `:detect-from-input="false"` to opt out, or `default-country="20"` / `default-country="EG"` to pre-fill the picker at mount.
- Import `@alikhalilll/ui/styles.css` **before** your overrides so your overrides win the cascade.

## License

MIT © alikhalilll
