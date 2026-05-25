# `@alikhalilll/ui/popover`

A themed wrapper around `reka-ui`'s Popover primitive — pre-styled with the shared `@alikhalilll/ui` tokens (radius, shadow, border, animation), with anchor/portal behaviour handled for you.

## Install

```bash
pnpm add @alikhalilll/ui
```

```ts
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/ui/popover';
import '@alikhalilll/ui/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/ui/popover';
</script>

<template>
  <APopover>
    <APopoverTrigger as-child>
      <button type="button">Open</button>
    </APopoverTrigger>
    <APopoverContent class="w-64 p-4">
      <p class="text-sm">Content lives inside a portal — escape key + outside clicks close it.</p>
    </APopoverContent>
  </APopover>
</template>
```

Every prop on `reka-ui`'s `PopoverRoot`, `PopoverTrigger`, and `PopoverContent` is forwarded — see the [reka-ui Popover docs](https://reka-ui.com/docs/components/popover) for the full API.

## Named type exports

The reka-ui prop and emit shapes are re-exported under our `A*` naming so consumers don't need a separate `reka-ui` import for type access:

```ts
import type {
  APopoverProps,
  APopoverEmits,
  APopoverContentProps,
  APopoverContentEmits,
  APopoverTriggerProps,
} from '@alikhalilll/ui/popover';
```

Full docs: [@alikhalilll/ui — Popover](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/popover).
