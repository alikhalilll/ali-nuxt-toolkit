---
title: ATelInput
description: A headless international telephone input for Vue 3 / Nuxt 3+ — country auto-detect, libphonenumber-js validation, responsive popover/drawer picker, and first-class VeeValidate + Zod integration with server-side validation hooks.
package: '@alikhalilll/a-tel-input'
order: 1
---

# ATelInput

**An international telephone input that gets out of the way.** The field starts as a single clean input — no picker, no clutter — and reveals the country flag the moment your number's dial code is recognised. Numbers validate in real time against `libphonenumber-js`, the picker is a popover on desktop and a bottom-sheet on mobile, and the whole thing plugs straight into VeeValidate + Zod with built-in support for async server-side checks.

::DemoTelInputBasic
::

## Install & Setup

The shipped CSS is self-contained — design tokens + utility classes are pre-compiled. Install the package, register the module (Nuxt) or import the stylesheet (Vue + Vite), and the field renders themed out of the box. No Tailwind config, no `@theme` block.

### Nuxt 3 / 4

::doc-install{pkg="@alikhalilll/a-tel-input"}
::

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-tel-input/nuxt'],
  css: ['@alikhalilll/a-tel-input/styles.css'],
});
```

After the module is registered, `ATelInput`, `ACountrySelect`, and `ACountryFlag` are auto-imported app-wide — no `import` statement required in your `.vue` files.

### Vue + Vite

::doc-install{pkg="@alikhalilll/a-tel-input"}
::

```ts
// main.ts
import '@alikhalilll/a-tel-input/styles.css';
```

For `unplugin-vue-components` auto-resolve, drop in the shipped resolver:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import UiResolver from '@alikhalilll/a-tel-input/resolver';

export default { plugins: [Components({ resolvers: [UiResolver()] })] };
```

### REST Countries v5 (optional)

The component ships with a synchronous country list built from `libphonenumber-js` + `Intl.DisplayNames` — no network, no auth. Pass `restCountriesApiKey` to opt into the v5 fetch (one request per browser, cached in `localStorage` for 30 days):

```ts
// nuxt.config.ts — applies app-wide
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-tel-input/nuxt'],
  aTelInput: { apiKey: 'rc_live_...' },
});
```

Or per-component:

```vue
<ATelInput :rest-countries-api-key="myKey" v-model="phone" />
```

Or for a Vue (non-Nuxt) app, install the defaults once at bootstrap:

```ts
// main.ts
import { createApp } from 'vue';
import { installTelInputDefaults } from '@alikhalilll/a-tel-input';
import App from './App.vue';

const app = createApp(App);
installTelInputDefaults(app, { apiKey: 'rc_live_...' });
app.mount('#app');
```

Per-component props always win over the injected default. Any failure (CORS, network, non-2xx) silently falls back to the offline baseline — never an empty dropdown. CORS requires you to allowlist your origin's hostnames on the REST Countries dashboard.

### Dark mode

Toggle `class="dark"` (or `"light"`) on `<html>` — every component inherits via CSS variables.

```ts
// nuxt.config.ts — locked dark
app: { head: { htmlAttrs: { class: 'dark' } } },
```

> Theming tokens, UnoCSS interplay, monorepo CSS gotcha, full public API — see the [UI overview](/ui).

## Usage in Nuxt

After the module is registered (see above), drop `<ATelInput>` anywhere in a `.vue` file. No `import`, no manual registration — Nuxt's auto-import resolves it for you.

```vue
<script setup lang="ts">
const phone = ref('');
const country = ref<number | null>(null);
</script>

<template>
  <ATelInput v-model:phone="phone" v-model:country="country" show-validation />
</template>
```

Type `+447911123456`, `01066105963`, or paste any well-formed international number — the flag trigger reveals at the end of the field with the detected country, the dial code appears as a prefix inside the input, and `phone` normalises to the national significant number (`7911123456`, `1066105963`).

`v-model:phone` is the **digits-only national number**. `v-model:country` is the **dial-code number** (`20` for Egypt, `44` for the UK, `1` for the NANP block, `null` for none). Prefer a single canonical E.164 value? Use the default `v-model` instead — see [Form integration](#form-integration).

### What's in the box

- **Universal country detection** — debounced parse against the **full libphonenumber metadata (~250 countries)**, with a priority chain (env hint → current → recents → popular shortlist → all countries). Works for international format (`+201066105963`) AND local format (`01066105963` resolves to Egypt even when the env hint is Saudi).
- **libphonenumber-js validation** — seven failure reasons, format hint, E.164 output, all reactive.
- **Responsive picker** — popover on desktop, vaul-vue bottom-sheet on mobile, sticky-safe scroll lock on **both** (the page underneath never scrolls; the picker's inner list does).
- **Form-library ready** — controlled `error` prop, `@blur` event, `useTelField()` composable for VeeValidate, `zPhone()` factory for Zod, plus an in-field spinner for async server-side validation.
- **Two binding contracts** — single `v-model` (E.164 string, drops into VeeValidate's `<Field v-slot="{ field }">` via `v-bind="field"`) or split `v-model:phone` + `v-model:country`. Both stay in sync.
- **i18n + RTL** — country names via `Intl.DisplayNames`, numerals localised in the format hint, RTL inherited from the page, alternative numerals (Arabic-Indic, Persian, Devanagari, Bengali) folded to ASCII on input.
- **Headless slots** for every visual region — trigger, chevron, flag, item, search, hint, error, the lot.
- **Efficient by default** — country list built synchronously from `libphonenumber-js` metadata + `Intl.DisplayNames` — **zero network requests**. Optional one-shot REST Countries v5 upgrade when an `apiKey` is configured, cached in `localStorage` for 30 days. IP geolocation request still deduped to one call per page across every `<ATelInput>` / `<ACountrySelect>` / `useTelField()` / `zPhone()` instance. LRU-cached matcher.
- **SSR-safe** — country detection runs after mount, hydration is clean.
- **TypeScript-first** — every prop, slot, and event typed; web-types ship for JetBrains IDEs.

## Props

| Prop                 | Type                                             | Default                      | Description                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v-model:phone`      | `string`                                         | `''`                         | Digits-only national number — no leading `+`, no dial code.                                                                                                                                                             |
| `v-model:country`    | `number \| null`                                 | `null`                       | Dial number, e.g. `20` (Egypt), `44` (UK), `1` (NANP).                                                                                                                                                                  |
| `name`               | `string`                                         | —                            | Forwarded to the inner `<input name="">` for native form / form-library integration.                                                                                                                                    |
| `error`              | `string \| null`                                 | —                            | Externally controlled error message. When non-empty, overrides internal validation and forces the error state.                                                                                                          |
| `validating`         | `boolean`                                        | `false`                      | `true` while an async validation is in flight. Renders a spinner inside the field (doesn't disable it).                                                                                                                 |
| `validateOn`         | `'change' \| 'blur' \| 'eager'`                  | `'change'`                   | When to surface validation in the UI. `'blur'` is form-library friendly.                                                                                                                                                |
| `placeholder`        | `string`                                         | `'Phone number'`             | Falls back to the country's example number when empty.                                                                                                                                                                  |
| `disabled`           | `boolean`                                        | `false`                      |                                                                                                                                                                                                                         |
| `loading`            | `boolean`                                        | `false`                      | Disables interaction.                                                                                                                                                                                                   |
| `size`               | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`           | `'md'` (43 px)               | Height, padding, text size.                                                                                                                                                                                             |
| `allowedDialCodes`   | `string[]`                                       | _all_                        | Whitelist of dial digits (no `+`). Disallowed countries render disabled.                                                                                                                                                |
| `showValidation`     | `boolean`                                        | `false`                      | Light up the field's validation styling — coloured border + ring + error message — when invalid. Off by default.                                                                                                        |
| `showValidationIcon` | `boolean`                                        | `false`                      | Show the green check / red alert icon at the end of the field. Off by default; independent of `showValidation`.                                                                                                         |
| `detectCountry`      | `'auto' \| 'locale' \| 'none'`                   | `'auto'`                     | Strategy for the silent environment lookup (parsing hint).                                                                                                                                                              |
| `defaultCountry`     | `string`                                         | `''`                         | Initial country. Accepts a dial number string (`'20'`) or ISO2 (`'EG'`). When set, picker is visible at mount.                                                                                                          |
| `detectFromInput`    | `boolean`                                        | `true`                       | Default mode. Set `false` for the legacy always-visible picker.                                                                                                                                                         |
| `detectDebounceMs`   | `number`                                         | `150`                        | Debounce window for input-driven detection (ms).                                                                                                                                                                        |
| `ipEndpoint`         | `string`                                         | `'https://ipapi.co/json/'`   | Override the IP geolocation endpoint.                                                                                                                                                                                   |
| `forceBottomSheet`   | `boolean`                                        | `false`                      | Force the country picker to render as a bottom-sheet drawer regardless of viewport width — desktops get the vaul drawer too. Useful for primarily-mobile flows where the picker should feel modal on every form factor. |
| `searchPlaceholder`  | `string`                                         | `'Search country or +code…'` | Picker search placeholder.                                                                                                                                                                                              |
| `emptyText`          | `string`                                         | `'No countries found.'`      | Shown when search yields no results.                                                                                                                                                                                    |
| `loadingText`        | `string`                                         | `'Loading countries…'`       | Shown while the country list loads.                                                                                                                                                                                     |
| `errorMessages`      | `Partial<Record<PhoneValidationReason, string>>` | English defaults             | Override the validation error labels.                                                                                                                                                                                   |
| `dir`                | `'ltr' \| 'rtl' \| 'auto'`                       | `'auto'` (inherits)          | Text direction. `'auto'` / omitted inherits from the page; `'ltr'` / `'rtl'` force it.                                                                                                                                  |
| `locale`             | `string`                                         | —                            | BCP-47 locale. Localises country names (`Intl.DisplayNames`) and the format-hint numerals.                                                                                                                              |
| `messages`           | `TelInputMessages` (partial)                     | English defaults             | One bag for every UI string — picker, error labels, and a11y labels. See [Internationalization](#internationalization).                                                                                                 |
| `class`              | `HTMLAttributes['class']`                        | —                            | Merged into the outer wrapper.                                                                                                                                                                                          |

## Exposed via template ref

```ts
const tellRef = ref<InstanceType<typeof ATelInput>>();
tellRef.value.validation; // PhoneValidationResult — reactive
tellRef.value.required; // PhoneRequiredInfo | null — example, length range, format hint
tellRef.value.selectedDialCode; // '+20' | null
tellRef.value.validationState; // 'idle' | 'valid' | 'error'

tellRef.value.focus(); // imperative focus management
tellRef.value.blur();
tellRef.value.select();
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

## Form integration

The component supports two binding contracts:

- **Single `v-model`** carrying the canonical **E.164** string — works directly with VeeValidate's `<Field v-slot="{ field }">`, native `<form>` submission, and any `v-model="phoneE164"` consumer.
- **Split `v-model:phone` + `v-model:country`** — when you want the raw digits and the dial code as separate values. Stays in sync with the single-string contract; pick whichever fits.

Two subpath entries also ship for first-class **VeeValidate** + **Zod** integration, including async / server-side validation:

::doc-install{pkgs="vee-validate @vee-validate/zod zod"}
::

### Drop-in `<Field v-slot="{ field, errors }">` — `v-bind="field"` just works

Use VeeValidate's slot-style `<Field>` exactly the way you would with a native `<Input>`. The component's default `v-model` is the E.164 string, so Vue auto-spreads `field.modelValue`, `field['onUpdate:modelValue']`, `field.name`, and `field.onBlur` straight through:

```vue
<script setup lang="ts">
import { useForm, Field as VeeField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { ATelInput } from '@alikhalilll/a-tel-input';
import { zPhone } from '@alikhalilll/a-tel-input/zod';

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: zPhone() })),
});
</script>

<template>
  <form @submit="handleSubmit(onSubmit)">
    <VeeField v-slot="{ field, errors }" name="phone">
      <label for="phone">Phone</label>
      <ATelInput
        id="phone"
        v-bind="field"
        :error="errors[0]"
        :aria-invalid="!!errors.length"
        default-country="SA"
        show-validation
      />
    </VeeField>
    <button type="submit">Submit</button>
  </form>
</template>
```

That's the whole integration. No `useTelField()`, no manual `handleBlur`, no extra glue.

### `useTelField()` — when you need async / server-side validation

::DemoTelInputVeeValidate
::

`useTelField(name, options)` (from `@alikhalilll/a-tel-input/vee-validate`) owns the two v-models (`phone` + `country`), composes them into an E.164 string for VeeValidate's schema, and returns a ready-to-bind prop bag. Pair it with `zPhone()` for a Zod schema that shares the same `libphonenumber-js` engine the component uses — schema and field can never disagree.

Server-side checks ride the schema via `z.refine(async)` — vee-validate ignores field-level rules when `useForm` has a `validationSchema`, so the refine is what `handleSubmit` awaits and what drives `useTelField`'s `validating` ref (→ in-field spinner).

```ts
import { useTelField } from '@alikhalilll/a-tel-input/vee-validate';
import { zPhone } from '@alikhalilll/a-tel-input/zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const phoneSchema = zPhone().refine(
  async (value) => {
    if (!value) return true;
    const { exists } = await $fetch('/api/phone/exists', { query: { phone: value } });
    return !exists;
  },
  { message: 'This phone number is already registered.' }
);

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: phoneSchema })),
});

const { phone, country, error, handleBlur, fieldProps, validating } = useTelField('phone', {
  validateOn: 'blur',
  defaultCountry: 'SA',
});
```

```vue
<ATelInput
  v-model:phone="phone"
  v-model:country="country"
  v-bind="fieldProps"
  :error="error"
  :validating="validating"
  show-validation
  @blur="handleBlur"
/>
```

### Anatomy

- **`error` prop** — externally controlled error message. When set, it forces the field into the error state and replaces internal libphonenumber validation. Wire it from any source — VeeValidate, Zod, a server response, a custom validator.
- **`validating` prop** — `true` while an async rule is in flight. Renders a small spinner inside the field and sets `aria-busy="true"`. Doesn't disable the input (use `loading` for that).
- **`validateOn` prop** — `'change'` (default, current behaviour), `'blur'` (stays idle until first blur — form-library friendly), or `'eager'` (no typing pause).
- **`name` prop** — forwards to the inner `<input name="">` for native `<form>` submission.
- **`@blur` / `@focus` emits** — mirror the inner input's native events.
- **Exposed methods** — `tellRef.value?.focus()`, `.blur()`, `.select()` for imperative focus management after submit-fail.

### Zod schema shapes

`zPhone()` returns a `z.ZodType<string>` that validates an E.164 string:

```ts
z.object({ phone: zPhone() }); // input: '+201066105963'
z.object({ phone: zPhone({ country: 'SA' }) }); // input: national digits, validated as SA
z.object({ phone: zPhone({ allowedDialCodes: ['20', '966'] }) }); // restrict to EG + SA
```

Or use `zPhoneObject()` when you want to validate the `{ phone, country }` shape directly:

```ts
import { zPhoneObject } from '@alikhalilll/a-tel-input/zod';

const schema = z.object({
  contact: zPhoneObject({ requiredMessage: 'Phone number is required.' }),
});
```

### Native HTML forms

```vue
<form>
  <ATelInput v-model:phone="phone" v-model:country="country" name="phone" />
</form>
```

`name` is forwarded to the inner `<input>`, so FormData picks the value up automatically. The submitted value is the digits-only national number; compose the E.164 via `usePhoneValidation()` when needed.

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

| Slot            | Scope                                       | Replaces                                                                  |
| --------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `prefix`        | —                                           | Content at the start of the field.                                        |
| `suffix`        | `{ validationState, validation }`           | Content at the end, after the flag trigger.                               |
| `trigger`       | `{ selectedCountry, open, sizeClasses }`    | Entire country picker trigger.                                            |
| `chevron`       | `{ open }`                                  | Just the chevron icon.                                                    |
| `selected-flag` | `{ country, open }`                         | Selected-state label rendered inside the **trigger only**.                |
| `item-flag`     | `{ country }`                               | Flag rendered for each **popover option row** only.                       |
| `flag`          | `{ country, context: 'trigger' \| 'item' }` | Legacy unified flag slot — fires for both locations¹.                     |
| `search`        | `{ value, setValue, isSearching }`          | Entire search bar.                                                        |
| `search-icon`   | —                                           | Just the leading search icon.                                             |
| `loading`       | —                                           | Picker loading state.                                                     |
| `empty`         | `{ query }`                                 | Empty / no-results state.                                                 |
| `detecting`     | —                                           | Spinner shown in the picker slot during the typing-pause debounce window. |
| `group-header`  | `{ label, group: 'suggested' \| 'all' }`    | Section headers in the picker.                                            |
| `item`          | `{ country, selected, disabled, select }`   | Entire row in the country list.                                           |
| `item-check`    | `{ country }`                               | Right-side check icon for selected row.                                   |
| `valid-icon`    | —                                           | Green check shown when valid.                                             |
| `error-icon`    | `{ reason }`                                | Warning icon shown when invalid.                                          |
| `hint`          | `{ country, formatHint, example }`          | Helper line shown below when empty.                                       |
| `error`         | `{ message, reason, validation }`           | Error message shown below when invalid.                                   |

¹ Prefer `selected-flag` / `item-flag` over the legacy unified `flag` slot — they
target one location at a time so a trigger restyling doesn't bleed into the popover
list. `flag` is kept as a back-compat fallback (and is what fires when neither
of the dedicated slots is provided).

### Data props

| Prop                   | Type                                             | Replaces                                                         |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `flagUrl`              | `(iso2, width) => string`                        | Default `flagcdn.com` URL builder.                               |
| `countries`            | `CountryOption[]`                                | Internal libphonenumber-derived list (curated or offline lists). |
| `restCountriesApiKey`  | `string`                                         | Opt-in REST Countries v5 fetch (one request, cached 30 days).    |
| `searcher`             | `(query, country) => boolean`                    | Default substring match. Implement fuzzy / starts-with / etc.    |
| `detector`             | `(opts) => Promise<string \| null>`              | The environment chain. Return `null` to fall through.            |
| `errorMessages`        | `Partial<Record<PhoneValidationReason, string>>` | Error labels (for i18n).                                         |
| `kbdOpen` / `kbdClose` | `string \| null`                                 | The `⌘K` / `Esc` keyboard hints. `null` to hide.                 |

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
    <input v-model="phone" type="tel" inputmode="numeric" placeholder="National number" />
    <p class="font-mono text-xs">{{ result.full_phone || '+?' }}</p>
  </div>
</template>
```
