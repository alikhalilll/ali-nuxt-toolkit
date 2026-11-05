# @alikhalilll/a-smart-skeleton

> Smart, dynamic skeleton loader for Vue 3, Nuxt 3+, and vanilla Web Components. Lays content out unseen, measures typography and geometry down to exact canvas font metrics and clip regions, and reveals real content with smooth animations (smart, sequence, sweep, together).

[![npm](https://img.shields.io/npm/v/@alikhalilll/a-smart-skeleton.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-smart-skeleton)
[![License: MIT](https://img.shields.io/badge/License-MIT-444.svg)](./LICENSE)

---

## Why `@alikhalilll/a-smart-skeleton`?

Handcrafted skeleton placeholders easily drift out of sync with real content, resulting in jarring layout shifts when data arrives.

`@alikhalilll/a-smart-skeleton` solves this by:

1. **Zero Layout Shift (CLS = 0)**: Content (or a sample schema) is rendered unseen in an off-screen ghost tree. Its geometry is measured, generating matching skeleton bones that occupy the exact layout footprint before first paint.
2. **Typographic Accuracy**: Using 2D canvas font metrics, text is measured along font lines (`ascender`, `capHeight`, `xHeight`, `baseline`, `descender`). Visual bars follow your actual typography, not generic rectangular gray blocks.
3. **Clip-Aware Geometry**: Elements nested inside rounded containers or clipped bounds (`overflow: hidden`) compute intersecting bounding boxes (`clipWithin`) so bones mirror real borders and clips.
4. **Rich Animation Suite**:
   - **Bones animations**: `shimmer` (page-wide band), `group-shimmer` (per-skeleton), `pulse` (soft opacity wave), or `none`.
   - **Reveal modes**: `smart` (intelligent contextual reveal), `together` (fade together), `sequence` (staggered cascade from top to bottom), `sweep` (glossy gradient sweep across the reveal with automatic stall detection), and `instant`.
   - **Height easing**: When content height differs slightly from the skeleton guess, the container smoothly eases to the new height (`280ms`) rather than snapping.
5. **Stand-in Bones for Images**: Slow images don't block text from revealing. Content reveals on schedule while pending images remain covered by individual stand-in bones until decoded.
6. **Shape Memory**: Saves layouts under an `id` or auto-key to `localStorage` across user visits, ensuring second visits load instant skeleton shapes before network data resolves.
7. **SSR Pre-Paint Script**: Bundles a minimal inline script (`ResizeObserver`-driven) that measures server-rendered skeletons after layout and before the very first paint.

---

## Installation

```bash
pnpm add @alikhalilll/a-smart-skeleton
# or
npm install @alikhalilll/a-smart-skeleton
# or
yarn add @alikhalilll/a-smart-skeleton
```

Import styles in your main entry (if not using the Nuxt module):

```ts
import '@alikhalilll/a-smart-skeleton/styles.css';
```

---

## Nuxt 3 / 4 Setup

Add the module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-smart-skeleton/nuxt'],
  aSmartSkeleton: {
    prefix: 'A', // Optional prefix
    styles: true, // Automatically injects styles.css
  },
});
```

Components auto-imported in Nuxt:

- `<ASmartSkeleton>`
- `<ASmartSkeletonBox>`
- `<ASmartSkeletonSuspense>`
- `<ASmartSkeletonProvider>`

---

## Vue 3 Usage

### Basic Data-Driven Skeleton

When `data` is `null` or `undefined`, the skeleton measures the `sample` data. Once `data` resolves, it smoothly reveals the real content.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ASmartSkeleton } from '@alikhalilll/a-smart-skeleton';

interface User {
  name: string;
  role: string;
  avatar: string;
}

const SAMPLE_USER: User = {
  name: 'Alex Johnson',
  role: 'Senior Software Engineer',
  avatar: '',
};

const user = ref<User | null>(null);

// Simulating fetch
setTimeout(() => {
  user.value = {
    name: 'Sarah Connor',
    role: 'Cyberdyne Systems Lead',
    avatar: 'https://example.com/avatar.jpg',
  };
}, 1500);
</script>

<template>
  <ASmartSkeleton :data="user" :sample="SAMPLE_USER" id="user-profile" label="Loading user profile">
    <template #default="{ data }">
      <div class="user-card">
        <img :src="data.avatar" alt="Avatar" class="avatar" />
        <div class="meta">
          <h3>{{ data.name }}</h3>
          <p>{{ data.role }}</p>
        </div>
      </div>
    </template>
  </ASmartSkeleton>
</template>
```

---

### Reveal Modes

Select how content replaces its skeleton using the `reveal` prop:

```vue
<!-- Smart contextual reveal (default) -->
<ASmartSkeleton :data="user" :sample="SAMPLE_USER" reveal="smart">
  ...
</ASmartSkeleton>

<!-- Glossy sweep animation across the element -->
<ASmartSkeleton :data="user" :sample="SAMPLE_USER" reveal="sweep">
  ...
</ASmartSkeleton>

<!-- Top-to-bottom sequence cascade -->
<ASmartSkeleton :data="user" :sample="SAMPLE_USER" reveal="sequence">
  ...
</ASmartSkeleton>

<!-- Simple concurrent crossfade -->
<ASmartSkeleton :data="user" :sample="SAMPLE_USER" reveal="together">
  ...
</ASmartSkeleton>
```

Listen for when the reveal animation completes via `@reveal`:

```vue
<ASmartSkeleton :data="user" :sample="SAMPLE_USER" @reveal="onRevealed">
  ...
</ASmartSkeleton>
```

---

### States: Empty & Error

Handle error and empty states directly inside the skeleton boundary:

```vue
<ASmartSkeleton :data="items" :empty="items?.length === 0" :error="error">
  <template #default="{ data }">
    <ItemList :items="data" />
  </template>

  <template #empty>
    <p>No items found in this collection.</p>
  </template>

  <template #error="{ error }">
    <p class="error">Failed to load items: {{ error }}</p>
  </template>
</ASmartSkeleton>
```

---

### Standalone Skeleton Box

For manual placeholder boxes, use `<ASmartSkeletonBox>`:

```vue
<template>
  <div class="card">
    <ASmartSkeletonBox width="100%" height="200px" radius="8px" />
    <ASmartSkeletonBox width="70%" height="1.2em" radius="4px" />
    <ASmartSkeletonBox width="40%" height="1em" radius="4px" />
  </div>
</template>
```

---

### Suspense Integration

`<ASmartSkeletonSuspense>` handles Vue's `<Suspense>` boundary lifecycle, keeping an exact clone of the fallback skeleton in place to crossfade smoothly once async setup finishes:

```vue
<template>
  <ASmartSkeletonSuspense id="async-quote" reveal="smart">
    <AsyncQuoteComponent />
    <template #skeleton>
      <QuoteCard :quote="SAMPLE_QUOTE" />
    </template>
  </ASmartSkeletonSuspense>
</template>
```

---

### Global Provider & Theming

Configure colors, speed, animations, font metric edges, and CSP nonce across your whole app:

```vue
<template>
  <ASmartSkeletonProvider
    mode="system"
    :theme="{
      light: { base: 'rgb(0 0 0 / 0.07)', highlight: 'rgb(255 255 255 / 0.6)' },
      dark: { base: 'rgb(255 255 255 / 0.08)', highlight: 'rgb(255 255 255 / 0.1)' },
      radius: '6px',
      animation: 'shimmer',
      speed: 'slow',
      text: { top: 'ascender', bottom: 'descender' },
    }"
    reveal="smart"
    :debug="false"
  >
    <App />
  </ASmartSkeletonProvider>
</template>
```

---

## Web Components / Custom Element

Use the `<a-smart-skeleton-reveal>` custom element in standard HTML without Vue:

```html
<script type="module" src="@alikhalilll/a-smart-skeleton/element"></script>

<a-smart-skeleton-reveal loading id="article-preview" reveal="smart">
  <article>
    <h2>Article Title Headline</h2>
    <p>Detailed body paragraph explaining the context of the article.</p>
  </article>
</a-smart-skeleton-reveal>

<script>
  const el = document.querySelector('a-smart-skeleton-reveal');
  setTimeout(() => {
    el.show(`
      <article>
        <h2>Real Fetched Title</h2>
        <p>This is the real body text loaded over the wire.</p>
      </article>
    `);
  }, 2000);
</script>
```

---

## Author Hints & Attributes

Customize measuring behavior with attributes:

- `ask-ignore` / `[ask-ignore]`: Skip an element and its children during measurement.
- `ask-block` / `[ask-block]`: Force an element to be measured as a solid rectangle block rather than text lines.
- `ask-own` / `[ask-own]`: Subtree provides its own custom skeleton bones; measuring stops at this boundary.
- `ask-xray` / `[ask-xray]`: Debug mode that exposes the ghost tree through translucent bones.

---

## CSS Variables

| Variable            | Default                   | Description                                                     |
| ------------------- | ------------------------- | --------------------------------------------------------------- |
| `--ask-base`        | `rgb(128 128 128 / 0.2)`  | Base bone background color                                      |
| `--ask-highlight`   | `rgb(255 255 255 / 0.12)` | Shimmer sweep highlight color                                   |
| `--ask-radius`      | `0.25em`                  | Default border-radius for text lines and standalone boxes       |
| `--ask-animation`   | `shimmer`                 | Animation: `shimmer`, `group-shimmer`, `pulse`, `none`          |
| `--ask-speed`       | `slow`                    | Animation speed: `slow`, `fast`                                 |
| `--ask-text-top`    | `ascender`                | Top typographic boundary (`ascender`, `cap-height`, `x-height`) |
| `--ask-text-bottom` | `descender`               | Bottom typographic boundary (`baseline`, `descender`)           |

---

## License

MIT © [alikhalilll](https://github.com/alikhalilll)
