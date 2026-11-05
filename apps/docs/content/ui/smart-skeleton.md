---
title: ASmartSkeleton
description: Intelligent, zero-shift skeleton loaders for Vue 3 and Nuxt 3+. Lays real content out unseen in normal DOM flow, traces typographic font metrics and element boxes, then reveals with smooth synchronized animations.
package: '@alikhalilll/a-smart-skeleton'
order: 2
---

# `@alikhalilll/a-smart-skeleton`

> Next-generation intelligent skeleton loader for Vue 3 and Nuxt 3+. It lays your content out unseen in normal browser DOM flow, measures exact font metrics and bounding boxes with Canvas 2D precision, and smoothly transitions into content with zero layout shift.

::DemoSkeletonHero
::

## Why ASmartSkeleton?

Traditional skeletons require maintaining two separate templates — your real component and a hand-crafted grey box replica that inevitably falls out of sync whenever layouts, paddings, or font sizes change.

`ASmartSkeleton` eliminates duplicate templates entirely:

- **Zero layout shift**: Measures your real component's layout directly in the browser DOM.
- **Typographic accuracy**: Canvas 2D font metric tracing aligns text bones between font ascenders and descenders.
- **Synchronized shimmer**: Every skeleton on the page syncs to the global document clock — staggered data fetches join the wave seamlessly.
- **First-class state machine**: Native support for `loading`, `content`, `empty`, and `error` states in a single declarative component.
- **Polished reveal animations**: Choose between `together` (crossfade), `sequence` (cascade), `instant`, or `sweep`.

## Install

::doc-install{pkg="@alikhalilll/a-smart-skeleton"}
::

### Nuxt 3 / 4

Register the official Nuxt module in your configuration:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-smart-skeleton/nuxt'],
});
```

`<ASmartSkeleton>`, `<ASmartSkeletonBox>`, `<ASmartSkeletonSuspense>`, and `<ASmartSkeletonProvider>` are automatically registered and available across all components.

### Vue 3 + Vite

Import the styles in your main entry:

```ts
// main.ts
import '@alikhalilll/a-smart-skeleton/styles.css';
```

Optional auto-import resolver via `unplugin-vue-components`:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import ASmartSkeletonResolver from '@alikhalilll/a-smart-skeleton/resolver';

export default {
  plugins: [
    Components({
      resolvers: [ASmartSkeletonResolver()],
    }),
  ],
};
```

## Data-Driven Skeletons

Wrap your component and pass a representative `sample` of your data shape. While `data` is `null` or pending, `ASmartSkeleton` renders the sample invisibly in the measurement engine, tracing exact geometry so nothing jumps when real data arrives:

```vue
<script setup lang="ts">
import { ref } from 'vue';

const product = ref(null);

const SAMPLE_PRODUCT = {
  title: 'Apex Pro Wireless Mechanical Keyboard',
  category: 'Hardware · Peripherals',
  price: '$189.00',
  description: 'Hot-swappable tactile switches, CNC machined aluminum chassis...',
};
</script>

<template>
  <ASmartSkeleton
    :data="product"
    :sample="SAMPLE_PRODUCT"
    id="product-card"
    label="Loading product card"
  >
    <template #default="{ data }">
      <ProductCard :item="data" />
    </template>
  </ASmartSkeleton>
</template>
```

::DemoSkeletonDataDriven
::

## State Machine (`loading`, `content`, `empty`, `error`)

`ASmartSkeleton` acts as a complete state wrapper, gracefully resolving four mutually exclusive states without nested `v-if / v-else` boilerplate:

::DemoSkeletonStates
::

### State Resolution Order

1. **`loading`** (or `data == null` when data-driven) → renders shimmering measured skeleton
2. **`error`** → renders `#error="{ error }"` slot
3. **`empty`** → renders `#empty` slot (falls back to default slot if empty is not provided)
4. **`content`** → renders `#default="{ data }"` slot

```vue
<ASmartSkeleton
  :data="collaborators"
  :sample="SAMPLE_MEMBERS"
  :error="fetchError"
  :empty="collaborators?.length === 0"
  @reveal="onContentRevealed"
>
  <template #default="{ data }">
    <CollaboratorsList :items="data" />
  </template>
  <template #empty>
    <EmptyIllustration message="No members found" />
  </template>
  <template #error="{ error }">
    <ErrorBanner :error="error" @retry="reload" />
  </template>
</ASmartSkeleton>
```

`@reveal` fires exactly once per `skeleton → content` transition. Subsequent re-renders or changes between error and empty states do not trigger it.

## Author Hints

While automatic DOM tracing accurately measures most layouts, you can fine-tune skeleton boundaries using author hint attributes:

::DemoSkeletonHints
::

### Available Hints

| Hint Attribute | Class Alias            | Behavior                                                                      |
| -------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `ask-block`    | `data-skeleton-block`  | Groups all inner child elements and renders one unified rectangular bone.     |
| `ask-ignore`   | `data-skeleton-ignore` | Reserves layout geometry for the element but suppresses all skeleton bones.   |
| `ask-own`      | `data-skeleton-own`    | Tells the measurement engine that this subtree draws its own custom skeleton. |

```vue
<article>
  <!-- Ignored: keeps layout position with zero bones -->
  <button class="action-btn" ask-ignore>
    Follow
  </button>

  <!-- Unified Block: draws the entire tag row as a single bone -->
  <div class="tag-cloud" ask-block>
    <span v-for="tag in tags" :key="tag">{{ tag }}</span>
  </div>
</article>
```

## Synchronized Multi-Card Shimmer

When multiple components or cards finish loading at different times, `ASmartSkeleton` synchronizes all bones to a shared document clock phase (`element.animate(…).startTime = 0`):

::DemoSmartSkeletonGrid
::

Late-mounting cards or delayed network responses immediately join the current shimmer sweep without resetting animation progress or creating jarring visual desynchronizations.

## Reveal Animations

The `reveal` prop configures how the skeleton transitions into real content:

| Mode                   | Behavior                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `together` _(default)_ | Crossfades the skeleton directly into the loaded content.                              |
| `sequence`             | Staggers item entries from top to bottom.                                              |
| `instant`              | Snaps immediately with zero transition delay.                                          |
| `sweep`                | Sweeps a smooth highlight beam across the transition edge.                             |
| `smart`                | Dynamic heuristic: snaps instant if response landed under 150ms, otherwise crossfades. |

```vue
<ASmartSkeleton :data="data" :sample="SAMPLE" reveal="sequence">
  <template #default="{ data }">
    <FeedItem :item="data" />
  </template>
</ASmartSkeleton>
```

Under `prefers-reduced-motion: reduce`, animations are automatically suppressed and reveals snap instantly.

## Standalone Shimmer Box

When you need an explicit placeholder bar outside automatic measurement, use `<ASmartSkeletonBox>`:

```vue
<template>
  <div class="flex items-center gap-3">
    <ASmartSkeletonBox width="40px" height="40px" radius="999px" />
    <div class="flex-1 flex flex-col gap-1.5">
      <ASmartSkeletonBox width="60%" height="1rem" radius="4px" />
      <ASmartSkeletonBox width="40%" height="0.75rem" radius="4px" />
    </div>
  </div>
</template>
```

`<ASmartSkeletonBox>` participates in the same global document-clock shimmer and respects all theme configuration tokens.

## Theming & CSS Variables

Skeletons can be styled globally via `<ASmartSkeletonProvider>` or locally via CSS variables:

```vue
<script setup lang="ts">
const theme = {
  light: { base: 'rgb(0 0 0 / 0.06)', highlight: 'rgb(255 255 255 / 0.5)' },
  dark: { base: 'rgb(255 255 255 / 0.08)', highlight: 'rgb(255 255 255 / 0.12)' },
  radius: '6px',
  animation: 'shimmer', // 'group-shimmer' | 'pulse' | 'none'
  speed: 'slow', // 'fast'
};
</script>

<template>
  <ASmartSkeletonProvider :theme="theme" reveal="together">
    <App />
  </ASmartSkeletonProvider>
</template>
```

### CSS Custom Properties

| CSS Variable        | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `--ask-base`        | Background fill color of skeleton bones.                             |
| `--ask-highlight`   | Highlight sweep color for the shimmer effect.                        |
| `--ask-radius`      | Border-radius applied to text lines and rectangular bars.            |
| `--ask-animation`   | Active animation type (`shimmer`, `group-shimmer`, `pulse`, `none`). |
| `--ask-speed`       | Speed timing (`slow`, `fast`).                                       |
| `--ask-text-top`    | Typographic top alignment (`ascender`, `cap-height`, `x-height`).    |
| `--ask-text-bottom` | Typographic bottom alignment (`descender`, `baseline`).              |

## Accessibility

`ASmartSkeleton` implements accessibility best practices:

- **`aria-busy="true"`**: Set on the outer container while loading is active.
- **Screen Reader Announcements**: The `label` prop is placed in an `[ask-status]` element for screen reader announcement (e.g. `label="Loading profile"`).
- **Hidden Bones**: Skeleton layers are marked `aria-hidden="true"` and `inert`, preventing screen readers from announcing empty placeholder shapes.
- **Motion Safety**: Listens to `(prefers-reduced-motion: reduce)` to disable shimmer animation and reveal easing.

## API Reference

### `<ASmartSkeleton>` Props

| Prop      | Type         | Default      | Description                                                               |
| --------- | ------------ | ------------ | ------------------------------------------------------------------------- |
| `data`    | `unknown`    | `undefined`  | Real data object; when bound, loading is active while `data == null`.     |
| `sample`  | `unknown`    | `undefined`  | Stand-in data shape used to trace layout unseen before real data arrives. |
| `loading` | `boolean`    | `undefined`  | Manually forces the skeleton to display.                                  |
| `id`      | `string`     | `undefined`  | Key used to remember element shape across page visits.                    |
| `label`   | `string`     | `undefined`  | Accessible description announced to screen readers while loading.         |
| `empty`   | `boolean`    | `false`      | When true, renders `#empty` slot.                                         |
| `error`   | `unknown`    | `undefined`  | When set, renders `#error="{ error }"` slot.                              |
| `reveal`  | `RevealMode` | `'together'` | Transition style (`together`, `sequence`, `instant`, `sweep`, `smart`).   |

### Slots

- `#default="{ data }"`: The real content template.
- `#empty`: Rendered when `empty="true"`.
- `#error="{ error }"`: Rendered when `error` prop is set.
- `#skeleton`: Custom skeleton fallback overriding automatic DOM tracing.

### Events

- `@reveal`: Emitted once when real content successfully replaces the skeleton.
