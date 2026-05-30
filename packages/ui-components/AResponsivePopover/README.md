# @alikhalilll/a-responsive-popover

One breakpoint-aware component that renders a [reka-ui](https://reka-ui.com) **popover on desktop**
and a [vaul-vue](https://github.com/unovue/vaul-vue) **drawer on mobile**, with a single API. Built
on `@alikhalilll/a-popover` + `@alikhalilll/a-drawer` (both pulled in automatically).

Components: **`AResponsivePopover`** (root) · **`AResponsivePopoverTrigger`** · **`AResponsivePopoverContent`**.

## Install

```bash
pnpm add @alikhalilll/a-responsive-popover
```

## Styles

It renders the popover (desktop) and drawer (mobile), so import all three stylesheets plus the
shared tokens:

```ts
import '@alikhalilll/a-popover/styles.css';
import '@alikhalilll/a-drawer/styles.css';
import '@alikhalilll/a-responsive-popover/styles.css';
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  AResponsivePopover,
  AResponsivePopoverTrigger,
  AResponsivePopoverContent,
} from '@alikhalilll/a-responsive-popover';

const open = ref(false);
</script>

<template>
  <AResponsivePopover v-model:open="open">
    <AResponsivePopoverTrigger>Open</AResponsivePopoverTrigger>
    <AResponsivePopoverContent>
      <template #default="{ isDesktop }">
        <p>{{ isDesktop ? 'Popover (desktop)' : 'Drawer (mobile)' }}</p>
      </template>
    </AResponsivePopoverContent>
  </AResponsivePopover>
</template>
```

## API

### `AResponsivePopover` (root)

| Prop         | Type                           | Default              | Description                                                                                                |
| ------------ | ------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `open`       | `boolean`                      | —                    | `v-model:open`.                                                                                            |
| `breakpoint` | `string`                       | `(min-width: 768px)` | Media query for the desktop break; below it, the drawer renders.                                           |
| `scrollLock` | `'events' \| 'body' \| 'none'` | `events`             | How desktop page-scroll is blocked while open (`events` keeps the scrollbar + `position: sticky` working). |
| `modal`      | `boolean`                      | `true`               | **Deprecated** — prefer `scrollLock`. `false` ≈ `scrollLock="none"`.                                       |

Emits `update:open`. The default slot receives `{ isDesktop }` so you can branch content without a
separate `useMediaQuery`.

### SSR

`useMediaQuery` returns `false` on the server, so the first server paint is the drawer branch; the
client may swap to popover on hydration. Both branches are pre-imported (no lazy chunks), and the
closed drawer is collapsed, so the swap is invisible.

## Auto-import

**Nuxt:**

```ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-responsive-popover/nuxt'],
  css: [
    '@alikhalilll/a-popover/styles.css',
    '@alikhalilll/a-drawer/styles.css',
    '@alikhalilll/a-responsive-popover/styles.css',
  ],
});
```

**Vite:** register `@alikhalilll/a-responsive-popover/resolver` in `unplugin-vue-components`.

## License

MIT
