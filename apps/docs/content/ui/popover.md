---
title: APopover
description: Themed reka-ui popover. Modal by default, optional dimmed overlay, full props/emits forwarding.
package: '@alikhalilll/ui'
order: 3
---

# APopover

Wraps reka-ui's `PopoverRoot` / `Trigger` / `Content` with the shared design tokens and an optional dimmed overlay. Modal by default — outside clicks dismiss, page scroll locks, focus is trapped.

::DemoPopover
::

## Install

```bash
pnpm add @alikhalilll/ui
```

```ts
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/ui/popover';
```

First time using `@alikhalilll/ui`? Run the [one-time setup](/ui#setup).

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/ui/popover';

const open = ref(false);
</script>

<template>
  <APopover v-model:open="open">
    <APopoverTrigger as-child>
      <button>Open</button>
    </APopoverTrigger>
    <APopoverContent align="start" class="w-72">
      <p>Popover body</p>
    </APopoverContent>
  </APopover>
</template>
```

`as-child` forwards the trigger props to your inner button so it stays the focusable element.

## APopover props

| Prop           | Type      | Default | Description                                       |
| -------------- | --------- | ------- | ------------------------------------------------- |
| `v-model:open` | `boolean` | —       | Controlled open state.                            |
| `defaultOpen`  | `boolean` | `false` | Initial open state when uncontrolled.             |
| `modal`        | `boolean` | `true`  | Lock scroll + trap focus. Outside clicks dismiss. |

All other props/emits from reka-ui's [`PopoverRoot`](https://reka-ui.com/docs/components/popover) are forwarded.

## APopoverContent props

| Prop           | Type                                     | Default    | Description                                                         |
| -------------- | ---------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `side`         | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side; auto-flips on collision.                            |
| `align`        | `'start' \| 'center' \| 'end'`           | `'center'` | Alignment along the chosen side.                                    |
| `sideOffset`   | `number`                                 | `4`        | Distance from trigger in px.                                        |
| `overlay`      | `boolean`                                | `false`    | Render a `bg-black/60 backdrop-blur-sm` overlay behind the content. |
| `overlayClass` | `HTMLAttributes['class']`                | —          | Tailwind classes for the overlay.                                   |
| `class`        | `HTMLAttributes['class']`                | —          | Merged into the content via `tailwind-merge`.                       |

All other props/emits from [`PopoverContent`](https://reka-ui.com/docs/components/popover) (collision detection, `forceMount`, `onEscapeKeyDown`, `onInteractOutside`, …) are forwarded.

## Sizing to the viewport

Use reka-ui's available-height variable so long lists never overflow:

```vue
<APopoverContent
  class="w-[min(20rem,calc(100vw-2rem))] max-h-[min(20rem,var(--reka-popover-content-available-height))]"
>
  <div class="overflow-y-auto"><!-- long list --></div>
</APopoverContent>
```

This is how [`ACountrySelect`](/ui/tell-input) keeps the country list inside the popover bounds.

## Animations

The default content class includes shadcn-vue's `data-[state=open]:animate-in` / `data-[state=closed]:animate-out` plus side-aware `slide-in-from-*` utilities — fade + zoom + slide from the correct edge happen automatically.

## Mobile: pair with a drawer

For a popover-on-desktop / drawer-on-mobile UX, use [`AResponsivePopover`](/ui/responsive-popover) — same API, swaps surfaces at the breakpoint.
