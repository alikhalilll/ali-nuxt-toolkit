---
title: ADrawer
description: Themed bottom-sheet drawer built on vaul-vue + reka-ui. Drag-to-dismiss with overlay and scroll-lock.
package: '@alikhalilll/a-drawer'
order: 4
---

# ADrawer

Wraps [vaul-vue](https://github.com/unovue/vaul-vue) — a bottom-anchored sheet that drags to dismiss, with overlay, scroll lock, and background-scale built in.

::DemoDrawer
::

## Install

```bash
pnpm add @alikhalilll/a-drawer
```

```ts
import { ADrawer, ADrawerTrigger, ADrawerContent } from '@alikhalilll/a-drawer';
```

## Setup

The shipped CSS is self-contained — design tokens + utility classes are pre-compiled. Import the stylesheet once and the drawer renders themed out of the box.

### Nuxt 3 / 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@alikhalilll/a-drawer/styles.css'],
});
```

For auto-imports (use `<ADrawer>` / `<ADrawerContent>` / etc. with no `import`), also register the bundled module:

```ts
modules: ['@alikhalilll/a-drawer/nuxt'],
```

### Vue + Vite

```ts
// main.ts
import '@alikhalilll/a-drawer/styles.css';
```

For `unplugin-vue-components` auto-resolve, drop in the shipped resolver:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import UiResolver from '@alikhalilll/a-drawer/resolver';

export default { plugins: [Components({ resolvers: [UiResolver()] })] };
```

### Dark mode

Toggle `class="dark"` (or `"light"`) on `<html>` — portaled drawer content inherits via the cascade.

```ts
// nuxt.config.ts — locked dark
app: { head: { htmlAttrs: { class: 'dark' } } },
```

> Theming tokens, UnoCSS interplay, monorepo CSS gotcha, full public API — see the [UI overview](/ui).

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ADrawer, ADrawerTrigger, ADrawerContent } from '@alikhalilll/a-drawer';

const open = ref(false);
</script>

<template>
  <ADrawer v-model:open="open">
    <ADrawerTrigger as-child>
      <button>Open</button>
    </ADrawerTrigger>
    <ADrawerContent class="p-6">
      <h3>Title</h3>
      <p>Body</p>
    </ADrawerContent>
  </ADrawer>
</template>
```

`ADrawerContent` includes a drag handle at the top and an overlay automatically — no need to render them manually.

## ADrawer props

| Prop                    | Type                                     | Default    | Description                                 |
| ----------------------- | ---------------------------------------- | ---------- | ------------------------------------------- |
| `v-model:open`          | `boolean`                                | —          | Controlled open state.                      |
| `defaultOpen`           | `boolean`                                | `false`    | Initial state when uncontrolled.            |
| `modal`                 | `boolean`                                | `true`     | Lock body scroll while open.                |
| `direction`             | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Edge the drawer slides from.                |
| `dismissible`           | `boolean`                                | `true`     | Whether the drawer can be dragged to close. |
| `shouldScaleBackground` | `boolean`                                | `true`     | Subtle background-scale effect.             |
| `snapPoints`            | `(number \| string)[]`                   | —          | Multi-step snap positions.                  |
| `closeThreshold`        | `number`                                 | `0.25`     | Drag fraction at which to close.            |
| `handleOnly`            | `boolean`                                | `false`    | Restrict drag to the handle element.        |

All other props/emits from [`DrawerRoot`](https://github.com/unovue/vaul-vue#api) are forwarded.

## When to use vs. APopover

| Use `ADrawer` when               | Use [`APopover`](/ui/popover) when     |
| -------------------------------- | -------------------------------------- |
| Mobile-first, full-bleed content | Desktop-first, attached to a trigger   |
| Form sheets, multi-step actions  | Tooltips, comboboxes, dropdowns        |
| Drag-to-dismiss gestures         | Floating-ui positioning near a trigger |

For both at once — popover on desktop, drawer on mobile — use [`AResponsivePopover`](/ui/responsive-popover).
