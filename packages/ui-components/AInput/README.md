# @alikhalilll/a-input

Headless, [shadcn-vue](https://www.shadcn-vue.com) style Vue 3 text input with `prefix` / `suffix`
slots and the shared size scale. Drop-in for a native `<input>` — when no adornment slots are
filled it renders the bare input; otherwise it renders a bordered bar that owns the focus ring.

## Install

```bash
pnpm add @alikhalilll/a-input
```

## Styles

Import the shared tokens once (anywhere in your app) and this component's stylesheet:

```ts
import '@alikhalilll/a-ui-base/tokens.css';
import '@alikhalilll/a-input/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { AInput } from '@alikhalilll/a-input';

const email = ref('');
</script>

<template>
  <AInput v-model="email" size="md" placeholder="you@example.com">
    <template #prefix>@</template>
  </AInput>
</template>
```

## API

### Props

| Prop           | Type                      | Default | Description                                               |
| -------------- | ------------------------- | ------- | --------------------------------------------------------- |
| `modelValue`   | `string \| number`        | —       | `v-model` value.                                          |
| `defaultValue` | `string \| number`        | —       | Initial value when uncontrolled.                          |
| `size`         | `Size` (`xs`–`xl`)        | `md`    | Control height / padding / text size.                     |
| `class`        | `HTMLAttributes['class']` | —       | Class on the outer element.                               |
| `inputClass`   | `HTMLAttributes['class']` | —       | Class on the inner `<input>` (useful with prefix/suffix). |
| `prefixClass`  | `HTMLAttributes['class']` | —       | Class on the prefix wrapper.                              |
| `suffixClass`  | `HTMLAttributes['class']` | —       | Class on the suffix wrapper.                              |

Any other native `<input>` attribute (`placeholder`, `disabled`, `type`, …) is forwarded.

### Slots

| Slot     | Description                                    |
| -------- | ---------------------------------------------- |
| `prefix` | Content inside the border, left of the field.  |
| `suffix` | Content inside the border, right of the field. |

### Events

| Event               | Payload            | Description                   |
| ------------------- | ------------------ | ----------------------------- |
| `update:modelValue` | `string \| number` | Emitted on input (`v-model`). |

## Auto-import

**Nuxt** — add the module; `<AInput>` resolves without an explicit import:

```ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-input/nuxt'],
  css: ['@alikhalilll/a-ui-base/tokens.css', '@alikhalilll/a-input/styles.css'],
  aInput: { prefix: '' }, // optional component-name prefix
});
```

**Vite (non-Nuxt)** — with [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components):

```ts
import Components from 'unplugin-vue-components/vite';
import AInputResolver from '@alikhalilll/a-input/resolver';

export default { plugins: [Components({ resolvers: [AInputResolver()] })] };
```

## License

MIT
