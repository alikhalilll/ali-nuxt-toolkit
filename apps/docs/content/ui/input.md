---
title: AInput
description: Themed text input with the shared size scale and optional prefix/suffix slots.
package: '@alikhalilll/a-input'
order: 2
---

# AInput

A themed `<input>` wrapper. Passes every standard input attribute through, adds the shared size scale, and exposes `prefix` / `suffix` slots that turn the field into a bordered row.

::DemoInput
::

## Install

```bash
pnpm add @alikhalilll/a-input
```

```ts
import { AInput } from '@alikhalilll/a-input'; // tree-shaken subpath
// or: import { AInput } from '@alikhalilll/a-input';
```

First time using `@alikhalilll/a-input`? Run the [one-time setup](/ui#setup) (CSS import + Tailwind tokens + `.dark` class).

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { AInput } from '@alikhalilll/a-input';

const value = ref('');
</script>

<template>
  <AInput v-model="value" placeholder="Type here…" size="md" />
</template>
```

## Props

| Prop           | Type                                   | Default | Description                                                    |
| -------------- | -------------------------------------- | ------- | -------------------------------------------------------------- |
| `v-model`      | `string \| number`                     | `''`    | Bound value (via `useVModel`, passive).                        |
| `defaultValue` | `string \| number`                     | —       | Initial value when `v-model` is undefined.                     |
| `size`         | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`  | Height, padding, text size.                                    |
| `class`        | `HTMLAttributes['class']`              | —       | Merged via `tailwind-merge`.                                   |
| `inputClass`   | `HTMLAttributes['class']`              | —       | Classes for the inner `<input>` when prefix/suffix is present. |
| `prefixClass`  | `HTMLAttributes['class']`              | —       | Classes for the prefix wrapper.                                |
| `suffixClass`  | `HTMLAttributes['class']`              | —       | Classes for the suffix wrapper.                                |

Every standard `<input>` attribute (`type`, `placeholder`, `disabled`, `inputmode`, `autocomplete`, `pattern`, …) is forwarded.

## Slots

`prefix` and `suffix` switch the component into a wrapped layout — the bordered field owns the row (focus ring + border + background) and `<input>` becomes a flex child.

```vue
<AInput v-model="search" placeholder="Search…" size="md">
  <template #prefix>
    <Search class="size-4" />
  </template>
</AInput>
```

## Building on it

For a tel input, compose `AInput` with [`usePhoneValidation`](/ui/tell-input) — or just use the shipped [`ATelInput`](/ui/tell-input) which already wires it up.

The size maps (`controlHeight`, `controlPaddingX`, `controlTextSize`) are exported so you can build other size-aware components in lockstep. See [Size scale](/ui#size-scale).
