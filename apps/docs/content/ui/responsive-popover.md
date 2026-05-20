---
title: AResponsivePopover
description: Popover on desktop, vaul-vue drawer on mobile. Single v-model, separate per-branch styling.
package: '@alikhalilll/ui'
order: 5
---

# AResponsivePopover

A surface that renders as an [`APopover`](/ui/popover) at ≥ 768 px and as an [`ADrawer`](/ui/drawer) below. Built on `useMediaQuery` from `@vueuse/core` — both branches are pre-imported (no lazy loading) so SSR + hydration stay consistent.

::DemoResponsivePopover
::

This is the surface [`ACountrySelect`](/ui/tell-input) uses internally to deliver the popover-on-desktop / drawer-on-mobile UX in the country picker.

## Basic usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  AResponsivePopover,
  AResponsivePopoverTrigger,
  AResponsivePopoverContent,
} from '@alikhalilll/ui';

const open = ref(false);
</script>

<template>
  <AResponsivePopover v-model:open="open">
    <AResponsivePopoverTrigger as-child>
      <button>Open</button>
    </AResponsivePopoverTrigger>
    <AResponsivePopoverContent align="start" popover-class="w-72" drawer-class="max-h-[60vh] pb-6">
      <p>Same content, different surface per viewport.</p>
    </AResponsivePopoverContent>
  </AResponsivePopover>
</template>
```

## AResponsivePopover (root) props

| Prop           | Type      | Default                | Description                                                                                                          |
| -------------- | --------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `v-model:open` | `boolean` | —                      | Controlled open state — works identically across both branches.                                                      |
| `breakpoint`   | `string`  | `'(min-width: 768px)'` | CSS media query for the desktop branch.                                                                              |
| `modal`        | `boolean` | `true`                 | Forwarded to `APopover.modal` on desktop (lock scroll + click-outside-to-close). Mobile drawer is always modal-like. |

The default slot is scoped — `<template #default="{ isDesktop }">` exposes a boolean so you can branch your content based on the active surface if needed.

## AResponsivePopoverTrigger props

| Prop         | Type      | Default                | Description                                                      |
| ------------ | --------- | ---------------------- | ---------------------------------------------------------------- |
| `breakpoint` | `string`  | `'(min-width: 768px)'` | Match the value on the root if you're customizing.               |
| `asChild`    | `boolean` | `false`                | Forward trigger ARIA to a wrapped element (typical for buttons). |

## AResponsivePopoverContent props

| Prop           | Type                           | Default                | Description                                                                     |
| -------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------------------------- |
| `breakpoint`   | `string`                       | `'(min-width: 768px)'` | Should match the root.                                                          |
| `class`        | `HTMLAttributes['class']`      | —                      | Classes applied to **both** branches. Avoid width / inset classes here.         |
| `popoverClass` | `HTMLAttributes['class']`      | —                      | Classes applied only when the popover (desktop) branch is rendered.             |
| `drawerClass`  | `HTMLAttributes['class']`      | —                      | Classes applied only when the drawer (mobile) branch is rendered.               |
| `overlay`      | `boolean`                      | `false`                | Render the dimmed overlay on the **popover** branch. The drawer always has one. |
| `align`        | `'start' \| 'center' \| 'end'` | `'start'`              | Forwarded to `APopoverContent` on desktop only.                                 |
| `sideOffset`   | `number`                       | `4`                    | Distance from trigger in px (desktop only).                                     |

The per-branch class props matter — a fixed popover width like `w-72` would fight `inset-x-0` on the drawer, so split them.

## Caveats

- `useMediaQuery` is `false` during SSR. The first server-rendered paint is the drawer variant; the client may swap to the popover variant on hydration. The drawer is collapsed when closed, so this is invisible.
- Pre-imported, not lazy-loaded. Switching branches via `<component :is>` means hydration always finds the right tree client-side.
- Use `as-child` on the trigger so your inner button stays the focusable element under both branches.

## Reusing the same surface for `Combobox`, `Select`, etc.

Drop a search box + list inside `AResponsivePopoverContent` and you have a responsive picker. The country select on the [`ATellInput`](/ui/tell-input) page is exactly this pattern.
