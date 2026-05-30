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
import { AInput } from '@alikhalilll/a-input';
```

## Setup

The shipped CSS is self-contained — design tokens + utility classes are pre-compiled. Import the stylesheet once and the component renders themed out of the box (no Tailwind config, no `@theme` block).

### Nuxt 3 / 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@alikhalilll/a-input/styles.css'],
});
```

For auto-imports (use `<AInput>` in templates with no `import`), also register the bundled module:

```ts
modules: ['@alikhalilll/a-input/nuxt'],
```

### Vue + Vite

```ts
// main.ts
import '@alikhalilll/a-input/styles.css';
```

For `unplugin-vue-components` auto-resolve, drop in the shipped resolver:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import UiResolver from '@alikhalilll/a-input/resolver';

export default { plugins: [Components({ resolvers: [UiResolver()] })] };
```

### Dark mode

Toggle `class="dark"` (or `"light"`) on `<html>` — every component inherits via CSS variables.

```ts
// nuxt.config.ts — locked dark
app: { head: { htmlAttrs: { class: 'dark' } } },
```

> Theming tokens, UnoCSS interplay, monorepo CSS gotcha, full public API — see the [UI overview](/ui).

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

For a tel input, compose `AInput` with [`usePhoneValidation`](/ui/tel-input) — or just use the shipped [`ATelInput`](/ui/tel-input) which already wires it up.

The size maps (`controlHeight`, `controlPaddingX`, `controlTextSize`) are exported so you can build other size-aware components in lockstep. See [Size scale](/ui#size-scale).
