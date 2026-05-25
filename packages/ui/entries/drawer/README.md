# `@alikhalilll/ui/drawer`

A themed bottom-sheet drawer built on `vaul-vue` + `reka-ui` — pre-styled with the shared `@alikhalilll/ui` tokens, portal + overlay handled.

## Install

```bash
pnpm add @alikhalilll/ui
```

```ts
import { ADrawer, ADrawerTrigger, ADrawerContent, ADrawerOverlay } from '@alikhalilll/ui/drawer';
import '@alikhalilll/ui/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { ADrawer, ADrawerTrigger, ADrawerContent } from '@alikhalilll/ui/drawer';
</script>

<template>
  <ADrawer>
    <ADrawerTrigger as-child>
      <button type="button">Open drawer</button>
    </ADrawerTrigger>
    <ADrawerContent class="p-6">
      <p class="text-sm">Drawer body — drag the handle or press Escape to dismiss.</p>
    </ADrawerContent>
  </ADrawer>
</template>
```

Every prop on `vaul-vue`'s `DrawerRoot`, `DrawerTrigger`, `DrawerContent`, and `DrawerOverlay` is forwarded — see the [vaul-vue docs](https://github.com/unovue/vaul-vue) for snap points, dismissible, modal, etc.

Pairs with [`@alikhalilll/ui/popover`](../popover) under [`@alikhalilll/ui/responsive-popover`](../responsive-popover), which swaps between the two based on viewport size.

## Named type exports

The vaul-vue + reka-ui prop and emit shapes are re-exported under our `A*` naming:

```ts
import type {
  ADrawerProps,
  ADrawerEmits,
  ADrawerContentProps,
  ADrawerContentEmits,
} from '@alikhalilll/ui/drawer';
```

Full docs: [@alikhalilll/ui — Drawer](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/drawer).
