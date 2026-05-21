# `@alikhalilll/ui/tell-input`

Vue 3 phone-number input with smart country detection (libphonenumber-js + IP/timezone/locale hint), a responsive popover/drawer country picker, and a structured `PhoneValidationResult` exposed via template ref.

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

The default shape is a plain phone input with the country picker hidden. As the user types or pastes, detection runs (debounced) against known dial codes; on first match the picker slides in pre-filled and `phone` is normalised to the national significant number — `01066105963` becomes `1066105963`, `+447911123456` becomes `7911123456`.

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
