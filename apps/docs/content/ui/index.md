---
title: ui
description: Headless, shadcn-vue style component library. Built on reka-ui and vaul-vue, fully typed, themed via CSS variables, tree-shakable per component.
package: '@alikhalilll/a-*'
order: 4
---

# @alikhalilll/a-\*

A headless, [shadcn-vue](https://www.shadcn-vue.com/) style component library for Vue 3 + Nuxt 3/4. Built on [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue). Fully typed, themed via CSS variables, **tree-shakable per component** through separate packages.

## Components

| Component                                      | Subpath                             | Summary                                                                                          |
| ---------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`ATelInput`](/ui/tell-input)                  | `@alikhalilll/a-tel-input`          | Phone input with auto country detection, libphonenumber validation, and a popover/drawer picker. |
| [`AInput`](/ui/input)                          | `@alikhalilll/a-input`              | Sized, themed text input with `prefix` / `suffix` slots.                                         |
| [`APopover`](/ui/popover)                      | `@alikhalilll/a-popover`            | Themed reka-ui popover — modal by default, optional overlay.                                     |
| [`ADrawer`](/ui/drawer)                        | `@alikhalilll/a-drawer`             | Bottom-sheet drawer (vaul-vue + reka-ui), drag-to-dismiss.                                       |
| [`AResponsivePopover`](/ui/responsive-popover) | `@alikhalilll/a-responsive-popover` | Popover on desktop, drawer on mobile. Single API.                                                |

## Install

```bash
pnpm add @alikhalilll/a-*
```

Then import the stylesheet **once** in your app entry — no Tailwind config, no `@theme` block, no `@source` directives. The shipped CSS is fully self-contained: design tokens + every utility class the components actually use are pre-compiled into a single vanilla CSS file (~21 KB minified).

### Nuxt 3 / 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@alikhalilll/a-ui-base/tokens.css'],
});
```

### Vue + Vite (no Nuxt)

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import '@alikhalilll/a-ui-base/tokens.css';

createApp(App).mount('#app');
```

That's it — your components render styled out of the box.

Peer dependency: `vue ^3.5.0`. The library bundles `reka-ui`, `vaul-vue`, `libphonenumber-js`, `lucide-vue-next`, `@vueuse/core`, `class-variance-authority`, `clsx`, and `tailwind-merge`. Works in any Vue 3 app — Nuxt is optional. **No CSS framework required** at the consumer end: the stylesheet only declares its own utility classes, never a preflight reset, so it coexists with Tailwind v4, UnoCSS, vanilla CSS, or no CSS framework at all.

### UnoCSS

The shipped CSS already contains every utility class the components need, so there is **no UnoCSS preset to install and no `--ak-ui-*` mapping to wire up**. Drop the import in your `nuxt.config.css` (or `main.ts`) exactly like the Nuxt / Vite snippets above, and UnoCSS continues to handle every class _your_ templates write.

```ts
// nuxt.config.ts — UnoCSS + @alikhalilll/a-*
export default defineNuxtConfig({
  modules: ['@unocss/nuxt'],
  css: ['@alikhalilll/a-ui-base/tokens.css'],
});
```

**Class-name compatibility.** UnoCSS uses the same `bg-popover`, `text-muted-foreground`, `border-input` shorthand that this lib emits, so if you write those classes _yourself_ in your templates, UnoCSS will try to generate them too. Add `--ak-ui-*` to your UnoCSS theme so the consumer-side rules resolve to the same tokens the lib uses — this keeps the two outputs in lockstep:

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

If you don't write those class names yourself, you can skip this entirely — the lib's compiled CSS is enough.

**Preflight / reset.** The lib ships **no** preflight rules. Whatever reset UnoCSS injects (`@unocss/reset/tailwind.css`, `preflights: 'on-demand'`, etc.) wins on the root elements without fighting our components.

### Workspaces / monorepos

If you're a pnpm/yarn workspace consumer and you _also_ use Tailwind v4 in the app, Vite can double-emit the symlinked CSS file (once via `@alikhalilll/a-ui-base/tokens.css`, once via the resolved filesystem path), which puts the lib's `.hidden { display: none }` after your `md:flex` / `md:block` responsive rules in the cascade and silently hides nav bars and sidebars. Avoid it by `@import`ing the lib stylesheet from inside your own app CSS instead of listing it in `nuxt.config.css`:

```css
/* app.css */
@import '@alikhalilll/a-ui-base/tokens.css';
@import 'tailwindcss';
/* …your own rules… */
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/app.css'], // <-- only your CSS; no separate lib import
});
```

Vite inlines a single copy and the cascade stays sane. Outside a workspace setup this isn't necessary — both forms produce the same output.

### Subpath imports

Each component lives behind its own subpath so consumers pay only for what they import:

```ts
import { ATelInput } from '@alikhalilll/a-tel-input'; // tree-shaken
import { APopover } from '@alikhalilll/a-popover';

// Or the main entry — bundlers still tree-shake unused exports.
import { ATelInput } from '@alikhalilll/a-tel-input';
import { APopover } from '@alikhalilll/a-popover';
```

Available subpaths:

| Subpath                             | What it exports                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `@alikhalilll/a-tel-input`          | `ATelInput`, `ACountrySelect`, `ACountryFlag` + composables + types          |
| `@alikhalilll/a-input`              | `AInput` + types                                                             |
| `@alikhalilll/a-popover`            | `APopover` + `Trigger` / `Content` / `Overlay` + types (re-exported reka-ui) |
| `@alikhalilll/a-drawer`             | `ADrawer` + `Trigger` / `Content` / `Overlay` + types (re-exported vaul-vue) |
| `@alikhalilll/a-responsive-popover` | `AResponsivePopover` + `Trigger` / `Content` + types                         |
| `@alikhalilll/a-ui-base`            | `cn`, `SIZES`, `controlHeight`, `controlPaddingX`, `controlTextSize`         |
| `@alikhalilll/a-tel-input/nuxt`     | Nuxt module — register in `nuxt.config.ts` for auto-import                   |
| `@alikhalilll/a-tel-input/resolver` | `unplugin-vue-components` resolver factory for Vite consumers                |
| `@alikhalilll/a-ui-base/tokens.css` | Pre-compiled stylesheet (design tokens + utility classes)                    |

Each component also ships its own README at `node_modules/@alikhalilll/a-<name>/README.md`.

### Dark mode

The lib ships both `.light` and `.dark` blocks. Toggle the class on `<html>` — portaled popovers and drawers inherit via the cascade.

#### Nuxt 3 / 4 — locked dark

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: { head: { htmlAttrs: { class: 'dark' } } },
});
```

#### Vue + Vite — locked dark

```html
<!-- index.html -->
<html class="dark">
  ...
</html>
```

For Light / Dark / System (persisted, OS-aware, no flash of wrong theme), see `apps/docs/composables/useColorMode.ts` in the repo — the pattern is framework-agnostic; the same composable works under Vite once you drop the Nuxt-specific `useState` / `useHead` calls.

### Overriding tokens

Every variable is prefixed `--ak-ui-`. Override any of them globally on `:root`, scoped to a wrapper class, or inline — the components pick up the change at runtime via the CSS cascade.

```css
.tenant-acme {
  --ak-ui-popover: 220 70% 8%;
  --ak-ui-accent: 220 50% 30%;
  --ak-ui-ring: 220 100% 65%;
}
```

Values are HSL **triplets** — no `hsl(…)` wrapper. Full token list + recipes (brand-only, day/night, multi-tenant, server-driven, state-specific) in [the theming section](#theming).

## Nuxt integration

`@alikhalilll/a-*` is a plain Vue 3 library — it works in Nuxt 3 and 4 without a module wrapper. The docs site you're reading right now is a Nuxt app importing components directly from this package.

### Minimal config

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@alikhalilll/a-ui-base/tokens.css'],
  app: { head: { htmlAttrs: { class: 'dark' } } }, // or .light
});
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);
</script>

<template>
  <ATelInput v-model:phone="phone" v-model:country="country" show-validation />
</template>
```

### Auto-imports (the bundled Nuxt module)

`@alikhalilll/a-*` ships its own Nuxt module under the `/nuxt` subpath. Register it and every component is auto-imported, code-split per subpath:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-tel-input/nuxt'],
  css: ['@alikhalilll/a-ui-base/tokens.css'],
  alikhalilllUi: { prefix: '' }, // optional; default is no prefix
});
```

`<ATelInput />`, `<APopover />`, `<ADrawer />`, etc. are usable in any template with no `import` statement. The module registers each component with its **subpath** (e.g. `@alikhalilll/a-tel-input`) rather than the main entry, so Nuxt still code-splits per-subpath — a page that only uses `<ATelInput>` does not pull in Drawer/Popover code.

If you'd rather not use the module, the older `components.dirs`-style global registration still works:

```ts
// nuxt.config.ts (alternative, no module)
export default defineNuxtConfig({
  components: [{ path: '@alikhalilll/a-tel-input', pathPrefix: false, global: true }],
});
```

This pulls from the main entry — slightly worse code-splitting than the module path above.

#### Vite (non-Nuxt) auto-imports

For Vue + Vite consumers, the toolkit ships an [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components) resolver under the `/resolver` subpath:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import AlikhalilllUiResolver from '@alikhalilll/a-tel-input/resolver';

export default {
  plugins: [Components({ resolvers: [AlikhalilllUiResolver()] })],
};
```

`<ATelInput>` resolves automatically in any `.vue` template, with the same per-subpath code-splitting as the Nuxt module.

### SSR behaviour

- **Country detection** runs only in `onMounted` — the input renders immediately with `defaultCountry` (or empty if you don't set one). The IP/timezone/locale resolution patches in on hydration; there's no SSR network call.
- **Responsive popover** uses `useMediaQuery('(min-width: 768px)')`, which returns `false` during SSR. The first server-rendered paint is the drawer branch; the client may swap to the popover branch on hydration. Both branches are pre-imported (no lazy chunks) so hydration always finds the right tree, and the closed drawer is collapsed so the swap is invisible.
- **No Tailwind `@source` needed** — each component package ships a prebuilt `styles.css` (its utilities, resolved against the `--ak-ui-*` tokens). Import the shared tokens once plus each component's stylesheet (see [Setup](#setup)); you don't point Tailwind at the package source.

  ```css
  @import '@alikhalilll/a-ui-base/tokens.css';
  @import '@alikhalilll/a-tel-input/styles.css';
  ```

### Per-subpath imports inside Nuxt

Subpath imports (`@alikhalilll/a-tel-input`, `@alikhalilll/a-popover`, …) work identically inside Nuxt. They give the smallest client bundle — only the chunks you actually import ship to the browser.

```ts
import { ATelInput } from '@alikhalilll/a-tel-input';
import { APopover, APopoverContent, APopoverTrigger } from '@alikhalilll/a-popover';
```

The trade-off vs. auto-imports: subpath imports are explicit (easier to grep, easier to tree-shake). Auto-imports are terser at the cost of pulling the main entry. Pick one per project.

## Without Nuxt (Vue + Vite, etc.)

`@alikhalilll/a-*` is just a Vue 3 package — no Nuxt module, no build-time magic. Anywhere Vue 3 runs (Vite, Vue CLI, Astro Vue, Quasar, …), it works the same way: import the CSS variables once in your entry, import the components you use, render them.

```ts
// main.ts (Vite + Vue 3 example)
import { createApp } from 'vue';
import App from './App.vue';

import '@alikhalilll/a-ui-base/tokens.css';
import './assets/main.css'; // your own stylesheet that imports Tailwind + maps the tokens

createApp(App).mount('#app');
```

```vue
<!-- AnyComponent.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);
</script>

<template>
  <ATelInput v-model:phone="phone" v-model:country="country" show-validation />
</template>
```

Differences from the Nuxt path:

- **No auto-imports** — every component must be `import`ed (encouraged anyway, because subpath imports tree-shake better).
- **No `nuxt.config.ts`** — replace it with `vite.config.ts` and your `main.ts`. CSS goes into your main entry; dark mode goes onto the `<html>` element in `index.html` (or via a Vue composable that toggles the class on mount).
- **No SSR concerns** unless you opt in (e.g. via Vite SSR or another framework). For pure SPAs, the country detection still fires `onMounted` exactly the same; the responsive popover stays consistent because the first render runs in the browser.

The Tailwind v4 mapping (`@import 'tailwindcss';` + `@theme inline { … }` + `@source` directives) is identical to the Nuxt setup — see the [Setup](#setup) section above.

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
  <ATelInput v-model:phone="phone" v-model:country="country" />
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

Live theming recipes (brand-only, day/night, multi-tenant, server-driven, state-specific) live on the [`ATelInput`](/ui/tell-input#theming) page.

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
import {
  SIZES,
  controlHeight,
  controlPaddingX,
  controlTextSize,
  type Size,
} from '@alikhalilll/a-ui-base';
```

## Public API

**Components** — `ATelInput`, `ACountrySelect`, `ACountryFlag`, `AInput`, `APopover` + `Trigger` + `Content` + `Overlay`, `ADrawer` + `Trigger` + `Content` + `Overlay`, `AResponsivePopover` + `Trigger` + `Content`.

**Composables** — `usePhoneValidation`, `useCountryDetection`, imperative `detectCountry`, `useTelInputValidation`, `useTypingPhase`, `useCountryMatching`, `useEventScrollLock`.

**Helpers** — `cn`, `SIZES`, `DEFAULT_SIZE`, `controlHeight`, `controlPaddingX`, `controlTextSize`, `aTelInputVariants`, `DEFAULT_ERROR_MESSAGES`, `defaultFlagUrl`, `normalizeDigits`.

**Per-component prop / slot / emit interfaces** — every entry exposes its `*Props`, `*Slots`, and `*Emits` interfaces as named type exports. Useful when wrapping a component, typing slot props, or referencing the emit map:

```ts
// from /tell-input
import type { ATelInputProps, ATelInputSlots, ATelInputEmits } from '@alikhalilll/a-tel-input';
import type {
  ACountrySelectProps,
  ACountrySelectSlots,
  ACountrySelectEmits,
} from '@alikhalilll/a-tel-input';

// from /input
import type { AInputProps, AInputSlots, AInputEmits } from '@alikhalilll/a-input';

// from /popover (re-exported from reka-ui)
import type {
  APopoverProps,
  APopoverEmits,
  APopoverContentProps,
  APopoverContentEmits,
  APopoverTriggerProps,
} from '@alikhalilll/a-popover';

// from /drawer (re-exported from vaul-vue + reka-ui)
import type {
  ADrawerProps,
  ADrawerEmits,
  ADrawerContentProps,
  ADrawerContentEmits,
} from '@alikhalilll/a-drawer';

// from /responsive-popover
import type {
  AResponsivePopoverProps,
  AResponsivePopoverEmits,
  ScrollLockMode,
} from '@alikhalilll/a-responsive-popover';
```

Slot prop type inference example — when overriding a slot, infer the slot's prop bag from the `*Slots` interface:

```vue
<script setup lang="ts">
import type { ATelInputSlots } from '@alikhalilll/a-tel-input';
type SuffixProps = Parameters<NonNullable<ATelInputSlots['suffix']>>[0];
//   ↑ { validationState: 'idle' | 'valid' | 'error'; validation: PhoneValidationResult }
</script>
```

**Domain types** — `Size`, `CountryOption`, `PhoneValidationResult`, `PhoneValidationReason`, `PhoneRequiredInfo`, `DetectionStrategy`, `DetectCountryOptions`, `FlagUrlBuilder`, `TelInputMessages`, `TelInputMessagesInput`.

## Notes

- Country detection runs in `onMounted` (client-only) — the input renders immediately with `defaultCountry`; the detected ISO2 patches in on hydration.
- Import `@alikhalilll/a-ui-base/tokens.css` **before** your own overrides so your overrides win the cascade.

## License

MIT © alikhalilll
