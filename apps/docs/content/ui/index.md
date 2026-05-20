---
title: ui
description: Headless, shadcn-vue style component library. Built on reka-ui and vaul-vue, fully typed, theme-able via CSS variables, and deeply customizable via slots + override props.
package: '@alikhalilll/ui'
order: 4
---

# @alikhalilll/ui

A headless, [shadcn-vue](https://www.shadcn-vue.com/) style component library for Vue 3 and Nuxt 3/4. Built on top of [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue), fully typed, theme-able via CSS variables, and deeply customizable via slots + override props.

The flagship composite component is **[`ATellInput`](/ui/tell-input)** — a phone-number input that detects the user's country automatically, validates with `libphonenumber-js`, and lets you re-skin every visible region.

## Components

| Component                                      | Description                                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [`ATellInput`](/ui/tell-input)                 | Composite phone input: country picker + national-number field. Auto-detection, validation, popover/drawer picker, 16 named slots. |
| [`AInput`](/ui/input)                          | Base shadcn-style text input. Shared size scale, optional `#prefix` / `#suffix` slots.                                            |
| [`APopover`](/ui/popover)                      | reka-ui Popover wrapper. Modal by default, optional overlay, full props/emits forwarding.                                         |
| [`ADrawer`](/ui/drawer)                        | vaul-vue Drawer wrapper. Bottom-anchored, drag-to-dismiss, snap points.                                                           |
| [`AResponsivePopover`](/ui/responsive-popover) | Popover on desktop, Drawer on mobile. Single `v-model:open`, separate per-branch class props.                                     |

## Install

```bash
pnpm add @alikhalilll/ui
```

Peer dependency: `vue ^3.5.0`. The library bundles `reka-ui`, `vaul-vue`, `libphonenumber-js`, `lucide-vue-next`, `@vueuse/core`, `class-variance-authority`, `clsx`, and `tailwind-merge`. **It does NOT require Nuxt** — it works in any Vue 3 app.

## Setup

Components are styled with Tailwind utility classes (`bg-popover`, `text-muted-foreground`, etc.) that resolve to CSS variables shipped in `@alikhalilll/ui/styles.css`. Three steps:

### 1. Import the CSS variables

```ts
// nuxt.config.ts (or wherever you import global CSS)
export default defineNuxtConfig({
  css: ['@alikhalilll/ui/styles.css', '~/assets/main.css'],
});
```

Every variable is prefixed `--ak-ui-` so it cannot collide with your existing CSS:

```css
:root,
.light {
  --ak-ui-background: 0 0% 100%;
  --ak-ui-foreground: 240 10% 3.9%; /* ... */
}
.dark {
  --ak-ui-background: 240 10% 3.9%;
  --ak-ui-foreground: 0 0% 98%; /* ... */
}
```

### 2. Expose the tokens to Tailwind

Tailwind v4 — add an `@theme inline` block to your global stylesheet so utility classes like `bg-popover` resolve to the lib's HSL variables:

```css
@import 'tailwindcss';

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

Then add an `@source` directive so Tailwind v4 scans the library's compiled templates (it doesn't scan `node_modules` by default):

```css
@source '../node_modules/@alikhalilll/ui/dist/index.mjs';
```

Inside a pnpm workspace, point at the source directly so HMR works:

```css
@source '../../packages/ui/src/**/*.{vue,ts}';
```

### 3. Toggle dark mode

The lib ships **both** `:root, .light { … }` and `.dark { … }` blocks out of the box. Toggle the class on `<html>` (statically, with a `useColorMode` composable, or via a pre-paint inline script) and every component flips themes through the CSS cascade — including content rendered inside Teleport portals.

```ts
// nuxt.config.ts — locked dark
export default defineNuxtConfig({
  app: { head: { htmlAttrs: { class: 'dark' } } },
});
```

Or roll a tri-state Light / Dark / System switcher in three lines — see the docs site source under `apps/docs/composables/useColorMode.ts` + `AppHeader.vue` for a working pattern.

## Customization at a glance

Three vectors compose together — pick one or stack them all.

### Slots (replace any visible region)

| Component        | Slots                                                                                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ATellInput`     | `prefix`, `suffix`, `valid-icon`, `error-icon`, `hint`, `error`, plus forwarded from `ACountrySelect`: `trigger`, `chevron`, `flag`, `search`, `search-icon`, `loading`, `empty`, `group-header`, `item`, `item-check` |
| `ACountrySelect` | Same set as above (without the validation/prefix/suffix slots)                                                                                                                                                         |
| `AInput`         | `prefix`, `suffix` — when either is filled, the component wraps the native input in a bordered row so the prefix/suffix sit inside the field                                                                           |
| `ACountryFlag`   | `empty` — fallback when no ISO2 is provided                                                                                                                                                                            |

### Data-override props (replace the data source)

| Prop                   | Type                                             | Replaces                                                                                                    |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `flagUrl`              | `(iso2, width) => string`                        | The default `flagcdn.com` URL builder. Swap for SVG sprites, your CDN, or the `country-flag-icons` package. |
| `countries`            | `CountryOption[]`                                | The internal REST Countries fetch. Useful for curated lists or fully offline.                               |
| `searcher`             | `(query, country) => boolean`                    | The default `search_key.includes(q)` filter. Implement fuzzy / starts-with / locale-aware matching.         |
| `detector`             | `(opts) => Promise<string \| null>`              | The IP → timezone → locale chain. Return `null` to fall through to the built-in chain.                      |
| `errorMessages`        | `Partial<Record<PhoneValidationReason, string>>` | English defaults — useful for i18n.                                                                         |
| `kbdOpen` / `kbdClose` | `string \| null`                                 | The `⌘K` / `Esc` keyboard hints in the picker. Pass `null` to hide.                                         |
| `maxResults`           | `number`                                         | Cap on search result count (default 80).                                                                    |
| `suggestedLimit`       | `number`                                         | Cap on "Suggested" group items (default 4).                                                                 |

### Class-override props (every region)

`class`, `fieldClass`, `inputClass`, `contentClass`, `popoverClass`, `drawerClass`, `triggerClass`, `hintClass`, `errorClass`. All merged via `tailwind-merge`, so you only specify the bits you want to change.

### CSS variables (prefixed `--ak-ui-*`)

19 design tokens for background, popover, muted, accent, destructive, border, input, ring, radius, plus their `*-foreground` pairs. Override on `:root`, `.dark`, or any scoped class for per-tenant theming.

See the full live customization gallery on the [`ATellInput`](/ui/tell-input#full-customization) page — Cream pill, Banking, Playful, Minimal, plus an "everything customized" reference example.

## Size scale

Every interactive component (`AInput`, `ATellInput`, `ACountrySelect`) shares one scale:

| Token | Height              | Tailwind   |
| ----- | ------------------- | ---------- |
| `xs`  | 28 px               | `h-7`      |
| `sm`  | 36 px               | `h-9`      |
| `md`  | **43 px (default)** | `h-[43px]` |
| `lg`  | 52 px               | `h-[52px]` |
| `xl`  | 60 px               | `h-[60px]` |

The maps are exported so you can build your own size-aware components:

```ts
import {
  SIZES,
  DEFAULT_SIZE,
  controlHeight,
  controlPaddingX,
  controlTextSize,
  controlHeightPx,
  type Size,
} from '@alikhalilll/ui';
```

## Theming

The lib ships HSL CSS variables for a light and a dark mode. Override them anywhere in the cascade — globally on `:root`, or scoped to a single section for per-tenant theming.

```css
/* Per-tenant theme — scope to a wrapper class */
.tenant-acme {
  --ak-ui-popover: 220 70% 8%;
  --ak-ui-popover-foreground: 220 30% 96%;
  --ak-ui-accent: 220 70% 30%;
  --ak-ui-ring: 220 100% 65%;
}
```

```vue
<div class="tenant-acme">
  <ATellInput v-model:phone="phone" v-model:country="country" />
</div>
```

Eight live theming recipes (brand-color-only, dynamic JSON-driven, day/night toggle, multi-tenant, state-specific surfaces, etc.) are demonstrated on the [`ATellInput`](/ui/tell-input#theming) page.

## Public API surface

Everything exported from `@alikhalilll/ui`:

**Components**

- [`ATellInput`](/ui/tell-input), `ACountrySelect`, `ACountryFlag`
- [`AInput`](/ui/input)
- [`APopover`](/ui/popover), `APopoverTrigger`, `APopoverContent`
- [`ADrawer`](/ui/drawer), `ADrawerTrigger`, `ADrawerContent`, `ADrawerOverlay`
- [`AResponsivePopover`](/ui/responsive-popover), `AResponsivePopoverTrigger`, `AResponsivePopoverContent`

**Composables**

- `usePhoneValidation()` — country list (REST Countries + localStorage cache), `validate()`, `searchCountries()`, `getCountryByValue()`, `getCountriesByDial()`, `getRequiredInfo()`
- `useCountryDetection(opts?)` — reactive `{ country, isLoading, refresh }`
- `detectCountry(opts?)` — imperative one-shot detection

**Helpers**

- `cn` — `clsx` + `tailwind-merge`
- `SIZES`, `DEFAULT_SIZE`, `controlHeight`, `controlPaddingX`, `controlTextSize`, `controlHeightPx`
- `aTellInputVariants`, `DEFAULT_ERROR_MESSAGES`
- `defaultFlagUrl(iso2, width)` — the default flag URL builder (handy to wrap when customizing `flagUrl`)

**Types**

- `ATellInputProps` · `ATellInputSize` · `ATellInputVariants` · `Size`
- `CountryOption` · `PhoneValidationResult` · `PhoneValidationReason` · `PhoneRequiredInfo`
- `DetectionStrategy` · `DetectCountryOptions` · `UseCountryDetectionReturn` · `UsePhoneValidationReturn`
- `FlagUrlBuilder`

## Important notes

- **Country detection** runs in `onMounted`, never on the server — the input always renders immediately with the `defaultCountry`, and the detected ISO2 patches in on the client.
- The **responsive popover** uses `useMediaQuery('(min-width: 768px)')`, which is `false` during SSR. The first server-rendered paint is the drawer variant; the client may swap to the popover variant on hydration. The vaul-vue drawer is collapsed when closed, so this is invisible.
- The lib's CSS variables ship via `@alikhalilll/ui/styles.css` — make sure it's listed in your `css: [...]` _before_ any consumer overrides so your overrides win the cascade.

## License

MIT © alikhalilll
