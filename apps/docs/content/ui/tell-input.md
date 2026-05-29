---
title: ATelInput
description: Phone-number input with smart country detection, libphonenumber-js validation, and a responsive popover/drawer picker.
package: '@alikhalilll/a-tel-input'
order: 1
---

# ATelInput

A composite phone input. Hides the country picker until your input matches a known dial code, then reveals it pre-filled with the detected country. The picker sits at the **end** of the field as a flag-only trigger; the selected dial code shows as a static prefix inside the input. `v-model:phone` holds the digits-only national number; `v-model:country` holds the **dial number** (`20` for Egypt, `44` for the UK, `1` for the NANP block, `null` for no selection).

The field is direction-aware (RTL inherits from the page), country names and numerals localise via the `locale` prop, and digits typed in alternative numeral systems (Arabic-Indic `٠-٩`, Persian `۰-۹`, Devanagari, Bengali) are accepted and normalised to ASCII. See [Internationalization](#internationalization).

::DemoTelInputBasic
::

## Install

```bash
pnpm add @alikhalilll/a-tel-input
```

```ts
import { ATelInput } from '@alikhalilll/a-tel-input'; // tree-shaken subpath
// or: import { ATelInput } from '@alikhalilll/a-tel-input';
```

First time using `@alikhalilll/a-tel-input`? Run the [one-time setup](/ui#setup).

## Usage

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

Type `+447911123456`, `01066105963`, or paste any well-formed international number — the flag trigger reveals at the end of the field with the detected country, the dial code appears as a prefix inside the input, and `phone` normalises to the national significant number (`7911123456`, `1066105963`).

## Props

| Prop                 | Type                                             | Default                      | Description                                                                                                             |
| -------------------- | ------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `v-model:phone`      | `string`                                         | `''`                         | Digits-only national number — no leading `+`, no dial code.                                                             |
| `v-model:country`    | `number \| null`                                 | `null`                       | Dial number, e.g. `20` (Egypt), `44` (UK), `1` (NANP).                                                                  |
| `placeholder`        | `string`                                         | `'Phone number'`             | Falls back to the country's example number when empty.                                                                  |
| `disabled`           | `boolean`                                        | `false`                      |                                                                                                                         |
| `loading`            | `boolean`                                        | `false`                      | Disables interaction.                                                                                                   |
| `size`               | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`           | `'md'` (43 px)               | Height, padding, text size.                                                                                             |
| `allowedDialCodes`   | `string[]`                                       | _all_                        | Whitelist of dial digits (no `+`). Disallowed countries render disabled.                                                |
| `showValidation`     | `boolean`                                        | `false`                      | Light up the field's validation styling — coloured border + ring + error message — when invalid. Off by default.        |
| `showValidationIcon` | `boolean`                                        | `false`                      | Show the green check / red alert icon at the end of the field. Off by default; independent of `showValidation`.         |
| `detectCountry`      | `'auto' \| 'locale' \| 'none'`                   | `'auto'`                     | Strategy for the silent environment lookup (parsing hint).                                                              |
| `defaultCountry`     | `string`                                         | `''`                         | Initial country. Accepts a dial number string (`'20'`) or ISO2 (`'EG'`). When set, picker is visible at mount.          |
| `detectFromInput`    | `boolean`                                        | `true`                       | Default mode. Set `false` for the legacy always-visible picker.                                                         |
| `detectDebounceMs`   | `number`                                         | `150`                        | Debounce window for input-driven detection (ms).                                                                        |
| `ipEndpoint`         | `string`                                         | `'https://ipapi.co/json/'`   | Override the IP geolocation endpoint.                                                                                   |
| `searchPlaceholder`  | `string`                                         | `'Search country or +code…'` | Picker search placeholder.                                                                                              |
| `emptyText`          | `string`                                         | `'No countries found.'`      | Shown when search yields no results.                                                                                    |
| `loadingText`        | `string`                                         | `'Loading countries…'`       | Shown while the country list loads.                                                                                     |
| `errorMessages`      | `Partial<Record<PhoneValidationReason, string>>` | English defaults             | Override the validation error labels.                                                                                   |
| `dir`                | `'ltr' \| 'rtl' \| 'auto'`                       | `'auto'` (inherits)          | Text direction. `'auto'` / omitted inherits from the page; `'ltr'` / `'rtl'` force it.                                  |
| `locale`             | `string`                                         | —                            | BCP-47 locale. Localises country names (`Intl.DisplayNames`) and the format-hint numerals.                              |
| `messages`           | `TelInputMessages` (partial)                     | English defaults             | One bag for every UI string — picker, error labels, and a11y labels. See [Internationalization](#internationalization). |
| `class`              | `HTMLAttributes['class']`                        | —                            | Merged into the outer wrapper.                                                                                          |

## Exposed via template ref

```ts
const tellRef = ref<InstanceType<typeof ATelInput>>();
tellRef.value.validation; // PhoneValidationResult — reactive
tellRef.value.required; // PhoneRequiredInfo | null — example, length range, format hint
tellRef.value.selectedDialCode; // '+20' | null
tellRef.value.validationState; // 'idle' | 'valid' | 'error'
```

## Sizes

::DemoTelInputSizes
::

Five sizes — `xs` 28 / `sm` 36 / `md` **43 default** / `lg` 52 / `xl` 60 px. See [Size scale](/ui#size-scale) for the shared exported maps.

## Validation

::DemoTelInputValidation
::

Validation runs on every keystroke via `usePhoneValidation()` (a `libphonenumber-js` wrapper) and produces:

```ts
interface PhoneValidationResult {
  ok: boolean;
  reason: PhoneValidationReason | null;
  country: { iso2: string; dial_code: string } | null;
  phone: { raw: string | null; digits: string };
  full_phone: string | null; // E.164, e.g. '+201066105963'
  required: PhoneRequiredInfo | null;
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

Localise the messages with `errorMessages`:

```vue
<ATelInput
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

### From the environment (silent)

On mount, the component runs an IP → timezone → locale chain (default strategy `'auto'`) and stores the result as a **hint** for the input parser. It does not auto-fill the picker.

| `detectCountry` value | Behaviour                            |
| --------------------- | ------------------------------------ |
| `'auto'` (default)    | IP → timezone → locale → default     |
| `'locale'`            | Skip IP. Timezone → locale → default |
| `'none'`              | Use `defaultCountry` immediately     |

Run detection imperatively from anywhere:

```ts
import { detectCountry } from '@alikhalilll/a-tel-input';

const iso2 = await detectCountry({ strategy: 'auto', defaultCountry: 'EG' });
```

### From user input (default)

::DemoTelInputDetectFromInput
::

`detect-from-input` is `true` by default. The picker is hidden until typing or pasting matches a known dial code — debounced by `detectDebounceMs` (default 150 ms). On match, the picker reveals and `phone` is normalised to the national significant number (dial code + national prefix stripped).

```vue
<!-- Default — picker hidden until detected -->
<ATelInput v-model:phone="phone" v-model:country="country" show-validation />

<!-- Variants -->
<ATelInput default-country="20" />
<!-- Pre-filled picker -->
<ATelInput v-model:country="myInitial" />
<!-- Pre-filled via v-model -->
<ATelInput :detect-from-input="false" />
<!-- Legacy always-visible picker -->
```

Behaviour:

- Local formats like Egyptian `01066105963` or UK `07911123456` work — once the typed number is fully valid for the hinted country (from the environment chain or `defaultCountry`), the picker reveals.
- Multi-country dial codes (`+1` NANP, `+7` RU/KZ) tiebreak by recents → alphabetical.
- A manual pick freezes detection. Clearing the input resets and re-arms it.
- **Known limitation:** raw-digit input is fundamentally ambiguous. Typing `415` resolves to Switzerland (`+41 5…`), not the US area code. For region-locked apps, pass `default-country` instead.

### Typing-pause UX

While the user is mid-burst, the component holds back validation styling and shows a small spinner in the picker slot — both unblock once `detectDebounceMs` settles. After a failed detection (no dial code recognised), the picker becomes visible with no country selected so the user can pick manually instead of being stranded.

- **Spinner during the debounce window** — replaceable via the `#detecting` slot. It only appears during the _first_ detection attempt; once the picker has rendered (success or revealed-after-miss) the spinner stops re-flashing on every keystroke.
- **Validation gated by `hasFinishedTyping`** — field tinting (`showValidation`), the validation icon (`showValidationIcon`), the `aria-invalid` attribute, and the error message all stay neutral until the debounce settles. The raw `validationState` is still exposed via the template ref for consumers that want eager state.
- **Picker reveals after a no-match attempt** — driven by an internal `detectionAttempted` flag. The picker won't disappear again until the input is cleared.
- **Programmatic `v-model:phone` changes bypass the gate** — a parent setting `phone` is a committed value, not active typing, so validation surfaces immediately.

Exposed via template ref alongside the existing `validation` / `validationState` / `required` / `selectedDialCode`: `visibleValidationState`, `isDetecting`, `hasFinishedTyping`, `detectionAttempted`.

## Internationalization

`ATelInput` is built for non-English, RTL, and non-ASCII-numeral users.

### RTL

::DemoTelInputRtl
::

The component is direction-aware. Omit `dir` (or pass `'auto'`) and direction inherits from
the page — wrap the component in `<div dir="rtl">` or set `<html dir="rtl">`. Pass
`dir="ltr"` / `dir="rtl"` to force a direction regardless of the page.

The **field row itself always stays left-to-right** — the dial-code prefix, the digits, and
the flag trigger keep the same order in every direction, because a phone number is
inherently LTR content. What follows the page direction is the surrounding chrome: the
helper/error line aligns to the page direction, and the country-picker popover (its search
bar and list rows) mirrors. So an RTL page gets correctly-aligned Arabic helper text and a
mirrored picker, without scrambling the phone field.

### Alternative numerals

Digits entered in another script are accepted and normalised to ASCII — typing the
Arabic-Indic `٠١٠٦٦١٠٥٩٦٣` or the Persian `۰۹۱۲۳۴۵۶۷۸` is the same as typing the ASCII
equivalent. Detection, validation, and `v-model:phone` always work with ASCII digits.
Supported systems: Arabic-Indic (`٠-٩`), Extended/Eastern Arabic — Persian & Urdu (`۰-۹`),
Devanagari, and Bengali.

```ts
import { normalizeDigits } from '@alikhalilll/a-tel-input';

normalizeDigits('٠١٠٦٦'); // → '01066'
```

### Locale & messages

::DemoTelInputI18n
::

Pass a `locale` and a `messages` bag to fully localise the component:

```vue
<template>
  <div dir="rtl">
    <ATelInput
      v-model:phone="phone"
      v-model:country="country"
      locale="ar"
      default-country="20"
      show-validation
      :messages="{
        searchPlaceholder: 'ابحث عن دولة أو +رمز…',
        emptyText: 'لا توجد دول.',
        loadingText: 'جارٍ تحميل الدول…',
        suggestedLabel: 'مقترحة',
        allCountriesLabel: 'كل الدول',
        phoneInputLabel: 'رقم الهاتف',
        selectCountryLabel: 'اختر دولة',
        errorMessages: {
          too_short: 'الرقم قصير جدًا',
          invalid_phone: 'الرقم غير صحيح',
        },
      }"
    />
  </div>
</template>
```

- `locale` localises country names via `Intl.DisplayNames` (search matches both the
  localised and English spelling) and renders the format-hint numerals in that locale.
- `messages` bundles every UI string — picker labels, validation errors, and screen-reader
  labels — into one prop. Every key is optional and falls back to its English default.
- The individual props (`searchPlaceholder`, `emptyText`, `loadingText`, `errorMessages`)
  still work and take precedence over the matching `messages` key.

### Accessibility

The phone input carries an `aria-label` (`messages.phoneInputLabel`), `aria-invalid` when
the number fails validation, and an `aria-describedby` pointing at the live helper line.
The hint and error share an `aria-live="polite"` region, so screen readers announce
validation changes. The country trigger and every list option are keyboard-reachable and
labelled.

## Restricting countries

::DemoTelInputAllowed
::

```vue
<ATelInput
  v-model:phone="phone"
  v-model:country="country"
  :allowed-dial-codes="['20', '971', '966']"
  default-country="20"
/>
```

Disallowed countries still render in the picker but as disabled rows. The whitelist surfaces in the **Suggested** group at the top so the user doesn't scroll.

## Theming

::DemoTelInputThemes
::

The component is themed entirely with the shared `--ak-ui-*` CSS variables — no component props, no rebuild. Three placement patterns:

```css
/* 1. Global override — every instance */
:root {
  --ak-ui-ring: 215 100% 70%;
  --ak-ui-accent: 215 50% 25%;
}

/* 2. Scoped class — per section / tenant */
.tenant-acme {
  --ak-ui-ring: 155 70% 50%;
}

/* 3. Inline — rapid prototyping (write straight on a wrapper :style) */
```

Values are HSL **triplets** (no `hsl(…)` wrapper). Full token list and recipes live in [the library theming guide](/ui#theming).

### Brand-color via a single hue

::DemoTelInputBrandPicker
::

Vary lightness on one hue: `7%` (background) → `9%` (popover) → `14%` (muted) → `18%` (border) → `22%` (accent) → `60%+` (ring). The component handles the rest.

### Day / night

::DemoTelInputDayNight
::

The lib ships both `.light` and `.dark` blocks — toggle the class on `<html>` (or any wrapper). Portaled popovers/drawers inherit via the cascade.

### Multi-tenant

::DemoTelInputMultiTenant
::

```css
.tenant-acme {
  --ak-ui-popover: 155 50% 8%;
  --ak-ui-accent: 152 60% 30%;
  --ak-ui-ring: 152 70% 50%;
}
.tenant-nova {
  --ak-ui-popover: 270 40% 8%;
  --ak-ui-accent: 270 50% 30%;
  --ak-ui-ring: 270 90% 65%;
}
```

### Radius variants

`--ak-ui-radius` is consumed directly (no Tailwind token):

```css
.compact {
  --ak-ui-radius: 0.25rem;
}
.pill {
  --ak-ui-radius: 999px;
}
```

## Full customisation

::DemoTelInputCustomPillCream
::

Three customisation vectors — stack any combination:

### Slots

| Slot           | Scope                                       | Replaces                                                                  |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `prefix`       | —                                           | Content at the start of the field.                                        |
| `suffix`       | `{ validationState, validation }`           | Content at the end, after the flag trigger.                               |
| `trigger`      | `{ selectedCountry, open, sizeClasses }`    | Entire country picker trigger.                                            |
| `chevron`      | `{ open }`                                  | Just the chevron icon.                                                    |
| `flag`         | `{ country, context: 'trigger' \| 'item' }` | Flag rendering (trigger + list items).                                    |
| `search`       | `{ value, setValue, isSearching }`          | Entire search bar.                                                        |
| `search-icon`  | —                                           | Just the leading search icon.                                             |
| `loading`      | —                                           | Picker loading state.                                                     |
| `empty`        | `{ query }`                                 | Empty / no-results state.                                                 |
| `detecting`    | —                                           | Spinner shown in the picker slot during the typing-pause debounce window. |
| `group-header` | `{ label, group: 'suggested' \| 'all' }`    | Section headers in the picker.                                            |
| `item`         | `{ country, selected, disabled, select }`   | Entire row in the country list.                                           |
| `item-check`   | `{ country }`                               | Right-side check icon for selected row.                                   |
| `valid-icon`   | —                                           | Green check shown when valid.                                             |
| `error-icon`   | `{ reason }`                                | Warning icon shown when invalid.                                          |
| `hint`         | `{ country, formatHint, example }`          | Helper line shown below when empty.                                       |
| `error`        | `{ message, reason, validation }`           | Error message shown below when invalid.                                   |

### Data props

| Prop                   | Type                                             | Replaces                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| `flagUrl`              | `(iso2, width) => string`                        | Default `flagcdn.com` URL builder.                            |
| `countries`            | `CountryOption[]`                                | Internal REST Countries fetch (curated or offline lists).     |
| `searcher`             | `(query, country) => boolean`                    | Default substring match. Implement fuzzy / starts-with / etc. |
| `detector`             | `(opts) => Promise<string \| null>`              | The environment chain. Return `null` to fall through.         |
| `errorMessages`        | `Partial<Record<PhoneValidationReason, string>>` | Error labels (for i18n).                                      |
| `kbdOpen` / `kbdClose` | `string \| null`                                 | The `⌘K` / `Esc` keyboard hints. `null` to hide.              |

### Class props

`class`, `fieldClass`, `inputClass`, `contentClass`, `popoverClass`, `drawerClass`, `hintClass`, `errorClass`. Each is merged via `tailwind-merge` so you only override the bits you want.

### Live gallery

::DemoTelInputCustomBank
::

::DemoTelInputCustomPlayful
::

::DemoTelInputCustomMinimal
::

Stacking every vector — curated countries, hi-res flags, custom searcher, custom detector, slot overrides:

::DemoTelInputCustomization
::

## Composing your own variant

::DemoTelInputCompose
::

Every primitive, composable, and helper is re-exported — fork-free composition:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { AInput } from '@alikhalilll/a-input';
import { ACountrySelect, usePhoneValidation } from '@alikhalilll/a-tel-input';

const country = ref('EG');
const phone = ref('');

const { validate } = usePhoneValidation();
const result = computed(() =>
  validate({ country: country.value ? { iso2: country.value } : null, phone: phone.value || '' })
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
