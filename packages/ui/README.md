# @alikhalilll/ui

Headless, [shadcn-vue](https://www.shadcn-vue.com/) style component library for Vue 3 (and Nuxt). Built on [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue), fully typed, scalable, with sensible defaults you can override on every level.

The first component shipped is **`ATellInput`** — a phone-number input that:

- Detects the user's country automatically (IP geolocation → timezone → `navigator.language` → fallback).
- Validates and formats input via [`libphonenumber-js`](https://www.npmjs.com/package/libphonenumber-js).
- Renders a **popover on desktop, vaul-vue drawer on mobile** for the country picker.
- Exposes every sub-primitive so you can compose your own variant if the default doesn't fit.

## Install

```bash
pnpm add @alikhalilll/ui
```

Peer dependency: `vue ^3.5.0`. The library bundles `reka-ui`, `vaul-vue`, `libphonenumber-js`, `lucide-vue-next`, `@vueuse/core`, `class-variance-authority`, `clsx`, and `tailwind-merge`.

## Setup

The components are styled with Tailwind utility classes (`bg-popover`, `text-destructive`, etc.) that resolve to CSS variables shipped in `@alikhalilll/ui/styles.css`. You need to:

1. **Import the variables** somewhere global:

   ```ts
   // In a Nuxt config or your main entry
   import '@alikhalilll/ui/styles.css';
   ```

2. **Expose the variables to Tailwind**. For Tailwind v4 add an `@theme inline` block to your global stylesheet:

   ```css
   @import 'tailwindcss';
   @import '@alikhalilll/ui/styles.css';

   @theme inline {
     --color-background: hsl(var(--ak-ui-background));
     --color-foreground: hsl(var(--ak-ui-foreground));
     --color-popover: hsl(var(--ak-ui-popover));
     --color-popover-foreground: hsl(var(--ak-ui-popover-foreground));
     --color-primary: hsl(var(--ak-ui-primary));
     --color-primary-foreground: hsl(var(--ak-ui-primary-foreground));
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

   For Tailwind v3, add the same colors to `theme.extend.colors` in `tailwind.config.ts`.

3. **Toggle dark mode** by adding `.dark` to a parent element (typically `<html>`).

   The lib ships **both** `:root, .light { … }` and `.dark { … }` blocks. You can lock the theme:

   ```ts
   // Locked dark
   export default defineNuxtConfig({
     app: { head: { htmlAttrs: { class: 'dark' } } },
   });
   ```

   Or run a tri-state Light / Dark / System switcher that follows `prefers-color-scheme`. The docs site under [`apps/docs/composables/useColorMode.ts`](https://github.com/alikhalilll/ali-nuxt-toolkit/blob/master/apps/docs/composables/useColorMode.ts) ships a complete working pattern (persisted preference, OS-change listener, pre-paint inline script to avoid flash of wrong theme) that you can copy as-is.

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');
</script>

<template>
  <ATellInput
    v-model:phone="phone"
    v-model:country="country"
    default-country="SA"
    show-validation
  />
</template>
```

### Props

| Prop                | Type                                             | Default                        | Description                                                                                |
| ------------------- | ------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `v-model:phone`     | `string`                                         | `''`                           | Digits-only national number (no leading `+` or dial code).                                 |
| `v-model:country`   | `string`                                         | `''`                           | ISO 3166-1 alpha-2 code, e.g. `"EG"`.                                                      |
| `placeholder`       | `string`                                         | `'Phone number'`               | Falls back to the country's example number when empty.                                     |
| `disabled`          | `boolean`                                        | `false`                        |                                                                                            |
| `loading`           | `boolean`                                        | `false`                        | Disables interaction.                                                                      |
| `size`              | `'sm' \| 'default' \| 'lg'`                      | `'default'`                    | Controls input height (32 / 36 / 40 px).                                                   |
| `allowedDialCodes`  | `string[]`                                       | _all_                          | Whitelist of dial-digit codes (no `+`). Countries outside the list are shown but disabled. |
| `showValidation`    | `boolean`                                        | `false`                        | Renders an error message below the input when invalid.                                     |
| `detectCountry`     | `'auto' \| 'locale' \| 'none'`                   | `'auto'`                       | Country auto-detect strategy.                                                              |
| `defaultCountry`    | `string`                                         | `'US'`                         | Fallback ISO2 when detection fails or is disabled.                                         |
| `ipEndpoint`        | `string`                                         | `'https://ipapi.co/json/'`     | Override the geolocation endpoint. Must return JSON with `country_code` or `country`.      |
| `searchPlaceholder` | `string`                                         | `'Search by country or code…'` | Country picker search input placeholder.                                                   |
| `emptyText`         | `string`                                         | `'No countries found.'`        | Shown when the search yields no results.                                                   |
| `loadingText`       | `string`                                         | `'Loading…'`                   | Shown while the country list is loading.                                                   |
| `errorMessages`     | `Partial<Record<PhoneValidationReason, string>>` | English defaults               | Override the validation error labels.                                                      |
| `class`             | `string \| any[] \| Record<string, boolean>`     | —                              | Merged into the outer wrapper via `tailwind-merge`.                                        |

### Exposed (via template ref)

```ts
const ref = ref<InstanceType<typeof ATellInput>>();
ref.value.validation; // PhoneValidationResult — computed, reactive
ref.value.required; // PhoneRequiredInfo | null — example, length range, format hint
ref.value.selectedDialCode; // '+20' | null
```

## Compose your own component

Every primitive, composable, and CVA helper is re-exported from the package root, so you can build a custom variant without forking the library.

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

  // Utilities
  cn,
} from '@alikhalilll/ui';

// Build your own tel input from the same composables
const { validate, getCountries, searchCountries } = usePhoneValidation();
const detected = await detectCountry({ strategy: 'auto' });
```

Or pull the country select on its own (any list-of-countries UI):

```vue
<ACountrySelect v-model:selected="iso2" />
```

Or build any responsive popover (popover-on-desktop, drawer-on-mobile):

```vue
<AResponsivePopover v-model:open="open">
  <AResponsivePopoverTrigger as-child>
    <button>Open</button>
  </AResponsivePopoverTrigger>
  <AResponsivePopoverContent>
    <p>Content</p>
  </AResponsivePopoverContent>
</AResponsivePopover>
```

## Full customization

`ATellInput` exposes a deep customization surface across three vectors. Every override is opt-in — defaults are sensible, so a vanilla `<ATellInput />` works out of the box.

**Slots (replace any rendered region):**

```
prefix · suffix · trigger · chevron · flag · search · search-icon ·
loading · empty · group-header · item · item-check · valid-icon ·
error-icon · hint · error
```

**Data-override props:**

```ts
flagUrl?:   (iso2, width) => string                                   // swap flagcdn.com for any source
countries?: CountryOption[]                                          // bypass REST Countries; ship your own list
searcher?:  (query, country) => boolean                              // custom search (fuzzy/starts-with/locale-aware)
detector?:  (opts) => Promise<string | null>                         // custom country detection (e.g. server-driven)
errorMessages?: Partial<Record<PhoneValidationReason, string>>       // i18n
kbdOpen?: string | null      // override the '⌘K' hint
kbdClose?: string | null     // override the 'Esc' hint
```

**Class-override props (every region):** `class`, `fieldClass`, `inputClass`, `contentClass`, `popoverClass`, `drawerClass`, `hintClass`, `errorClass`. All merged via `tailwind-merge`, so you only specify the bits you want to change.

**Example — fully bespoke trigger, custom country list, custom searcher, custom detector:**

```vue
<script setup lang="ts">
import { ATellInput, defaultFlagUrl, type CountryOption } from '@alikhalilll/ui';

const countries: CountryOption[] = [
  /* … your curated list … */
];

const flagUrl = (iso: string) => `/flags/${iso.toLowerCase()}.svg`;
const searcher = (q: string, c: CountryOption) =>
  c.raw_data.name.toLowerCase().startsWith(q.toLowerCase());

async function detector() {
  // Pretend your backend tells you the user's country from the request
  const { country } = await $fetch('/api/locale');
  return country;
}
</script>

<template>
  <ATellInput
    v-model:phone="phone"
    v-model:country="country"
    :countries="countries"
    :flag-url="flagUrl"
    :searcher="searcher"
    :detector="detector"
  >
    <template #trigger="{ selectedCountry, open }">
      <button :data-open="open">
        {{ selectedCountry?.raw_data.iso2 ?? '??' }}
      </button>
    </template>
  </ATellInput>
</template>
```

`AInput` also exposes `#prefix` and `#suffix` slots — when either is filled the component switches to a wrapped layout so the bordered field carries the focus ring while the slot content sits inside the border. See the [docs site](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/input) for the full prop tables and a live demo gallery.

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

The `defaultFlagUrl(iso2, width)` builder is also exported — handy for composing a custom builder on top of the default:

```ts
import { defaultFlagUrl } from '@alikhalilll/ui';
const hiRes = (iso: string) => defaultFlagUrl(iso, 80);
```

## Country detection chain

1. **IP geolocation** — fetch `ipEndpoint` (default `https://ipapi.co/json/`), aborted after `timeoutMs` (default 2 s). Result cached in `sessionStorage` so re-mounts skip the network call.
2. **Timezone** — `Intl.DateTimeFormat().resolvedOptions().timeZone` against a built-in IANA-zone-to-ISO2 map (~70 zones, covers most populated cities).
3. **`navigator.language`** — extracts the region from tags like `en-US`, `ar-EG`, `pt-BR`.
4. **`defaultCountry`** — final fallback (`'US'` if you don't set one).

Pass `detect-country="locale"` to skip the IP step (no network), or `detect-country="none"` to use `defaultCountry` immediately.

## License

MIT © alikhalilll
