# `@alikhalilll/ui/responsive-popover`

A drop-in popover that **swaps to a bottom-sheet drawer on mobile** (`useMediaQuery` watches `(min-width: 768px)`). Above the breakpoint it composes `@alikhalilll/ui/popover`; below it composes `@alikhalilll/ui/drawer`. Single API, two presentations.

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
import '@alikhalilll/ui/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import {
  AResponsivePopover,
  AResponsivePopoverTrigger,
  AResponsivePopoverContent,
} from '@alikhalilll/ui/responsive-popover';
</script>

<template>
  <AResponsivePopover>
    <AResponsivePopoverTrigger as-child>
      <button type="button">Open</button>
    </AResponsivePopoverTrigger>
    <AResponsivePopoverContent popover-class="w-64 p-4" drawer-class="max-h-[60vh] p-6">
      <p class="text-sm">Renders as a popover on desktop, a drawer on phones.</p>
    </AResponsivePopoverContent>
  </AResponsivePopover>
</template>
```

`popover-class` and `drawer-class` let you apply variant-specific styling — only the active surface is mounted at any given time.

This component is what powers the country picker inside [`@alikhalilll/ui/tell-input`](../tell-input).

Full docs: [@alikhalilll/ui — Responsive Popover](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/responsive-popover).
