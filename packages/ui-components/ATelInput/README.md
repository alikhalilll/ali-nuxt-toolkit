# @alikhalilll/a-tel-input

Headless, [shadcn-vue](https://www.shadcn-vue.com) style Vue 3 **international telephone input**.
Detects the country from what the user types (debounced, NANP-aware via
[`libphonenumber-js`](https://github.com/catamphetamine/libphonenumber-js)), validates + formats the
number, and offers a country picker that's a **popover on desktop / drawer on mobile**. RTL, i18n,
and alternative-numeral (Arabic-Indic, Persian, Devanagari, Bengali) input all work out of the box.

Components: **`ATelInput`** · **`ACountrySelect`** · **`ACountryFlag`**.

## Install

```bash
pnpm add @alikhalilll/a-tel-input
```

(Pulls in `@alikhalilll/a-responsive-popover` → `a-popover` + `a-drawer` + `a-ui-base` automatically.)

## Styles

The picker renders the popover/drawer, so import their stylesheets plus the shared tokens:

```ts
import '@alikhalilll/a-ui-base/tokens.css';
import '@alikhalilll/a-popover/styles.css';
import '@alikhalilll/a-drawer/styles.css';
import '@alikhalilll/a-tel-input/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);
</script>

<template>
  <ATelInput v-model:phone="phone" v-model:country="country" default-country="SA" show-validation />
</template>
```

By default the picker is hidden and reveals once a leading dial code is detected from typing. Pass
`default-country` (ISO2 like `"EG"` or a dial code like `"20"`) to show it pre-selected, or
`:detect-from-input="false"` for the legacy always-visible picker.

## API

### Key props

| Prop                                  | Type                           | Default  | Description                                              |
| ------------------------------------- | ------------------------------ | -------- | -------------------------------------------------------- |
| `phone`                               | `string`                       | —        | `v-model:phone` — the raw national number.               |
| `country`                             | `number \| null`               | —        | `v-model:country` — selected dial code.                  |
| `defaultCountry`                      | `string`                       | —        | Initial country: ISO2 (`"EG"`) or dial code (`"20"`).    |
| `detectCountry`                       | `DetectionStrategy`            | `auto`   | Silent IP → timezone → `navigator.language` hint.        |
| `detectFromInput`                     | `boolean`                      | `true`   | Reveal the picker on first dial-code match while typing. |
| `detectDebounceMs`                    | `number`                       | —        | Debounce for input-based detection.                      |
| `allowedDialCodes`                    | `string[]`                     | —        | Whitelist of dial codes; others render disabled.         |
| `size`                                | `Size` (`xs`–`xl`)             | `md`     | Control size.                                            |
| `dir`                                 | `'ltr' \| 'rtl' \| 'auto'`     | `auto`   | Text direction (inherits from the page by default).      |
| `locale`                              | `string`                       | —        | BCP-47 locale for country names + numerals.              |
| `messages`                            | `TelInputMessagesInput`        | —        | Localize every UI string in one bag.                     |
| `showValidation`                      | `boolean`                      | `false`  | Colour the field border/ring by validity.                |
| `showValidationIcon`                  | `boolean`                      | `false`  | Show the valid/error icon at the field end.              |
| `disabled` / `loading`                | `boolean`                      | `false`  | Field state.                                             |
| `flagUrl`                             | `(iso2, width) => string`      | —        | Override the flag image source.                          |
| `countries` / `searcher` / `detector` | —                              | —        | Override the data sources.                               |
| `ipEndpoint`                          | `string`                       | —        | Override the IP-geolocation endpoint.                    |
| `scrollLock`                          | `'events' \| 'body' \| 'none'` | `events` | Desktop scroll-lock behaviour of the picker.             |

Class hooks: `class`, `fieldClass`, `inputClass`, `contentClass`, `popoverClass`, `drawerClass`,
`hintClass`, `errorClass`. Full prop/type reference:
[docs](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/tell-input).

### Events

| Event            | Payload          |
| ---------------- | ---------------- |
| `update:phone`   | `string`         |
| `update:country` | `number \| null` |

### Slots

Every visual region is a slot, so you can recompose the field entirely:
`prefix`, `suffix`, `trigger`, `chevron`, `flag`, `search`, `loading`, `empty`, `detecting`,
`group-header`, `item`, `valid-icon`, `error-icon`, `hint`, `error`. Slots receive typed context —
e.g. `error` gets `{ message, reason, validation }`, `flag` gets `{ country, context }`.

### Composables & helpers (also exported)

`usePhoneValidation`, `useCountryDetection`, `useCountryMatching`, `useTypingPhase`,
`useTelInputValidation`, `normalizeDigits`, `LOCALE_DIGIT_RANGES`, `defaultFlagUrl`,
`aTelInputVariants`, `DEFAULT_MESSAGES`, `resolveMessages` — compose your own field from the same
primitives `ATelInput` uses (see `ACountrySelect` / `AInput`).

## Auto-import

**Nuxt:**

```ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-tel-input/nuxt'],
  css: [
    '@alikhalilll/a-ui-base/tokens.css',
    '@alikhalilll/a-popover/styles.css',
    '@alikhalilll/a-drawer/styles.css',
    '@alikhalilll/a-tel-input/styles.css',
  ],
});
```

**Vite:** register `@alikhalilll/a-tel-input/resolver` in `unplugin-vue-components`.

## SSR

Country detection runs only in `onMounted` — the field renders immediately with `defaultCountry`
(or empty), and IP/timezone/locale resolution patches in on hydration. No SSR network calls.

## License

MIT
