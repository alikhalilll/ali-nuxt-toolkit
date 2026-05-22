# `@alikhalilll/ui/tell-input`

Vue 3 phone-number input with smart country detection (libphonenumber-js + IP/timezone/locale hint), a responsive popover/drawer country picker, and a structured `PhoneValidationResult` exposed via template ref. RTL-aware, localisable, and accepts alternative numeral systems.

## Install

```bash
pnpm add @alikhalilll/ui
```

```ts
import { ATellInput } from '@alikhalilll/ui/tell-input';
import '@alikhalilll/ui/styles.css';
```

The subpath import loads only this component's chunk — none of the other `@alikhalilll/ui` components ship into the consumer's bundle.

## Usage

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

The default shape is a plain phone input with the country picker hidden. As the user types or pastes, detection runs (debounced) against known dial codes; on first match a flag-only trigger reveals at the **end** of the field, the dial code shows as a static prefix inside the input, and `phone` is normalised to the national significant number — `01066105963` becomes `1066105963`, `+447911123456` becomes `7911123456`.

## Internationalization

- **RTL** — direction inherits from the page (`<div dir="rtl">` / `<html dir="rtl">`), or force it with `dir="ltr"` / `dir="rtl"`. The phone field row stays LTR (dial prefix → digits → flag); only the helper/error text and the country popover follow the page direction.
- **`locale`** — localises country names (`Intl.DisplayNames`) and the format-hint numerals.
- **`messages`** — one bag for every UI string (picker labels, validation errors, a11y labels).
- **Alternative numerals** — digits typed as Arabic-Indic (`٠-٩`), Persian (`۰-۹`), Devanagari, or Bengali are normalised to ASCII. `normalizeDigits` is exported for standalone use.

```vue
<template>
  <div dir="rtl">
    <ATellInput v-model:phone="phone" v-model:country="country" locale="ar" :messages="ar" />
  </div>
</template>
```

## Variants

- **Picker pre-filled** — pass `default-country="…"` or seed `v-model:country` so the picker renders visible at mount.
- **Restricted countries** — pass `allowed-dial-codes` (array of dial-digit strings, no `+`). Whitelisted countries surface in the Suggested group at the top; disallowed countries render below as disabled.
- **Always-visible picker (legacy)** — `:detect-from-input="false"` reverts to the IP/timezone/locale chain auto-filling the picker on mount.

## Exposed via template ref

```ts
const ref = ref<InstanceType<typeof ATellInput>>();
ref.value.validation; // PhoneValidationResult — reactive
ref.value.required; // PhoneRequiredInfo | null — example, length range, format hint
ref.value.selectedDialCode; // '+20' | null
ref.value.validationState; // 'idle' | 'valid' | 'error'
```

Full prop reference, customization recipes, slot catalogue, and theming guide live in the [main library docs](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/tell-input).
