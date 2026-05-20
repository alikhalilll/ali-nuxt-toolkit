---
title: ATellInput
description: Composite phone-number input with automatic country detection, libphonenumber-js validation, and a popover/drawer country picker.
package: '@alikhalilll/ui'
order: 1
---

# ATellInput

The flagship composite component. Combines `AInput`, `ACountrySelect`, `usePhoneValidation`, and `useCountryDetection` into a single tel-input with sensible defaults.

::DemoTellInputBasic
::

## Install

```bash
pnpm add @alikhalilll/ui
```

If this is your first `@alikhalilll/ui` component, complete the [one-time setup](/ui#setup) (CSS import + Tailwind `@theme inline` mapping + `.dark` class). Then import:

```ts
import { ATellInput } from '@alikhalilll/ui';
```

## Basic usage

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

`v-model:phone` is the digits-only national number (`"1066105963"`) and `v-model:country` is the ISO 3166-1 alpha-2 code (`"EG"`). The dial code, full E.164 number, and validation status are all available through the component's exposed `validation`.

## Props

| Prop                | Type                                             | Default                      | Description                                                     |
| ------------------- | ------------------------------------------------ | ---------------------------- | --------------------------------------------------------------- |
| `v-model:phone`     | `string`                                         | `''`                         | Digits-only national number — no leading `+`, no dial code.     |
| `v-model:country`   | `string`                                         | `''`                         | ISO 3166-1 alpha-2 code, e.g. `"EG"`.                           |
| `placeholder`       | `string`                                         | `'Phone number'`             | Falls back to the country's example national number when empty. |
| `disabled`          | `boolean`                                        | `false`                      |                                                                 |
| `loading`           | `boolean`                                        | `false`                      | Disables interaction.                                           |
| `size`              | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`           | `'md'` (43 px)               | Drives input + trigger height, padding, text size.              |
| `allowedDialCodes`  | `string[]`                                       | _all_                        | Whitelist of dial-digit codes (no `+`).                         |
| `showValidation`    | `boolean`                                        | `false`                      | Render an error message below the input when invalid.           |
| `detectCountry`     | `'auto' \| 'locale' \| 'none'`                   | `'auto'`                     | Country auto-detect strategy.                                   |
| `defaultCountry`    | `string`                                         | `'US'`                       | Fallback ISO2 when detection fails or is disabled.              |
| `ipEndpoint`        | `string`                                         | `'https://ipapi.co/json/'`   | Override the IP geolocation endpoint.                           |
| `searchPlaceholder` | `string`                                         | `'Search country or +code…'` | Country picker search input placeholder.                        |
| `emptyText`         | `string`                                         | `'No countries found.'`      | Shown when search yields no results.                            |
| `loadingText`       | `string`                                         | `'Loading countries…'`       | Shown while the country list loads.                             |
| `errorMessages`     | `Partial<Record<PhoneValidationReason, string>>` | English defaults             | Override the validation error labels.                           |
| `class`             | `HTMLAttributes['class']`                        | —                            | Merged into the outer wrapper via `tailwind-merge`.             |

## Exposed (template ref)

```ts
const ref = ref<InstanceType<typeof ATellInput>>();
ref.value.validation; // PhoneValidationResult — reactive
ref.value.required; // PhoneRequiredInfo | null — example number, length range, format hint
ref.value.selectedDialCode; // '+20' | null
ref.value.validationState; // 'idle' | 'valid' | 'error'
```

## Sizes

::DemoTellInputSizes
::

The five sizes (`xs`, `sm`, `md` default, `lg`, `xl` — 28/36/43/52/60 px) share Tailwind utility maps you can re-use in your own components — see [Size scale](/ui#size-scale).

## Validation

::DemoTellInputValidation
::

Validation runs on every keystroke through the shared `usePhoneValidation()` composable, which wraps `libphonenumber-js`. The result is a tagged object:

```ts
interface PhoneValidationResult {
  ok: boolean;
  reason: PhoneValidationReason | null;
  country: { iso2: string; dial_code: string } | null;
  phone: { raw: string | null; digits: string };
  full_phone: string | null; // E.164, e.g. '+201066105963'
  required: PhoneRequiredInfo | null;
  details?: Record<string, unknown>;
}

type PhoneValidationReason =
  | 'missing_country'
  | 'country_not_supported'
  | 'phone_has_non_digits'
  | 'too_short'
  | 'too_long'
  | 'invalid_phone'
  | 'parse_failed';
```

Localize the messages with `errorMessages`:

```vue
<ATellInput
  v-model:phone="phone"
  v-model:country="country"
  :error-messages="{
    too_short: 'الرقم قصير جدًا',
    invalid_phone: 'الرقم غير صحيح',
  }"
  show-validation
/>
```

## Country detection

The component fires detection in `onMounted`, so the input renders immediately and the country swaps in once resolved. The chain is:

1. **IP geolocation** — `fetch(ipEndpoint)`, default `https://ipapi.co/json/`, aborted after 2 s. Cached in `sessionStorage` (`ali_ui_country_detected`) so re-mounts skip the network call.
2. **Timezone** — `Intl.DateTimeFormat().resolvedOptions().timeZone` against a built-in IANA-zone → ISO2 map (~70 zones covering the most-populated cities).
3. **`navigator.language`** — region extracted from tags like `en-US`, `ar-EG`, `pt-BR`.
4. **`defaultCountry`** — final fallback, `'US'` if you don't set one.

| `detect-country` value | Behavior                                           |
| ---------------------- | -------------------------------------------------- |
| `'auto'` (default)     | IP → timezone → locale → default                   |
| `'locale'`             | Skip the network call. Timezone → locale → default |
| `'none'`               | Use `defaultCountry` immediately                   |

Use `'locale'` when you can't add a third-party request to your privacy/CSP policy; use `'none'` when you already know the user's country from your backend.

You can also call detection imperatively from anywhere:

```ts
import { detectCountry } from '@alikhalilll/ui';

const iso2 = await detectCountry({
  strategy: 'auto',
  ipEndpoint: 'https://ipapi.co/json/',
  defaultCountry: 'SA',
  timeoutMs: 2000,
});
```

## Restricting countries

::DemoTellInputAllowed
::

Pass `allowedDialCodes` (array of dial **digits**, no `+`) to limit which countries are selectable. Every country still renders in the picker — disallowed ones are greyed out and unclickable, so the user can see why their region isn't available.

```vue
<ATellInput
  v-model:phone="phone"
  v-model:country="country"
  :allowed-dial-codes="['20', '966', '971']"
  default-country="SA"
/>
```

## Theming

The component is fully theme-able via CSS variables prefixed `--ak-ui-*` — no component prop changes, no rebuild. The gallery below shows nine ready-made looks plus the snippet you can drop straight into your own stylesheet:

::DemoTellInputThemes
::

Three patterns for applying a theme:

### 1. Global override

Drop the variables on `:root` (or `.dark` / `.light`) to retheme every `ATellInput` in your app at once. Put this **after** `@import '@alikhalilll/ui/styles.css'` so your overrides win the cascade:

```css
@import '@alikhalilll/ui/styles.css';

:root {
  --ak-ui-popover: 230 32% 9%;
  --ak-ui-popover-foreground: 220 30% 96%;
  --ak-ui-muted: 230 25% 14%;
  --ak-ui-muted-foreground: 220 15% 65%;
  --ak-ui-accent: 230 50% 22%;
  --ak-ui-ring: 215 100% 70%;
  --ak-ui-border: 230 20% 18%;
  --ak-ui-input: 230 20% 18%;
}
```

### 2. Scoped class (per section, per tenant)

Wrap the input in a class with the variables — every component inside, including the popover and drawer rendered via Teleport portals, inherits via the CSS cascade.

```vue
<div class="theme-stripe">
  <ATellInput v-model:phone="phone" v-model:country="country" />
</div>
```

```css
.theme-stripe {
  --ak-ui-popover: 230 32% 9%;
  --ak-ui-accent: 230 50% 22%;
  --ak-ui-ring: 215 100% 70%;
}
```

### 3. Inline style (rapid prototyping)

For one-offs or interactive demos, write the variables straight onto a wrapper element via `:style`:

```vue
<div
  :style="{
    '--ak-ui-popover': '155 50% 8%',
    '--ak-ui-accent': '152 60% 30%',
    '--ak-ui-ring': '152 70% 50%',
  }"
>
  <ATellInput v-model:phone="phone" v-model:country="country" />
</div>
```

### Which variables matter

| Variable                           | Used by                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `--ak-ui-background`               | Page background colour the input sits on (`bg-background`).   |
| `--ak-ui-foreground`               | Primary text.                                                 |
| `--ak-ui-popover` / `*-foreground` | Country picker popover surface + its text.                    |
| `--ak-ui-muted` / `*-foreground`   | Country trigger background, hint text, search bar background. |
| `--ak-ui-accent` / `*-foreground`  | Country list hover + selected row.                            |
| `--ak-ui-destructive`              | Error ring + warning icon when phone is invalid.              |
| `--ak-ui-border`                   | Outer input border (idle state).                              |
| `--ak-ui-input`                    | Inner divider between country trigger and the phone field.    |
| `--ak-ui-ring`                     | Focus-ring colour. The visual "brand colour" of the input.    |

All values are HSL **triplets** (e.g. `230 50% 22%`) — no `hsl(...)` wrapper — because the lib's Tailwind tokens compose them via `hsl(var(--ak-ui-foo))`. This lets you stay in HSL space for easy palette math without overcommitting to specific colour syntax.

The full token list is in [the overview's theming section](/ui#theming).

## Theming recipes

Concrete, copy-ready patterns for the situations you'll actually hit.

### Recipe 1 · Brand-color-only

If all you want is _"the input should match our brand color"_, override two variables — the focus ring and the country-row hover accent. Everything else inherits from the shipped dark theme:

```css
:root {
  --ak-ui-ring: 215 100% 70%; /* your brand HSL */
  --ak-ui-accent: 215 50% 25%; /* same hue, darker */
}
```

That's it. Three values, one hue, theme done.

### Recipe 2 · Build a palette from a single hue

When you want the _whole_ component to colour-shift, vary lightness on the same hue. Slide the picker below to dial in your brand color and watch the input adapt in real time:

::DemoTellInputBrandPicker
::

The math behind it: keep the hue and base saturation constant, step the **lightness** from `7%` (background) → `9%` (popover) → `14%` (muted) → `18%` (border) → `22%` (accent) → `60%`+ (ring). The lib's component classes do the rest.

### Recipe 3 · Day / night toggle

The lib ships both light and dark token sets out of the box — you don't need to write them. Just flip a class on `<html>` (or any wrapper) between `light` and `dark`:

::DemoTellInputDayNight
::

```vue
<script setup lang="ts">
const isDark = useDark(); // any composable, custom toggle, or system pref
</script>

<template>
  <div :class="isDark ? 'dark' : 'light'">
    <ATellInput v-model:phone="phone" v-model:country="country" />
  </div>
</template>
```

Or globally on the document — recommended so portaled popovers/drawers always render in the right mode:

```ts
// composables/useTheme.ts
export function useTheme() {
  const mode = useState<'light' | 'dark'>('theme', () => 'dark');
  watchEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', mode.value === 'dark');
    document.documentElement.classList.toggle('light', mode.value === 'light');
  });
  return mode;
}
```

### Recipe 4 · Multi-tenant (per-section themes)

Two tenants on the same page, each with its own brand. Wrap each section in a tenant class with its variables — the popover portal inherits per-tenant via the CSS cascade, so the picker that opens above the Acme input is green and the one above the Nova input is purple, simultaneously, on the same page:

::DemoTellInputMultiTenant
::

```css
.tenant-acme {
  --ak-ui-popover: 155 50% 8%;
  --ak-ui-accent: 152 60% 30%;
  --ak-ui-ring: 152 70% 50%;
  --ak-ui-border: 155 30% 18%;
}

.tenant-nova {
  --ak-ui-popover: 270 40% 8%;
  --ak-ui-accent: 270 50% 30%;
  --ak-ui-ring: 270 90% 65%;
  --ak-ui-border: 270 30% 18%;
}
```

```vue
<div class="tenant-acme">
  <ATellInput v-model:phone="acme.phone" v-model:country="acme.country" />
</div>

<div class="tenant-nova">
  <ATellInput v-model:phone="nova.phone" v-model:country="nova.country" />
</div>
```

### Recipe 5 · Theme from a JSON config (server-driven)

If your theme is configured in a database (a SaaS where customers pick their own brand), generate the variables on the fly and write them on a wrapper element:

```vue
<script setup lang="ts">
interface BrandConfig {
  hue: number;
  sat: number;
}
const { data: brand } = await useFetch<BrandConfig>('/api/tenant/brand');

const themeStyle = computed(() => {
  const { hue = 215, sat = 75 } = brand.value ?? {};
  return {
    '--ak-ui-background': `${hue} ${Math.round(sat * 0.5)}% 7%`,
    '--ak-ui-popover': `${hue} ${Math.round(sat * 0.45)}% 9%`,
    '--ak-ui-muted': `${hue} ${Math.round(sat * 0.4)}% 14%`,
    '--ak-ui-accent': `${hue} ${Math.round(sat * 0.55)}% 22%`,
    '--ak-ui-border': `${hue} ${Math.round(sat * 0.35)}% 18%`,
    '--ak-ui-input': `${hue} ${Math.round(sat * 0.35)}% 18%`,
    '--ak-ui-ring': `${hue} ${sat}% 60%`,
  };
});
</script>

<template>
  <div :style="themeStyle">
    <ATellInput v-model:phone="phone" v-model:country="country" />
  </div>
</template>
```

### Recipe 6 · State-specific theming (success / warning surfaces)

Need the input to render in a different theme inside a "review" or "warning" surface? Scope a class to that surface — the input doesn't need to know:

```css
.review-card {
  --ak-ui-ring: 28 100% 60%; /* amber ring */
  --ak-ui-accent: 18 70% 35%;
  --ak-ui-input: 30 60% 30%;
}
```

```vue
<div class="review-card rounded-lg border border-amber-500/30 p-4">
  <p class="mb-2 text-sm">Please confirm your phone</p>
  <ATellInput v-model:phone="phone" v-model:country="country" />
</div>
```

### Recipe 7 · Tailwind v4 brand integration

If your Tailwind config already names a brand color, point the lib's `--ak-ui-ring` at the matching HSL value so your focus ring stays in lockstep with the rest of your design system:

```css
@import 'tailwindcss';
@import '@alikhalilll/ui/styles.css';

@theme {
  --color-brand: oklch(0.72 0.18 230);
}

@theme inline {
  /* …the rest of the lib mapping… */
  --color-ring: var(--color-brand);
}

:root {
  /* Override the lib's ring HSL with your brand */
  --ak-ui-ring: 215 100% 70%;
}
```

The first `@theme` block defines `--color-brand` and surfaces it as a Tailwind utility (`bg-brand`, etc.). The override on `:root` makes the lib's components use the same brand for their ring.

### Recipe 8 · Adjust radius (compact / pill-shaped variants)

The radius variable doesn't have a Tailwind token — it's used directly inside the lib via `var(--ak-ui-radius)`. Override it scoped or globally:

```css
.compact {
  --ak-ui-radius: 0.25rem;
}
.pill {
  --ak-ui-radius: 999px;
}
```

## Full customization

Beyond CSS variables, every visual region of `ATellInput` is replaceable via Vue slots, every data source is replaceable via a prop, and every region of the rendered tree accepts its own class.

### Live gallery — fully-customized inputs

Each example below is the **same component** with different slot overrides, override props, and CSS-variable themes. The first one in particular shows how far you can push the look — pill-shaped, light cream theme, circular flag, phone-icon suffix, custom label above:

::DemoTellInputCustomPillCream
::

::DemoTellInputCustomBank
::

::DemoTellInputCustomPlayful
::

::DemoTellInputCustomMinimal
::

### Everything-customized reference

The demo below stacks every customization vector — curated countries, hi-res flags, custom searcher, custom detector, slot overrides for icons, hint, error, item-check, and group-header:

::DemoTellInputCustomization
::

### Slots

| Slot           | Scope                                       | Replaces                                            |
| -------------- | ------------------------------------------- | --------------------------------------------------- |
| `prefix`       | —                                           | Content before the country trigger (e.g. an icon).  |
| `suffix`       | `{ validationState, validation }`           | Content after the input, inside the border.         |
| `trigger`      | `{ selectedCountry, open, sizeClasses }`    | Entire country picker trigger button.               |
| `chevron`      | `{ open }`                                  | Just the chevron icon.                              |
| `flag`         | `{ country, context: 'trigger' \| 'item' }` | Flag rendering for both the trigger and list items. |
| `search`       | `{ value, setValue, isSearching }`          | Entire search bar (input + icon + kbd).             |
| `search-icon`  | —                                           | Just the leading search icon.                       |
| `loading`      | —                                           | Loading state in the picker.                        |
| `empty`        | `{ query }`                                 | Empty / no-results state.                           |
| `group-header` | `{ label, group: 'suggested' \| 'all' }`    | Section headers in the picker.                      |
| `item`         | `{ country, selected, disabled, select }`   | Entire row in the country list.                     |
| `item-check`   | `{ country }`                               | Just the right-side check icon.                     |
| `valid-icon`   | —                                           | Green check shown when validation passes.           |
| `error-icon`   | `{ reason }`                                | Warning icon shown when validation fails.           |
| `hint`         | `{ country, formatHint, example }`          | Dim helper line shown below the input when empty.   |
| `error`        | `{ message, reason, validation }`           | Error message shown below the input when invalid.   |

### Data-override props

| Prop                   | Type                                                      | Replaces                                                                                                                               |
| ---------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `flagUrl`              | `(iso2: string, width: number) => string`                 | The default `flagcdn.com` URL builder. Use to point at any flag source — your CDN, the `country-flag-icons` package, SVG sprites, etc. |
| `countries`            | `CountryOption[]`                                         | The internal REST Countries fetch. Use to ship a curated subset, an i18n'd list, or an offline-only dataset.                           |
| `searcher`             | `(query: string, country: CountryOption) => boolean`      | The default `search_key.includes(q)` substring match. Use to implement starts-with, fuzzy, weighted, or per-locale matching.           |
| `detector`             | `(opts: DetectCountryOptions) => Promise<string \| null>` | The default IP → timezone → locale chain. Return `null` to fall through to the built-in chain.                                         |
| `errorMessages`        | `Partial<Record<PhoneValidationReason, string>>`          | Per-reason error text — useful for i18n.                                                                                               |
| `kbdOpen` / `kbdClose` | `string \| null`                                          | The `⌘K` / `Esc` keyboard hints. Pass `null` to hide.                                                                                  |

### Class-override props

Every region accepts a `*Class` prop merged via `tailwind-merge`, so you can adjust styling without re-implementing the markup:

| Prop           | Region                                                       |
| -------------- | ------------------------------------------------------------ |
| `class`        | Outer wrapper (column with field + error).                   |
| `fieldClass`   | The bordered field row that contains country select + input. |
| `inputClass`   | The native `<input type="tel">` element.                     |
| `contentClass` | Both branches of the popover/drawer content.                 |
| `popoverClass` | Popover branch only (desktop).                               |
| `drawerClass`  | Drawer branch only (mobile).                                 |
| `hintClass`    | The helper line under the field.                             |
| `errorClass`   | The error message under the field.                           |

### Examples

**Custom flag source — use `country-flag-icons`:**

```vue
<script setup lang="ts">
import { ATellInput } from '@alikhalilll/ui';

// Or import from your own SVG sprite, asset folder, CDN, etc.
const flagUrl = (iso2: string) => `/flags/${iso2.toLowerCase()}.svg`;
</script>

<template>
  <ATellInput v-model:phone="phone" v-model:country="country" :flag-url="flagUrl" />
</template>
```

**Curated country list:**

```vue
<script setup lang="ts">
import { ATellInput, type CountryOption } from '@alikhalilll/ui';

const countries: CountryOption[] = [
  {
    value: 'EG',
    label: 'Egypt (+20)',
    search_key: 'egypt eg 20',
    raw_data: {
      iso2: 'EG',
      dial_code: '+20',
      dial_digits: '20',
      name: 'Egypt',
      flag: null,
      source: 'fallback',
      original: {},
    },
  },
  {
    value: 'SA',
    label: 'Saudi Arabia (+966)',
    search_key: 'saudi arabia sa 966',
    raw_data: {
      iso2: 'SA',
      dial_code: '+966',
      dial_digits: '966',
      name: 'Saudi Arabia',
      flag: null,
      source: 'fallback',
      original: {},
    },
  },
];
</script>

<template>
  <ATellInput v-model:phone="phone" v-model:country="country" :countries="countries" />
</template>
```

**Custom server-side detector:**

```vue
<script setup lang="ts">
import { ATellInput } from '@alikhalilll/ui';

// Pretend your backend tells you the user's country from the request IP
async function detector() {
  const res = await $fetch<{ country: string }>('/api/detect-country');
  return res.country; // 'EG' / 'US' / etc.
}
</script>

<template>
  <ATellInput v-model:phone="phone" v-model:country="country" :detector="detector" />
</template>
```

**Re-skin the trigger entirely with the `#trigger` slot:**

```vue
<ATellInput v-model:phone="phone" v-model:country="country">
  <template #trigger="{ selectedCountry, open }">
    <button class="my-custom-trigger" :data-open="open">
      {{ selectedCountry?.raw_data.iso2 ?? '??' }}
      {{ selectedCountry?.raw_data.dial_code ?? '+?' }}
    </button>
  </template>
</ATellInput>
```

**Re-skin each country row:**

```vue
<ATellInput v-model:phone="phone" v-model:country="country">
  <template #item="{ country, selected, disabled, select }">
    <button
      :disabled="disabled"
      :data-selected="selected || undefined"
      class="my-custom-row"
      @click="select"
    >
      <span class="iso">{{ country.raw_data.iso2 }}</span>
      <span class="name">{{ country.raw_data.name }}</span>
      <span class="dial">{{ country.raw_data.dial_code }}</span>
    </button>
  </template>
</ATellInput>
```

## Composing your own variant

::DemoTellInputCompose
::

Every primitive, composable, and helper is re-exported so you don't need to fork the lib to ship a custom phone input. Source:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { AInput, ACountrySelect, usePhoneValidation, cn } from '@alikhalilll/ui';

const country = ref('EG');
const phone = ref('');

const { validate } = usePhoneValidation();
const result = computed(() =>
  validate({
    country: country.value ? { iso2: country.value } : null,
    phone: phone.value || '',
  })
);
</script>

<template>
  <div class="space-y-2">
    <ACountrySelect v-model:selected="country" size="md" />
    <AInput v-model="phone" type="tel" inputmode="numeric" placeholder="National number" />
    <p class="font-mono text-xs">{{ result.full_phone || '+?' }}</p>
  </div>
</template>
```
