# @alikhalilll/a-skeleton

> Self-generating skeleton loaders for Vue 3 / Nuxt 3+. First paint mirrors the slot's HTML structure; second load replays a pixel-aligned shape captured from the real DOM. Themeable via CSS variables.

```vue
<ASkeleton :loading="isFetching">
  <UserProfileCard :data="user" />
</ASkeleton>
```

That's the whole API for 90% of cases. For the other 10%, every layer the wrapper uses is a public export — composables, primitive blocks, pure utilities.

---

## Install

```bash
pnpm add @alikhalilll/a-skeleton
```

```ts
import '@alikhalilll/a-skeleton/styles.css';
```

### Nuxt 3 / 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-skeleton/nuxt'],
  css: ['@alikhalilll/a-skeleton/styles.css'],
});
```

Auto-imports `<ASkeleton>`, `<ASkeletonLayer>`, `<ASkeletonBlock>`.

### Vue + Vite (unplugin-vue-components)

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import ASkeletonResolver from '@alikhalilll/a-skeleton/resolver';

export default { plugins: [Components({ resolvers: [ASkeletonResolver()] })] };
```

---

## Public API at a glance

| Export                                    | Kind       | When to reach for it                                                             |
| ----------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `<ASkeleton>`                             | Component  | The default wrapper. Two-layer flow (structural pass → measured cache).          |
| `<ASkeletonLayer>`                        | Component  | Render a `CachedShape` directly. Use when you don't want the wrapper.            |
| `<ASkeletonBlock>`                        | Component  | Hand-crafted skeleton from primitive blocks. Flow-layout friendly.               |
| `<StructuralSkeleton>`                    | Component  | Render a structural skeleton from any vnode tree (the cache-miss render path).   |
| `useSkeleton()`                           | Composable | Wire probe + cache + reactivity around your own DOM. Returns a reactive `shape`. |
| `useShapeProbe()`                         | Composable | Lower-level. `ResizeObserver` + debounced capture; you manage the cache.         |
| `getCached` / `setCached` / `clearCached` | Function   | Imperative cache primitives. Read / write / wipe entries by key.                 |
| `walkDom()`                               | Function   | Synchronous one-shot measurement. Returns a `CachedShape`.                       |
| `buildStructuralSkeleton()`               | Function   | Pure: walk a vnode tree, return skeleton vnodes mirroring its layout.            |
| `fingerprintSlot()`                       | Function   | Default `cacheKey` derivation — first non-comment vnode's component name.        |

Types: `ASkeletonProps`, `ASkeletonLayerProps`, `ASkeletonBlockProps`, `ASkeletonSlots`, `CachedShape`, `ShapeNode`, `ShapeNodeType`, `SkeletonAnimation`, `SkeletonFallback`, `UseSkeletonOptions`, `UseSkeletonReturn`, `ShapeProbeOptions`, `WalkOptions`, `BuildOptions`.

---

## Recipes

### Recipe 1 — `<ASkeleton>` · the default wrapper

Drop it in, pass `loading`, you're done.

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
    <!-- Keep structure unconditional; gate per leaf so the structural pass has
         something to mirror during loading. -->
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

**Authoring rule** — gate **content**, not **structure**. The structural pass walks whatever the slot actually renders during loading. If you gate the whole template on `v-if="data"`, the walker sees a comment and falls back to a generic shimmer.

### Recipe 2 — `<ASkeletonBlock>` · hand-crafted from primitives

For custom designs where you'd rather author the skeleton yourself than rely on auto-capture. Flow-layout friendly — composes with flex, grid, stacks.

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

When you want the probe + cache + reactivity but don't want the wrapper. The composable returns a reactive `shape`; `<ASkeletonLayer>` replays it.

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSkeleton } from '@alikhalilll/a-skeleton';

const props = defineProps<{ userId: string }>();
const user = ref(null);
const loading = computed(() => user.value === null);
const containerRef = ref<HTMLElement | null>(null);

const { shape, captureNow, clear } = useSkeleton({
  cacheKey: `user-card:${props.userId}`,
  // While loading, target is null → no capture. When real content mounts,
  // target returns the wrapper → ResizeObserver + capture.
  target: () => (loading.value ? null : containerRef.value),
  persist: true,
});

fetchUser(props.userId).then((u) => (user.value = u));
</script>

<template>
  <div ref="containerRef">
    <ASkeletonLayer v-if="loading" :shape="shape" />
    <UserCard v-else :data="user" />
  </div>
</template>
```

**`useSkeleton` options** — `cacheKey` (required), `target?`, `persist?`, `maxDepth?`, `maxNodes?`, `minSize?`, `resizeDebounceMs?`.

**`useSkeleton` returns** — `{ shape: Readonly<Ref<CachedShape | undefined>>, captureNow: () => CachedShape | undefined, clear: () => void }`.

**`<ASkeletonLayer>` props** — `shape?: CachedShape`, `animation?: 'shimmer' \| 'pulse' \| 'none'`, `class?`.

### Recipe 4 — Pure utilities · build your own flow

`walkDom`, `buildStructuralSkeleton`, `fingerprintSlot` are pure functions. Use them when none of the components fit.

```ts
import {
  walkDom,
  buildStructuralSkeleton,
  fingerprintSlot,
  setCached,
  getCached,
} from '@alikhalilll/a-skeleton';

// Take a measurement yourself and stash it
const shape = walkDom(containerEl, { maxDepth: 6, maxNodes: 500, minSize: 4 });
setCached('user-card', shape, /* persist */ true);

// Derive a default cacheKey from a slot
const key = fingerprintSlot(slots.default?.()); // 'UserCard' or 'div' or 'anonymous'

// Render skeleton vnodes for an arbitrary tree (e.g. inside a render-function component)
const skeletonVNodes = buildStructuralSkeleton(slots.default?.() ?? [], {
  animationClass: 'a-skel-block--anim-shimmer',
  maxNodes: 300,
});
```

### Recipe 5 — `useShapeProbe()` · probe without the cache

Use when you maintain the cache externally (e.g. Pinia store, server-rendered geometry).

```ts
import { useShapeProbe } from '@alikhalilll/a-skeleton';

useShapeProbe(() => containerRef.value, {
  maxDepth: 6,
  maxNodes: 500,
  resizeDebounceMs: 200,
  onCapture: (shape) => myStore.saveShape('user-card', shape),
});
```

---

## `<ASkeleton>` props

| Prop          | Type                             | Default     | Description                                                                                          |
| ------------- | -------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `loading`     | `boolean`                        | —           | When `true`, show the skeleton.                                                                      |
| `cacheKey`    | `string`                         | slot's name | Identifier for the shape cache. Pass explicitly when one component renders different shapes by prop. |
| `maxDepth`    | `number`                         | `6`         | Max recursion depth when capturing shape.                                                            |
| `maxNodes`    | `number`                         | `500`       | Hard cap on captured / structural nodes. Walk bails out beyond this with `truncated: true`.          |
| `minNodeSize` | `number`                         | `4`         | Skip elements smaller than this many CSS pixels (either axis) during capture.                        |
| `persist`     | `boolean`                        | `false`     | Mirror captured shape to `localStorage` so first-visit-after-reload skips the cold-start fallback.   |
| `animation`   | `'shimmer' \| 'pulse' \| 'none'` | `'shimmer'` | Animation variant. `prefers-reduced-motion` disables animation automatically.                        |
| `fallback`    | `'shimmer' \| 'block'`           | `'shimmer'` | Default cache-miss UI when no `#fallback` slot is provided.                                          |
| `class`       | `HTMLAttributes['class']`        | —           | Class on the outer wrapper.                                                                          |

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

### Cache helpers

```ts
import { getCached, setCached, clearCached } from '@alikhalilll/a-skeleton';

clearCached(); // wipe every shape
clearCached('user-card'); // wipe one key
setCached('user-card', shape, true); // write + persist
const shape = getCached('user-card', true);
```

---

## Theming

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
  <UserCard />
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

---

## How the two-layer flow works

1. **Cache miss + loading** — `ASkeleton` walks the slot's vnode tree and renders a structural skeleton. Same tags, same `class` strings, atomic leaves (`<img>`, `<button>`) as shimmer blocks, text tags (`<h3>`, `<p>`) as bars. Tailwind utilities like `size-16` and `rounded-full` still apply, so the avatar circle and headline widths look right on the very first paint — without DOM measurement.
2. **Data arrives** — the real slot renders. A `ResizeObserver` + `requestAnimationFrame` capture pass walks the DOM, freezing per-block `x/y/w/h`, border-radius, and multi-line counts into a `CachedShape` keyed by `cacheKey`.
3. **Next loading flip** — cache hit. Positioned blocks render absolutely inside a layer sized to the previously measured bounding box. Pixel-aligned to ±1px.

## Performance

Designed for components with hundreds of leaf elements (busy dashboards, long lists, dense forms). Cost is bounded at every layer:

- **Walk budget** — `walkDom` stops emitting after `maxNodes` (default 500) and returns `CachedShape.truncated: true`. A 5000-row table will not lock up the main thread. The structural pass enforces a separate cap (default 300).
- **Min-size filter** — `minNodeSize` (default 4 px) drops hairlines / spacer dots.
- **Allocation-free render** — captured `ShapeNode`s carry frozen, pre-computed `style` and `lineStyles` objects. Per-type block class strings are pre-joined once per animation value. The cache-hit render loop reads them directly with no per-node function calls.
- **Batched DOM reads** — `getBoundingClientRect` + `getComputedStyle` happen in one top-down pass with no intervening writes. One layout up front instead of one per element.
- **Debounced re-capture** — initial measurement via `requestAnimationFrame`. Subsequent `ResizeObserver` callbacks debounced 150 ms so a drag-resize doesn't trigger a re-walk per frame.
- **CSS containment** — `.a-skeleton__layer` uses `contain: layout style paint` + `content-visibility: auto` so off-screen blocks skip rendering; `.a-skel-block` inside uses `contain: strict` so per-block shimmer animations never trigger sibling layout/paint.
- **Composited shimmer** — only `transform: translateX(...)` changes each frame on the shimmer pseudo-element, with `will-change: transform` to lift each block to its own compositor layer up front.

## Limitations

- The structural pass mirrors what the slot's template actually renders during loading. Gate everything on `v-if="data"` and the walker sees only a comment — fall back to the generic shimmer.
- Captured shapes are snapshots. `ResizeObserver` re-measures when the wrapper resizes (debounced 150 ms). If you resize _during_ a skeleton render, the cached shape replays unchanged.
- SSR: the structural skeleton works during SSR (no `window` access needed). Pixel-aligned positioned blocks require a captured shape, which only happens client-side after mount.

## License

MIT © alikhalilll
