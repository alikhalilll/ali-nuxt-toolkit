---
title: AResponsivePopover
description: Popover on desktop, vaul-vue drawer on mobile. Same API, swaps surfaces at the breakpoint.
package: '@alikhalilll/ui'
order: 5
---

# AResponsivePopover

Renders as an [`APopover`](/ui/popover) at ≥ 768 px and an [`ADrawer`](/ui/drawer) below. Built on `useMediaQuery` — both branches are pre-imported so SSR + hydration stay consistent.

::DemoResponsivePopover
::

This is the surface powering the country picker in [`ATellInput`](/ui/tell-input).

## Install

```bash
pnpm add @alikhalilll/ui
```

```ts
import {
  AResponsivePopover,
  AResponsivePopoverTrigger,
  AResponsivePopoverContent,
} from '@alikhalilll/ui/responsive-popover';
```

First time using `@alikhalilll/ui`? Run the [one-time setup](/ui#setup).

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  AResponsivePopover,
  AResponsivePopoverTrigger,
  AResponsivePopoverContent,
} from '@alikhalilll/ui/responsive-popover';

const open = ref(false);
</script>

<template>
  <AResponsivePopover v-model:open="open">
    <AResponsivePopoverTrigger as-child>
      <button>Open</button>
    </AResponsivePopoverTrigger>
    <AResponsivePopoverContent popover-class="w-72" drawer-class="max-h-[60vh] pb-6">
      <p>Same content, different surface per viewport.</p>
    </AResponsivePopoverContent>
  </AResponsivePopover>
</template>
```

The default slot is scoped — `<template #default="{ isDesktop }">` exposes a boolean if you need to branch content per surface.

## Props

### `AResponsivePopover` (root)

| Prop           | Type      | Default                | Description                                        |
| -------------- | --------- | ---------------------- | -------------------------------------------------- |
| `v-model:open` | `boolean` | —                      | Controlled open state — same across both surfaces. |
| `breakpoint`   | `string`  | `'(min-width: 768px)'` | CSS media query for the desktop branch.            |
| `modal`        | `boolean` | `true`                 | Forwarded to `APopover.modal` on desktop.          |

### `AResponsivePopoverContent`

| Prop           | Type                           | Default                | Description                                                            |
| -------------- | ------------------------------ | ---------------------- | ---------------------------------------------------------------------- |
| `class`        | `HTMLAttributes['class']`      | —                      | Applied to **both** branches. Avoid width/inset here.                  |
| `popoverClass` | `HTMLAttributes['class']`      | —                      | Desktop branch only.                                                   |
| `drawerClass`  | `HTMLAttributes['class']`      | —                      | Mobile branch only.                                                    |
| `overlay`      | `boolean`                      | `false`                | Render a dimmed overlay on the popover branch (drawer always has one). |
| `align`        | `'start' \| 'center' \| 'end'` | `'start'`              | Desktop alignment.                                                     |
| `sideOffset`   | `number`                       | `4`                    | Desktop offset from trigger in px.                                     |
| `breakpoint`   | `string`                       | `'(min-width: 768px)'` | Match the root if customised.                                          |

Per-branch class props matter — a fixed `w-72` would fight the drawer's `inset-x-0`. Split them.

## Notes

- `useMediaQuery` returns `false` during SSR — the first paint is the drawer; the client may swap on hydration. The drawer is collapsed when closed, so it's invisible.
- Both branches are pre-imported (no lazy loading) so hydration always finds the right tree.
- Use `as-child` on the trigger so your inner button stays focusable under both branches.
