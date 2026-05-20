---
title: AInput
description: Base shadcn-style text input with the shared size scale.
package: '@alikhalilll/ui'
order: 2
---

# AInput

A thin wrapper around the native `<input>` element with shadcn-vue styling, `v-model` support via `useVModel` (passive, with `defaultValue`), and the [shared size scale](/ui#size-scale).

::DemoInput
::

## Install

```bash
pnpm add @alikhalilll/ui
```

If this is your first `@alikhalilll/ui` component, complete the [one-time setup](/ui#setup) (CSS import + Tailwind `@theme inline` mapping + `.dark` class). Then import:

```ts
import { AInput } from '@alikhalilll/ui';
```

## Basic usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { AInput } from '@alikhalilll/ui';

const value = ref('');
</script>

<template>
  <AInput v-model="value" placeholder="Type here…" size="md" />
</template>
```

## Props

| Prop           | Type                                   | Default     | Description                                        |
| -------------- | -------------------------------------- | ----------- | -------------------------------------------------- |
| `v-model`      | `string \| number`                     | `''`        | Bound to the underlying `<input>` via `useVModel`. |
| `defaultValue` | `string \| number`                     | `undefined` | Initial value when `v-model` is undefined.         |
| `size`         | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`      | Drives `h-*`, padding, text size.                  |
| `class`        | `HTMLAttributes['class']`              | —           | Merged via `tailwind-merge`.                       |

All standard `<input>` attributes (`type`, `placeholder`, `disabled`, `inputmode`, `autocomplete`, `pattern`, etc.) pass through. `data-slot="input"` and `data-size="<size>"` are set on the element so you can target it with CSS or testing libraries.

## Slots

`AInput` exposes `prefix` and `suffix` slots — when either is filled the component switches to a wrapped layout where the bordered "field" owns the whole row (focus ring, border, background) and the native `<input>` becomes a flex child.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { AInput } from '@alikhalilll/ui';
import { Search, Mail } from 'lucide-vue-next';
const value = ref('');
</script>

<template>
  <AInput v-model="value" placeholder="Search countries…" size="md">
    <template #prefix>
      <Search class="size-4" />
    </template>
  </AInput>

  <AInput v-model="email" type="email" placeholder="you@example.com">
    <template #prefix>
      <Mail class="size-4" />
    </template>
    <template #suffix>
      <button class="text-xs text-muted-foreground hover:text-foreground">Send</button>
    </template>
  </AInput>
</template>
```

| Prop          | Type                      | Description                                                                   |
| ------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `inputClass`  | `HTMLAttributes['class']` | Classes applied to the inner native `<input>` when prefix/suffix are present. |
| `prefixClass` | `HTMLAttributes['class']` | Classes for the prefix wrapper span.                                          |
| `suffixClass` | `HTMLAttributes['class']` | Classes for the suffix wrapper span.                                          |

## Sizing maps

The size prop reads from three exported maps:

```ts
import { controlHeight, controlPaddingX, controlTextSize } from '@alikhalilll/ui';

controlHeight.md; // 'h-[43px]'
controlPaddingX.md; // 'px-3'
controlTextSize.md; // 'text-sm'
```

Re-use them when building other input-style components (selects, comboboxes, textareas) so everything stays in lockstep.

## Pattern: tel input

```vue
<AInput
  v-model="phone"
  type="tel"
  inputmode="numeric"
  autocomplete="tel"
  placeholder="Phone"
  @input="(e) => {
    const t = e.target as HTMLInputElement;
    t.value = t.value.replace(/\\D/g, '');
    phone = t.value;
  }"
/>
```

The shipped [`ATellInput`](/ui/tell-input) handles all of this for you — but if you need a stripped-down version (no country picker, no validation), composing `AInput` directly is the right move.
