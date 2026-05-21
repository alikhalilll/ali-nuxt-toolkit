# `@alikhalilll/ui/input`

A sized, themed text input primitive that respects the shared `@alikhalilll/ui` size scale (xs / sm / md / lg / xl) and design tokens.

## Install

```bash
pnpm add @alikhalilll/ui
```

```ts
import { AInput } from '@alikhalilll/ui/input';
import '@alikhalilll/ui/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { AInput } from '@alikhalilll/ui/input';

const value = ref('');
</script>

<template>
  <AInput v-model="value" placeholder="Enter text" size="md" />
</template>
```

## Props

| Prop          | Type                                   | Default | Description                         |
| ------------- | -------------------------------------- | ------- | ----------------------------------- |
| `v-model`     | `string`                               | `''`    | Two-way bound value.                |
| `size`        | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`  | Height + padding + text-size scale. |
| `placeholder` | `string`                               | —       | Standard HTML placeholder.          |
| `disabled`    | `boolean`                              | `false` |                                     |

All other `<input>` attributes are forwarded.

Full docs: [@alikhalilll/ui — Input](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/input).
