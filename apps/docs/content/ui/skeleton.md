---
title: ASkeleton
description: An auto-generating skeleton loader for Vue 3 / Nuxt 3+. First paint mirrors the slot's HTML structure; second load replays a pixel-aligned shape captured from the real DOM. Composable + primitive components let you craft custom skeleton flows.
package: '@alikhalilll/a-skeleton'
order: 2
---

# ASkeleton

A skeleton loader that **builds itself**. Wrap your real component and the first paint is a structural skeleton derived from the slot's vnode tree — same tags, same Tailwind classes, same layout. When the real content renders, a `ResizeObserver` captures its pixel-exact geometry into a cache. The next time `loading` flips back, the cache replays as positioned shimmer blocks aligned to ±1px.

```vue
<ASkeleton :loading="isFetching">
  <UserProfileCard :data="user" />
</ASkeleton>
```

That's the whole API for 90% of cases. For the other 10%, every layer the wrapper uses is a public export — composables, primitive blocks, pure utilities.

## Install & Setup

::doc-install{pkg="@alikhalilll/a-skeleton"}
::

### Nuxt 3 / 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-skeleton/nuxt'],
  css: ['@alikhalilll/a-skeleton/styles.css'],
});
```

After the module is registered, `<ASkeleton>`, `<ASkeletonLayer>`, and `<ASkeletonBlock>` are auto-imported app-wide.

### Vue + Vite

```ts
// main.ts
import '@alikhalilll/a-skeleton/styles.css';
```

For `unplugin-vue-components` auto-resolve:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import ASkeletonResolver from '@alikhalilll/a-skeleton/resolver';

export default { plugins: [Components({ resolvers: [ASkeletonResolver()] })] };
```

## Public API at a glance

| Export                                    | Kind       | When to reach for it                                                                                               |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `<ASkeleton>`                             | Component  | Default wrapper. Two-layer flow (structural pass → measured cache).                                                |
| `<ASkeletonLayer>`                        | Component  | Render a `CachedShape` directly. Use when you don't want the wrapper.                                              |
| `<ASkeletonBlock>`                        | Component  | Hand-crafted skeleton from primitive blocks. Flow-layout friendly.                                                 |
| `<StructuralSkeleton>`                    | Component  | Render a structural skeleton from any vnode tree (the cache-miss render path).                                     |
| `useSkeleton()`                           | Composable | Wire probe + cache + reactivity around your own DOM. Returns a reactive `shape`.                                   |
| `useShapeProbe()`                         | Composable | Lower-level. `ResizeObserver` + debounced capture; you manage the cache.                                           |
| `getCached` / `setCached` / `clearCached` | Function   | Imperative cache primitives. Read / write / wipe entries by key.                                                   |
| `walkDom()`                               | Function   | Synchronous one-shot measurement. Returns a `CachedShape`.                                                         |
| `buildStructuralSkeleton()`               | Function   | Pure: walk a vnode tree, return skeleton vnodes mirroring its layout.                                              |
| `fingerprintSlot()`                       | Function   | Slot-name fragment of the auto-generated default `cacheKey` (combined with `useId()` for per-instance uniqueness). |

The corresponding types are all named: `ASkeletonProps`, `ASkeletonLayerProps`, `ASkeletonBlockProps`, `ASkeletonSlots`, `CachedShape`, `ShapeNode`, `UseSkeletonOptions`, `UseSkeletonReturn`, `WalkOptions`, `BuildOptions`, `ShapeProbeOptions`, `SkeletonAnimation`, `SkeletonFallback`.

## Recipes

### Recipe 1 — `<ASkeleton>` · the default wrapper

::DemoSkeletonBasic
::

The wrapper handles measurement, caching, animation, and the structural fallback. Pass `loading`, wrap the real component, you're done.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const user = ref(null);
const loading = computed(() => user.value === null);

async function load() {
  user.value = await fetch('/api/me').then((r) => r.json());
}
load();
</script>

<template>
  <ASkeleton :loading="loading" cache-key="user-card">
    <div class="flex items-start gap-4 p-4">
      <img v-if="user?.avatar" :src="user.avatar" class="size-16 rounded-full" />
      <div v-else class="size-16 rounded-full" />

      <div class="flex-1">
        <h3>{{ user?.name }}</h3>
        <p>{{ user?.bio }}</p>
      </div>
    </div>
  </ASkeleton>
</template>
```

**Authoring rule** — gate **content** per leaf (e.g. `{{ user?.name }}`), not the **whole** template on `v-if="user"`. The structural pass can only mirror what the slot actually renders during loading. Gate everything on `v-if` and the walker sees only a comment, then falls back to a generic shimmer.

### Recipe 2 — `<ASkeletonBlock>` · hand-crafted from primitives

::DemoSkeletonBlock
::

When auto-capture isn't the right fit (custom designs, micro-interactions, splash screens), compose primitives directly. `<ASkeletonBlock>` is flow-layout friendly — drop it into flex, grid, stacks.

```vue
<template>
  <div v-if="loading" class="flex items-start gap-4 p-4">
    <ASkeletonBlock type="circle" :w="64" :h="64" />
    <div class="flex-1 space-y-2">
      <ASkeletonBlock type="text" :w="160" :h="18" />
      <ASkeletonBlock type="text" :w="100" :h="12" />
      <ASkeletonBlock type="text" :lines="3" :h="14" class="!mt-3" />
    </div>
  </div>
  <UserCard v-else :data="user" />
</template>
```

#### `<ASkeletonBlock>` props

| Prop        | Type                                       | Default     | Notes                                                               |
| ----------- | ------------------------------------------ | ----------- | ------------------------------------------------------------------- |
| `type`      | `'block' \| 'text' \| 'image' \| 'circle'` | `'block'`   | `circle` defaults `border-radius: 50%`.                             |
| `w`         | `number \| string`                         | —           | Width (number = px).                                                |
| `h`         | `number \| string`                         | —           | Height (number = px).                                               |
| `radius`    | `number \| string`                         | —           | Border radius (number = px).                                        |
| `lines`     | `number`                                   | `1`         | For `type='text'`, render N stacked bars; last is 70% width.        |
| `animation` | `'shimmer' \| 'pulse' \| 'none'`           | `'shimmer'` | Animation variant.                                                  |
| `class`     | `HTMLAttributes['class']`                  | —           | Class on the root (single block, or the stack for multi-line text). |

### Recipe 3 — `useSkeleton()` + `<ASkeletonLayer>` · DIY orchestration

::DemoSkeletonUseSkeleton
::

When you want the probe + cache + reactivity but not the wrapper. The composable returns a reactive `shape`; `<ASkeletonLayer>` replays it.

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSkeleton } from '@alikhalilll/a-skeleton';

const user = ref(null);
const loading = computed(() => user.value === null);
const containerRef = ref<HTMLElement | null>(null);

const { shape, captureNow, clear } = useSkeleton({
  cacheKey: 'user-card',
  // While loading, target is null → no capture. When real content mounts,
  // target returns the wrapper → ResizeObserver + capture.
  target: () => (loading.value ? null : containerRef.value),
  persist: true,
});

fetchUser().then((u) => (user.value = u));
</script>

<template>
  <div ref="containerRef">
    <ASkeletonLayer v-if="loading" :shape="shape" />
    <UserCard v-else :data="user" />
  </div>
</template>
```

#### `useSkeleton()` options

| Field              | Type                        | Default | Description                                                          |
| ------------------ | --------------------------- | ------- | -------------------------------------------------------------------- |
| `cacheKey`         | `string`                    | —       | Required. Identifier for the shape cache.                            |
| `target`           | `() => HTMLElement \| null` | —       | Getter for the element to measure. Return `null` to disable capture. |
| `persist`          | `boolean`                   | `false` | Mirror captured shape to `localStorage`.                             |
| `maxDepth`         | `number`                    | `6`     | Forwarded to `walkDom`.                                              |
| `maxNodes`         | `number`                    | `500`   | Forwarded to `walkDom`.                                              |
| `minSize`          | `number`                    | `4`     | Forwarded to `walkDom`.                                              |
| `resizeDebounceMs` | `number`                    | `150`   | `ResizeObserver` re-capture debounce window.                         |

#### `useSkeleton()` returns

| Field        | Type                                      | Description                                                              |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------------ |
| `shape`      | `Readonly<Ref<CachedShape \| undefined>>` | Reactive captured shape. `undefined` on cache miss.                      |
| `captureNow` | `() => CachedShape \| undefined`          | Force a measurement now. Returns the shape, or `undefined` if not ready. |
| `clear`      | `() => void`                              | Drop the cache entry for this `cacheKey`. `shape` flips to `undefined`.  |

#### `<ASkeletonLayer>` props

| Prop        | Type                             | Default     | Description                     |
| ----------- | -------------------------------- | ----------- | ------------------------------- |
| `shape`     | `CachedShape \| undefined`       | —           | Renders nothing when undefined. |
| `animation` | `'shimmer' \| 'pulse' \| 'none'` | `'shimmer'` | Animation variant.              |
| `class`     | `HTMLAttributes['class']`        | —           | Class on the layer wrapper.     |

### Recipe 4 — Pure utilities · build your own flow

When none of the components fit, drop down to the pure functions:

```ts
import {
  walkDom,
  buildStructuralSkeleton,
  fingerprintSlot,
  setCached,
  getCached,
} from '@alikhalilll/a-skeleton';

// One-shot synchronous measurement
const shape = walkDom(containerEl, { maxDepth: 6, maxNodes: 500, minSize: 4 });
setCached('user-card', shape, /* persist */ true);

// Default cacheKey derivation from a slot's vnodes
const key = fingerprintSlot(slots.default?.()); // 'UserCard' or 'div' or 'anonymous'

// Render skeleton VNodes for an arbitrary vnode tree (e.g. inside a render-function component)
const skeletonVNodes = buildStructuralSkeleton(slots.default?.() ?? [], {
  animationClass: 'a-skel-block--anim-shimmer',
  maxNodes: 300,
});
```

`walkDom` returns a frozen `CachedShape` with `width`, `height`, `nodes` (a `ShapeNode[]`), and `truncated` (true if the walk hit `maxNodes`).

### Recipe 5 — `useShapeProbe()` · probe without the cache

Use when you maintain the cache externally (Pinia, an API, server-rendered geometry).

```ts
import { useShapeProbe } from '@alikhalilll/a-skeleton';

useShapeProbe(() => containerRef.value, {
  maxDepth: 6,
  maxNodes: 500,
  resizeDebounceMs: 200,
  onCapture: (shape) => myStore.saveShape('user-card', shape),
});
```

## `<ASkeleton>` props

**Behaviour change in 1.x** — the default `cacheKey` is now per-instance (`<slot-name>:<useId()>`), so two unrelated `<ASkeleton>` wrappers no longer share a captured shape on the same page. Persisted localStorage entries from older builds carry no schema version, so they auto-purge on first read after upgrade. Pass an explicit `cacheKey` if you want the previous shared-cache behaviour (e.g. across a list of identical cards).

| Prop          | Type                             | Default            | Description                                                                                                                                                                                               |
| ------------- | -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loading`     | `boolean`                        | —                  | When `true`, show the skeleton.                                                                                                                                                                           |
| `cacheKey`    | `string`                         | auto, per instance | Auto-generated as `<slot-name>:<useId()>` so each instance has its own slot. Pass explicitly to share a captured shape across instances, or to differentiate prop-variant shapes from the same component. |
| `maxDepth`    | `number`                         | `6`                | Max recursion depth when capturing shape.                                                                                                                                                                 |
| `maxNodes`    | `number`                         | `500`              | Hard cap on captured / structural nodes. Walk bails out beyond this with `truncated: true`. `<ASkeleton>` logs a one-time `console.warn` per `cacheKey` when this cap is hit.                             |
| `minNodeSize` | `number`                         | `4`                | Skip elements smaller than this many CSS pixels (either axis) during capture.                                                                                                                             |
| `persist`     | `boolean`                        | `false`            | Mirror captured shape to `localStorage` so first-visit-after-reload skips the cold-start fallback. Payload is schema-versioned; entries from older releases auto-purge on read.                           |
| `animation`   | `'shimmer' \| 'pulse' \| 'none'` | `'shimmer'`        | Animation variant. `prefers-reduced-motion` disables animation automatically.                                                                                                                             |
| `fallback`    | `'shimmer' \| 'block'`           | `'shimmer'`        | Default cache-miss UI when no `#fallback` slot is provided.                                                                                                                                               |
| `class`       | `HTMLAttributes['class']`        | —                  | Class on the outer wrapper.                                                                                                                                                                               |

### Slots

| Slot       | Description                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `default`  | The real content. Rendered when `loading` is false; measured to build the skeleton. |
| `fallback` | Custom UI for cache misses. Defaults to a single full-width shimmer block.          |

### DOM escape hatches

Mark elements during the walk:

| Attribute              | Effect                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `data-skeleton-stop`   | Stop recursing into this element — render it as a single block. |
| `data-skeleton-ignore` | Skip this element entirely (no block emitted).                  |

## Theming

::DemoSkeletonThemed
::

Every visual primitive is a CSS variable prefixed `--ak-skeleton-`. Override on `:root`, on a wrapper class (multi-tenant), or inline. Defaults inherit from the shared `@alikhalilll/a-ui-base` token set so the skeleton matches whatever theme the rest of your app uses.

```css
/* Per-tenant override — applies to anything inside .tenant-acme */
.tenant-acme {
  --ak-skeleton-block: hsl(220 30% 18%);
  --ak-skeleton-shimmer: hsl(220 60% 60% / 0.35);
  --ak-skeleton-radius: 0.5rem;
  --ak-skeleton-duration: 2s;
}
```

```vue
<!-- Or inline, scoped to one tree -->
<ASkeleton :loading style="--ak-skeleton-block: hotpink; --ak-skeleton-radius: 9999px;">
  <UserCard :data="user" />
</ASkeleton>
```

### Tokens

| Variable                      | Default (dark)                        | Used for                                                        |
| ----------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `--ak-skeleton-block`         | `hsl(var(--ak-ui-muted) / 0.55)`      | Base block colour (top of the vertical gradient).               |
| `--ak-skeleton-block-soft`    | `hsl(var(--ak-ui-muted) / 0.32)`      | Fade colour (bottom of the vertical gradient).                  |
| `--ak-skeleton-shimmer`       | `hsl(var(--ak-ui-foreground) / 0.08)` | Moving-highlight colour of the shimmer sweep.                   |
| `--ak-skeleton-radius`        | `0.375rem`                            | Default border radius for blocks (text bars use 60% of this).   |
| `--ak-skeleton-duration`      | `1.6s`                                | Animation duration (shimmer + pulse).                           |
| `--ak-skeleton-pulse-opacity` | `0.48`                                | Min opacity at the trough of the pulse cycle.                   |
| `--ak-skeleton-shimmer-angle` | `110deg`                              | Sweep angle of the shimmer pseudo-element (90deg = horizontal). |
| `--ak-skeleton-ring`          | `hsl(var(--ak-ui-foreground) / 0.04)` | 1px inset ring that gives blocks definition without a border.   |

The `.light` scope overrides `--ak-skeleton-shimmer` to a brighter value so polarity stays correct (lighter sweep over the muted base in both light and dark mode).

## How the two-layer flow works

1. **Cache miss + loading** — `ASkeleton` walks the slot's vnode tree and renders a structural skeleton. Same tags, same `class` strings, atomic leaves (`<img>`, `<button>`) as shimmer blocks, text tags (`<h3>`, `<p>`) as bars. Tailwind utilities like `size-16` and `rounded-full` still apply, so the avatar circle and headline widths look right on the very first paint — without DOM measurement.
2. **Data arrives** — the real slot renders. A `ResizeObserver` + `requestAnimationFrame` pass walks the DOM, freezing per-block `x/y/w/h`, border-radius, and multi-line counts into a `CachedShape` keyed by `cacheKey`.
3. **Next loading flip** — cache hit. Positioned blocks render absolutely inside a layer sized to the previously measured bounding box. Pixel-aligned to ±1px.

## Performance

Designed for components with hundreds of leaf elements — busy dashboards, long lists, dense forms. Cost is bounded at every layer:

- **Walk budget** — `walkDom` stops emitting after `maxNodes` (default 500) and returns `CachedShape.truncated: true`. A 5000-row table will not lock up the main thread. `<ASkeleton>` logs a one-time `console.warn` per `cacheKey` when truncation happens, so missing nodes surface during development.
- **Min-size filter** — `minNodeSize` (default 4 px) drops hairlines / spacer dots.
- **Allocation-free render** — captured `ShapeNode`s carry frozen pre-computed styles. The cache-hit render loop reads them directly with no per-node function calls.
- **Batched DOM reads** — `getBoundingClientRect` + `getComputedStyle` happen in one top-down pass with no intervening writes.
- **Debounced re-capture** — initial measurement via `requestAnimationFrame`. Subsequent `ResizeObserver` callbacks debounced 150 ms.
- **CSS containment** — the layer uses `contain: layout style paint` + `content-visibility: auto`; each block uses `contain: strict` so per-block shimmer animations never trigger sibling layout/paint.
- **Composited shimmer** — only `transform: translateX(...)` changes each frame, with `will-change: transform` to lift each block to its own compositor layer up front.

## Limitations

- The structural pass mirrors what the slot's template actually renders during loading. Gate everything on `v-if="data"` and the walker sees only a comment — fall back to the generic shimmer.
- Captured shapes are snapshots. `ResizeObserver` re-measures when the wrapper resizes (debounced 150 ms). If you resize _during_ a skeleton render, the cached shape replays unchanged.
- SSR: the structural skeleton works during SSR (no `window` access needed). Pixel-aligned positioned blocks require a captured shape, which only happens client-side after mount.
- Two `<ASkeleton>` instances rendering the same component get separate caches by default — the auto-generated key includes `useId()`, so the slot is per-instance. Pass an explicit `cacheKey` to share one captured shape across, e.g., a list of identical cards.

> Theming tokens, multi-tenant CSS, and theming gotchas — see the [UI overview](/ui).
