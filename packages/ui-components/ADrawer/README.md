# @alikhalilll/a-drawer

Headless, [shadcn-vue](https://www.shadcn-vue.com) style Vue 3 drawer built on
[vaul-vue](https://github.com/unovue/vaul-vue) (drag/snap behaviour) + [reka-ui](https://reka-ui.com)
(dialog semantics). Thin wrappers that forward 1:1 to the upstream primitives.

Components: **`ADrawer`** (root) · **`ADrawerTrigger`** · **`ADrawerContent`** · **`ADrawerOverlay`**.

## Install

```bash
pnpm add @alikhalilll/a-drawer
```

## Styles

```ts
import '@alikhalilll/a-drawer/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { ADrawer, ADrawerTrigger, ADrawerContent } from '@alikhalilll/a-drawer';
</script>

<template>
  <ADrawer>
    <ADrawerTrigger>Open</ADrawerTrigger>
    <ADrawerContent>
      <p class="text-foreground">Drawer body</p>
    </ADrawerContent>
  </ADrawer>
</template>
```

## API

### `ADrawer` (root)

Extends vaul-vue `DrawerRootProps` — `open` (`v-model:open`), `defaultOpen`, `modal`,
`shouldScaleBackground`, `snapPoints`, `activeSnapPoint`, `dismissible`, `direction`, … Emits the
vaul events: `update:open`, `update:activeSnapPoint`, `drag`, `release`, `close`, `animationEnd`.

### `ADrawerContent`

Extends reka-ui `DialogContentProps` plus `class`. Emits the dialog content events.

### `ADrawerTrigger`

Extends vaul-vue `DrawerTriggerProps`.

### `ADrawerOverlay`

The dim layer: extends reka-ui `DialogOverlayProps` plus `class`.

## Auto-import

**Nuxt:**

```ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-drawer/nuxt'],
  css: ['@alikhalilll/a-drawer/styles.css'],
});
```

**Vite:** register `@alikhalilll/a-drawer/resolver` in `unplugin-vue-components`.

## License

MIT
