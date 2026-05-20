---
title: APopover
description: reka-ui Popover wrapper. Modal by default, optional overlay, full props/emits forwarding.
package: '@alikhalilll/ui'
order: 3
---

# APopover

Wraps reka-ui's `PopoverRoot` / `PopoverTrigger` / `PopoverContent` primitives. Modal by default — that means clicking outside closes it, page scroll is locked while open, focus is trapped. Pass `:modal="false"` for tooltip-style non-modal popovers.

::DemoPopover
::

## Install

```bash
pnpm add @alikhalilll/ui
```

If this is your first `@alikhalilll/ui` component, complete the [one-time setup](/ui#setup) (CSS import + Tailwind `@theme inline` mapping + `.dark` class). Then import:

```ts
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/ui';
```

## Basic usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/ui';

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

`<APopoverTrigger as-child>` forwards the trigger props/ARIA to your inner button — your button stays the focusable element. Without `as-child`, reka-ui renders its own default button.

## APopover (root) props

Inherits every prop and emit from reka-ui's [`PopoverRootProps` / `PopoverRootEmits`](https://reka-ui.com/docs/components/popover). The most useful ones:

| Prop           | Type      | Default    | Description                                                       |
| -------------- | --------- | ---------- | ----------------------------------------------------------------- |
| `v-model:open` | `boolean` | —          | Controlled open state.                                            |
| `defaultOpen`  | `boolean` | `false`    | Initial open state when uncontrolled.                             |
| `modal`        | `boolean` | **`true`** | Lock page scroll + trap focus while open. Outside clicks dismiss. |

## APopoverContent props

| Prop           | Type                                     | Default    | Description                                                                                                                                       |
| -------------- | ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `align`        | `'start' \| 'center' \| 'end'`           | `'center'` | Forwarded to floating-ui.                                                                                                                         |
| `sideOffset`   | `number`                                 | `4`        | Distance from trigger in px.                                                                                                                      |
| `side`         | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side; auto-flips on collision.                                                                                                          |
| `overlay`      | `boolean`                                | `false`    | Render a dimmed `bg-black/60 backdrop-blur-sm` overlay behind the content. Combine with `:modal="true"` on the root for click-overlay-to-dismiss. |
| `overlayClass` | `HTMLAttributes['class']`                | —          | Tailwind classes for the overlay.                                                                                                                 |
| `class`        | `HTMLAttributes['class']`                | —          | Merged into the content via `tailwind-merge`.                                                                                                     |

Plus everything from [`PopoverContentProps` / `PopoverContentEmits`](https://reka-ui.com/docs/components/popover) (collision props, `forceMount`, `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`, etc.) — they're all forwarded.

## Sizing to the viewport

reka-ui exposes a CSS variable that tracks the available height between the trigger and the viewport edge. Use it as a `max-height` so the popover never overflows:

```vue
<APopoverContent
  class="w-[min(20rem,calc(100vw-2rem))] max-h-[min(20rem,var(--reka-popover-content-available-height))]"
>
  <div class="overflow-y-auto">
    <!-- long list -->
  </div>
</APopoverContent>
```

This is how [`ACountrySelect`](/ui/tell-input) renders a long country list inside a tight popover.

## Animations

The default content class includes shadcn-vue's `data-[state=open]:animate-in / data-[state=closed]:animate-out` classes plus side-aware `slide-in-from-*` utilities, so the popover fades + zooms in from the correct edge automatically.

## Use it as the base for a `Select`, `Combobox`, etc.

Because `APopover` is just a styled wrapper around the reka-ui primitive, you can swap in any focusable content — a list, a search box, a date picker, etc. — and `useForwardPropsEmits` will forward every reka-ui prop you pass.
