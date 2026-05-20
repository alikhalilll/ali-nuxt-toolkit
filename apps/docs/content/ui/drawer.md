---
title: ADrawer
description: vaul-vue Drawer wrapper. Bottom-anchored, drag-to-dismiss, with overlay + scroll-lock.
package: '@alikhalilll/ui'
order: 4
---

# ADrawer

Wraps [vaul-vue](https://github.com/unovue/vaul-vue) — the Vue port of Emil Kowalski's Vaul. A bottom-anchored sheet that can be dragged down to dismiss, with built-in scroll lock, background scaling, and an animated overlay.

::DemoDrawer
::

## Basic usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ADrawer, ADrawerTrigger, ADrawerContent } from '@alikhalilll/ui';

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

`ADrawerContent` automatically includes a drag handle at the top and an `ADrawerOverlay` (dim backdrop) behind itself — you don't need to render those manually.

## ADrawer (root) props

Inherits every prop and emit from vaul-vue's [`DrawerRootProps` / `DrawerRootEmits`](https://github.com/unovue/vaul-vue#api). Highlights:

| Prop                    | Type                                     | Default    | Description                                 |
| ----------------------- | ---------------------------------------- | ---------- | ------------------------------------------- |
| `v-model:open`          | `boolean`                                | —          | Controlled open state.                      |
| `defaultOpen`           | `boolean`                                | `false`    | Initial state when uncontrolled.            |
| `modal`                 | `boolean`                                | `true`     | Lock body scroll while open.                |
| `direction`             | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Edge the drawer slides from.                |
| `dismissible`           | `boolean`                                | `true`     | Whether the drawer can be dragged to close. |
| `shouldScaleBackground` | `boolean`                                | **`true`** | Adds the subtle background-scale effect.    |
| `snapPoints`            | `(number \| string)[]`                   | —          | Multi-step snap positions.                  |
| `closeThreshold`        | `number`                                 | `0.25`     | Drag distance fraction at which to close.   |
| `handleOnly`            | `boolean`                                | `false`    | Restrict drag to the handle element.        |

## ADrawerContent props

| Prop    | Type                      | Default | Description                             |
| ------- | ------------------------- | ------- | --------------------------------------- |
| `class` | `HTMLAttributes['class']` | —       | Tailwind classes merged into the sheet. |

Plus reka-ui's `DialogContentEmits` (`onEscapeKeyDown`, `onPointerDownOutside`, etc.) which are forwarded.

## ADrawerOverlay

Used internally by `ADrawerContent`. Exported in case you want to compose your own drawer-style sheet — sits at `z-40` with `bg-black/60 backdrop-blur-sm` and animates with the drawer's open/close state.

## When to use vs. APopover

| Use `ADrawer` when                     | Use [`APopover`](/ui/popover) when     |
| -------------------------------------- | -------------------------------------- |
| Mobile-first or full-bleed content     | Desktop-first or attached to a trigger |
| Form sheets, multi-step actions        | Tooltips, comboboxes, dropdowns        |
| Content that should slide from an edge | Content that floats near its trigger   |
| You want drag-to-dismiss gestures      | You want positioning via floating-ui   |

For "popover on desktop, drawer on mobile" — use [`AResponsivePopover`](/ui/responsive-popover).
