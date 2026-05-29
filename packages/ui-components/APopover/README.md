# @alikhalilll/a-popover

Headless, [shadcn-vue](https://www.shadcn-vue.com) style Vue 3 popover built on
[reka-ui](https://reka-ui.com), with an optional dim overlay and scroll-lock. Thin wrappers that
forward 1:1 to reka-ui's Popover primitives, so every upstream prop is available.

Components: **`APopover`** (root) · **`APopoverTrigger`** · **`APopoverContent`** · **`APopoverOverlay`**.

## Install

```bash
pnpm add @alikhalilll/a-popover
```

## Styles

```ts
import '@alikhalilll/a-ui-base/tokens.css';
import '@alikhalilll/a-popover/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/a-popover';
</script>

<template>
  <APopover>
    <APopoverTrigger>Open</APopoverTrigger>
    <APopoverContent :overlay="true">
      <p class="text-popover-foreground">Popover body</p>
    </APopoverContent>
  </APopover>
</template>
```

## API

### `APopover` (root)

Extends reka-ui `PopoverRootProps` — `open` (`v-model:open`), `defaultOpen`, `modal`. Emits
`update:open`.

### `APopoverContent`

Extends reka-ui `PopoverContentProps` (`side`, `align`, `sideOffset`, `forceMount`, `asChild`, …)
plus:

| Prop                | Type                      | Default | Description                                                     |
| ------------------- | ------------------------- | ------- | --------------------------------------------------------------- |
| `class`             | `HTMLAttributes['class']` | —       | Class on the content panel.                                     |
| `overlay`           | `boolean`                 | `false` | Dim the viewport behind the popover and capture outside clicks. |
| `overlayClass`      | `HTMLAttributes['class']` | —       | Class on the overlay layer.                                     |
| `overlayLockScroll` | `boolean`                 | `false` | Also lock page scroll (`body { overflow: hidden }`) while open. |

Emits reka-ui's content events (`escapeKeyDown`, `pointerDownOutside`, `focusOutside`, …).

### `APopoverTrigger`

Extends reka-ui `PopoverTriggerProps` (`asChild`, …).

### `APopoverOverlay`

The standalone dim layer (used internally by `overlay`): `class`, `lockScroll`.

## Auto-import

**Nuxt:**

```ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-popover/nuxt'],
  css: ['@alikhalilll/a-ui-base/tokens.css', '@alikhalilll/a-popover/styles.css'],
});
```

**Vite:** register `@alikhalilll/a-popover/resolver` in `unplugin-vue-components`.

## License

MIT
