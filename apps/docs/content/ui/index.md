---
title: ui
description: Headless, shadcn-vue style component library. Built on reka-ui and vaul-vue, fully typed, themed via CSS variables, tree-shakable per subpath.
package: '@alikhalilll/ui'
order: 4
---

# @alikhalilll/ui

A headless, [shadcn-vue](https://www.shadcn-vue.com/) style component library for Vue 3 + Nuxt 3/4. Built on [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue). Fully typed, themed via CSS variables, **tree-shakable per component** through subpath imports.

## Components

| Component                                      | Subpath                              | Summary                                                                                          |
| ---------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`ATellInput`](/ui/tell-input)                 | `@alikhalilll/ui/tell-input`         | Phone input with auto country detection, libphonenumber validation, and a popover/drawer picker. |
| [`AInput`](/ui/input)                          | `@alikhalilll/ui/input`              | Sized, themed text input with `prefix` / `suffix` slots.                                         |
| [`APopover`](/ui/popover)                      | `@alikhalilll/ui/popover`            | Themed reka-ui popover — modal by default, optional overlay.                                     |
| [`ADrawer`](/ui/drawer)                        | `@alikhalilll/ui/drawer`             | Bottom-sheet drawer (vaul-vue + reka-ui), drag-to-dismiss.                                       |
| [`AResponsivePopover`](/ui/responsive-popover) | `@alikhalilll/ui/responsive-popover` | Popover on desktop, drawer on mobile. Single API.                                                |

## Install

```bash
pnpm add @alikhalilll/ui
```

Peer dependency: `vue ^3.5.0`. The library bundles `reka-ui`, `vaul-vue`, `libphonenumber-js`, `lucide-vue-next`, `@vueuse/core`, `class-variance-authority`, `clsx`, and `tailwind-merge`. Works in any Vue 3 app — Nuxt is optional.

### Subpath imports (recommended)

Each component lives behind its own subpath so consumers pay only for what they import:

```ts
import { ATellInput } from '@alikhalilll/ui/tell-input'; // tree-shaken
import { APopover } from '@alikhalilll/ui/popover';

// Or the main entry — bundlers still tree-shake unused exports.
import { ATellInput, APopover } from '@alikhalilll/ui';
```

Each component also ships its own README at `node_modules/@alikhalilll/ui/entries/<name>/README.md`.

## Setup

Components style themselves with Tailwind utility classes (`bg-popover`, `text-muted-foreground`, …) that resolve to CSS variables. Three steps:

### 1. Import the tokens

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@alikhalilll/ui/styles.css', '~/assets/main.css'],
});
```

Every variable is prefixed `--ak-ui-` — guaranteed not to collide with your CSS.

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

The `@source` directive tells Tailwind v4 to scan the library's compiled templates (it skips `node_modules` by default). Inside a pnpm workspace, point at the source instead so HMR works:

```css
@source '../../packages/ui/**/*.{vue,ts}';
```

### 3. Dark mode

The lib ships both `.light` and `.dark` blocks. Toggle the class on `<html>` — portaled popovers/drawers inherit via the cascade.

```ts
// nuxt.config.ts — locked dark
export default defineNuxtConfig({
  app: { head: { htmlAttrs: { class: 'dark' } } },
});
```

For Light / Dark / System, see `apps/docs/composables/useColorMode.ts` in this repo.

## Nuxt integration

`@alikhalilll/ui` is a plain Vue 3 library — it works in Nuxt 3 and 4 without a module wrapper. The docs site you're reading right now is a Nuxt app importing components directly from this package.

### Minimal config

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@alikhalilll/ui/styles.css'],
  app: { head: { htmlAttrs: { class: 'dark' } } }, // or .light
});
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui/tell-input';

const phone = ref('');
const country = ref<number | null>(null);
</script>

<template>
  <ATellInput v-model:phone="phone" v-model:country="country" show-validation />
</template>
```

### Auto-imports (optional)

To skip the explicit `import` in every component, register the library as a global component source:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  components: [{ path: '@alikhalilll/ui', pathPrefix: false, global: true }],
});
```

`<ATellInput />`, `<APopover />`, etc. become available in templates without any import. Subpath imports still tree-shake better when you opt out of this and import per component.

### SSR behaviour

- **Country detection** runs only in `onMounted` — the input renders immediately with `defaultCountry` (or empty if you don't set one). The IP/timezone/locale resolution patches in on hydration; there's no SSR network call.
- **Responsive popover** uses `useMediaQuery('(min-width: 768px)')`, which returns `false` during SSR. The first server-rendered paint is the drawer branch; the client may swap to the popover branch on hydration. Both branches are pre-imported (no lazy chunks) so hydration always finds the right tree, and the closed drawer is collapsed so the swap is invisible.
- **Tailwind v4 source globs** — when you import the package from `node_modules`, point Tailwind at the dist:

  ```css
  @source '../node_modules/@alikhalilll/ui/dist/index.mjs';
  ```

  Inside this monorepo (or any workspace setup) point at the source so HMR works:

  ```css
  @source '../../packages/ui/index.ts';
  @source '../../packages/ui/entries/**/*.{vue,ts}';
  @source '../../packages/ui/utils/**/*.ts';
  ```

### Per-subpath imports inside Nuxt

Subpath imports (`@alikhalilll/ui/tell-input`, `@alikhalilll/ui/popover`, …) work identically inside Nuxt. They give the smallest client bundle — only the chunks you actually import ship to the browser.

```ts
import { ATellInput } from '@alikhalilll/ui/tell-input';
import { APopover, APopoverContent, APopoverTrigger } from '@alikhalilll/ui/popover';
```

The trade-off vs. auto-imports: subpath imports are explicit (easier to grep, easier to tree-shake). Auto-imports are terser at the cost of pulling the main entry. Pick one per project.

## Theming

Override any `--ak-ui-*` variable globally, scoped to a wrapper, or inline. Portaled content inherits.

```css
/* Per-tenant theme */
.tenant-acme {
  --ak-ui-popover: 220 70% 8%;
  --ak-ui-accent: 220 50% 30%;
  --ak-ui-ring: 220 100% 65%;
}
```

```vue
<div class="tenant-acme">
  <ATellInput v-model:phone="phone" v-model:country="country" />
</div>
```

Values are HSL **triplets** — no `hsl(…)` wrapper — because the Tailwind tokens compose them via `hsl(var(--ak-ui-…))`.

| Variable                              | Used for                                          |
| ------------------------------------- | ------------------------------------------------- |
| `--ak-ui-background` / `*-foreground` | Page background + text                            |
| `--ak-ui-popover` / `*-foreground`    | Popover surfaces + their text                     |
| `--ak-ui-muted` / `*-foreground`      | Hint text, search bar bg, country trigger bg      |
| `--ak-ui-accent` / `*-foreground`     | List hover + selected row                         |
| `--ak-ui-destructive`                 | Error ring + warning icon                         |
| `--ak-ui-border` / `--ak-ui-input`    | Outer border + inner dividers                     |
| `--ak-ui-ring`                        | Focus ring (the visual "brand")                   |
| `--ak-ui-radius`                      | Border radius (no Tailwind token — used directly) |

Live theming recipes (brand-only, day/night, multi-tenant, server-driven, state-specific) live on the [`ATellInput`](/ui/tell-input#theming) page.

## Size scale

Every interactive component shares one scale:

| Token | Height              | Tailwind   |
| ----- | ------------------- | ---------- |
| `xs`  | 28 px               | `h-7`      |
| `sm`  | 36 px               | `h-9`      |
| `md`  | **43 px (default)** | `h-[43px]` |
| `lg`  | 52 px               | `h-[52px]` |
| `xl`  | 60 px               | `h-[60px]` |

The maps are exported for building size-aware components:

```ts
import { SIZES, controlHeight, controlPaddingX, controlTextSize, type Size } from '@alikhalilll/ui';
```

## Public API

**Components** — `ATellInput`, `ACountrySelect`, `ACountryFlag`, `AInput`, `APopover` + `Trigger` + `Content`, `ADrawer` + `Trigger` + `Content` + `Overlay`, `AResponsivePopover` + `Trigger` + `Content`.

**Composables** — `usePhoneValidation`, `useCountryDetection`, imperative `detectCountry`.

**Helpers** — `cn`, `SIZES`, `DEFAULT_SIZE`, `controlHeight`, `controlPaddingX`, `controlTextSize`, `controlHeightPx`, `aTellInputVariants`, `DEFAULT_ERROR_MESSAGES`, `defaultFlagUrl`.

**Types** — `ATellInputProps`, `Size`, `CountryOption`, `PhoneValidationResult`, `PhoneValidationReason`, `PhoneRequiredInfo`, `DetectionStrategy`, `DetectCountryOptions`, `FlagUrlBuilder`.

## Notes

- Country detection runs in `onMounted` (client-only) — the input renders immediately with `defaultCountry`; the detected ISO2 patches in on hydration.
- Import `@alikhalilll/ui/styles.css` **before** your own overrides so your overrides win the cascade.

## License

MIT © alikhalilll
