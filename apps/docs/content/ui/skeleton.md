---
title: ASkeleton
description: A self-generating skeleton loader for Vue 3 / Nuxt 3+. Three rendering strategies (clone, mirror, structural), comprehensive style capture, per-line text geometry, fifteen named variants, themeable via CSS variables.
package: '@alikhalilll/a-skeleton'
order: 2
---

# `@alikhalilll/a-skeleton`

> A self-generating skeleton loader for Vue 3 / Nuxt 3+.
> Three rendering strategies (clone, mirror, structural) · pixel-identical computed-style snapshot ·
> per-line text geometry via `Range` API · 15 named variants · themeable via CSS variables · SSR-safe mirror mode.

::DemoSkeletonClone
::

::DemoSkeletonGrid
::

## Setup

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

`<ASkeleton>`, `<ASkeletonLayer>`, `<ASkeletonBlock>`, and every variant primitive (`<ASkeletonCard>`, `<ASkeletonText>`, …) are auto-imported app-wide.

### Vue + Vite

```ts
// main.ts
import '@alikhalilll/a-skeleton/styles.css';
```

Optional auto-resolve via `unplugin-vue-components`:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import ASkeletonResolver from '@alikhalilll/a-skeleton/resolver';

export default { plugins: [Components({ resolvers: [ASkeletonResolver()] })] };
```

## Quick start

```vue
<ASkeleton :loading="loading">
  <SomePricingCard />
</ASkeleton>
```

That's the whole API for most cases — the demo at the top of this page is exactly that wrapper around a pricing card. `mode="clone"` is the default: the wrapper mounts the slot off-screen, snapshots every leaf's `getComputedStyle()` (per-edge borders, per-corner radii, background, shadow, opacity, filter, transform, typography), and replays the snapshot as positioned divs each carrying its captured inline style. Pixel-identical, client-side only.

Every layer underneath is also a public export — see the [API reference](#api-reference).

## Why this component

- **Self-generating** — wrap your real component and the engine derives the placeholder from the slot you're already rendering. No hand-drawn shimmer markup, no parallel "loading state" templates to maintain.
- **Three rendering strategies, one wrapper** — `mode="clone"` (default) snapshots `getComputedStyle()` for pixel-identical replay regardless of styling pipeline; `mode="mirror"` walks the vnode tree for SSR-safe placeholders; `useSkeleton()` + `<ASkeletonLayer>` for structural / normal-flow skeletons that reflow with their parent.
- **Comprehensive surface capture** — per-edge borders, per-corner radii, background colour + image, box-shadow, opacity, filter, transform, mix-blend-mode, typography — every visible CSS property carries through so the skeleton reads as the real element, not a generic shimmer.
- **Per-line text geometry** — `Range.getClientRects()` captures the exact rendered text rect of every line. Wrapped paragraphs, centred multi-line headings, and RTL last-line positions replay 1:1 — no heuristics.
- **15 named variants** — for the rare cases where auto-detect isn't the right fit (loading states without real content to wrap, very dense layouts, screens you'd rather author once).
- **Bounded cost** — every walker enforces `maxDepth` / `maxNodes` / `minSize`. A 5 000-row table will not lock up the main thread.
- **Themeable via CSS variables** — override `--ak-skel-*` on `:root`, a wrapper class, or inline.
- **Empty-interpolation aware** — `<h3>{{ data?.name }}</h3>` with null data still shimmers at the heading's natural rendered height.
- **`prefers-reduced-motion`** disables animation automatically.
- **SSR-safe (mirror)** — no `window` access during the structural pass; hydration is clean.
- **TypeScript-first** — every prop, slot, type, and composable fully typed.

## Three rendering strategies

Pick the one that matches how your styles get to the DOM:

| Strategy              | Surface                              | How geometry is derived                                                                                                                                           | Best when                                                                                                       |
| --------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Clone** _(default)_ | `<ASkeleton :loading>`               | Mounts the slot off-screen, snapshots every leaf's **computed style** via `getComputedStyle()`, replays as positioned divs each carrying its captured inline CSS. | Styles come from any pipeline. Pixel-identical. Client-side only.                                               |
| **Mirror**            | `<ASkeleton mode="mirror" :loading>` | Walks the slot's **vnode** tree at render time. Preserves every tag and `class`.                                                                                  | SSR-safe placeholders (no DOM read needed) or when the static class is enough.                                  |
| **Structural**        | `useSkeleton()` + `<ASkeletonLayer>` | Walks the real **DOM** tree, preserves container layout, replaces leaves with `<div class="a-skel">` in **normal flow**.                                          | The skeleton should reflow with its parent, or you're orchestrating cache + capture outside a wrapper instance. |

All three share one cache module, one theming surface, and the same a11y baseline.

### Clone — the default

The slot mounts off-screen inside a `visibility: hidden` capture host. After mount, `captureSnapshot()` reads `getComputedStyle()` for every element — capturing the **final** background, per-edge border, per-corner radius, box-shadow, padding, opacity, filter, transform, typography — plus per-line text rects via `Range.getClientRects()`. `<ASkeletonClone>` then replays the snapshot as a tree of positioned divs each carrying its captured inline style.

> **Authoring tip.** Clone mode snapshots the slot _as rendered during loading_. If the slot uses interpolations (`<h3>{{ data?.name }}</h3>`) and your data isn't there yet, the snapshot captures empty text rects — the heading shimmers at its natural single line height, but a multi-line paragraph collapses to one bar. Either ensure data is present before the capture runs (start with `loading: false`, let the snapshot land, then toggle), use `mode="mirror"` (which doesn't measure — see [below](#mirror-ssr-safe-vnode-walker)), or hand-craft the placeholder with [variant primitives](#variant-primitives) and `<ASkeletonBlock>`.

```vue
<ASkeleton :loading="loading">
  <SomeRichComponent />
</ASkeleton>
```

The capture API is a public export — power-users can roll their own capture / replay flow:

```ts
import { captureSnapshot, type CaptureSnapshot } from '@alikhalilll/a-skeleton';

const snap: CaptureSnapshot = captureSnapshot(myRootEl, {
  maxDepth: 12,
  maxNodes: 800,
  minSize: 4,
});
```

### Mirror — SSR-safe vnode walker

::DemoSkeletonAdvanced
::

Switch to `mode="mirror"` when you need the placeholder on the server, or when your styles already drive the surface correctly from class names alone:

```vue
<ASkeleton mode="mirror" :loading="loading">
  <SomeRichComponent />
</ASkeleton>
```

`buildStructuralSkeleton()` walks the slot's vnode tree at render time, preserves every element with its real `class` / inline `style`, and replaces text-bearing leaves with `<span class="a-skel-text-content">` (transparent text + skeleton background, exact rendered width via `box-decoration-break: clone`). Atomic / interactive tags (`<img>`, `<button>`, `<svg>`) become `<div class="a-skel-block">` sized from their original class.

Text-owner tags with empty content (`<h3>{{ data?.name }}</h3>` during loading) auto-shimmer at the heading's natural rendered height — the walker injects a placeholder text-content span so the bar's height tracks the tag's font-size / line-height.

#### Complex hero

::DemoSkeletonComplexHero
::

A landing-page hero — gradient background, decorative SVG circles, large heading with an accent span, paragraph, two CTA buttons, three icon + text feature rows, screenshot block. Every element is preserved with its real classes; only text, images, and icons get the shimmer treatment.

What `walkDom` captures per leaf to support cache-replay across reloads (mirror mode with `persist: true`):

| Signal                 | Source                                                                          | Effect                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background colour      | `getComputedStyle().backgroundColor` (skipped if transparent)                   | A white pricing card stays white. A coloured badge keeps its tint.                                                                                        |
| Composite border       | `borderTopWidth` + `borderTopStyle` + `borderTopColor` (skipped if width < 0.5) | Outlined buttons keep their ring.                                                                                                                         |
| Box-shadow             | `boxShadow` verbatim if not `none`                                              | Elevated cards keep their elevation.                                                                                                                      |
| Opacity                | `opacity` when < 1                                                              | Translucent chips replay as translucent.                                                                                                                  |
| Per-line text geometry | `Range.selectNodeContents(el).getClientRects()`                                 | Each rendered line of text gets a bar at its exact left + width. Wrapped paragraphs, centred multi-line headings, and RTL last-line positions replay 1:1. |
| Text-align (fallback)  | `getComputedStyle().textAlign`                                                  | When Range isn't usable, the synthesized last-line position honours `center` / `right` / `end` so RTL still looks right.                                  |

### Structural / normal-flow

::DemoSkeletonUseSkeleton
::

For cases where the wrapper isn't your unit of orchestration — caching shapes across instances, persisting between sessions, or wanting the skeleton to reflow with its parent — reach for `useSkeleton()` + `<ASkeletonLayer>`:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSkeleton } from '@alikhalilll/a-skeleton';

const props = defineProps<{ userId: string }>();
const user = ref(null);
const loading = computed(() => user.value === null);
const containerRef = ref<HTMLElement | null>(null);

const { shape, clear } = useSkeleton({
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
    <ASkeletonLayer v-if="loading && shape" :shape="shape" />
    <ColdStartFallback v-else-if="loading" />
    <UserCard v-else :data="user" />
  </div>
</template>
```

`walkStructural()` produces a frozen tree where containers preserve their tag, original `class`, and captured layout CSS (`display`, `flex-*`, `gap`, `padding`, `grid-*`, `box-sizing`), and leaves carry inline `width` / `height` + visual signals. `<ASkeletonLayer>` replays the tree in **normal flow** — the skeleton lives inside its parent's layout instead of overlaying it with absolute coordinates, so it reflows on viewport resize and never collapses to a flat positioned grid.

Given real markup like:

```html
<div class="flex flex-col gap-4 p-4">
  <h3>…</h3>
  <p>…</p>
  <button>…</button>
</div>
```

…the layer replays as:

```html
<div
  class="flex flex-col gap-4 p-4"
  style="display: flex; flex-direction: column; gap: 16px; padding: 16px; box-sizing: border-box"
>
  <div class="a-skel" style="width: 200px; height: 24px; …" />
  <div class="a-skel" style="width: 280px; height: 16px; …" />
  <div class="a-skel" style="width: 120px; height: 36px; …" />
</div>
```

The structural cache uses its own `localStorage` namespace (`a-skeleton:s:` prefix, schema `v: 3`). Stale flat-shape entries (`v: 2`) and structural-shape entries cannot collide on the same `cacheKey`; mismatched versions auto-purge on read.

## Authoring rule

::DemoSkeletonBasic
::

Keep **tags** unconditional; gate per-leaf **content** via interpolation. Two safe patterns:

1. **Always render the same tag**, gate its content. `<img :src="user?.avatar">` renders an `<img>` in both states (walker treats it as atomic → sized shimmer block). `<h3>{{ user?.name }}</h3>` renders an empty `<h3>` during loading and the walker auto-injects a placeholder shimmer bar at the heading's natural width.
2. **Use explicit primitives** with `v-if` / `v-else` (see [`<ASkeletonBlock>`](#askeletonblock) and the [variant primitives](#variant-primitives)) when the loading and loaded states genuinely have different markup.

The pattern to **avoid** is swapping whole branches (`<img v-if><div v-else>`). The walker sees one shape now and a different shape later — the skeleton can't predict the placeholder geometry.

```vue
<ASkeleton :loading="loading">
  <div class="flex items-start gap-4 p-4">
    <img
      :src="user?.avatar"
      :alt="user?.name ?? ''"
      class="size-16 shrink-0 rounded-full object-cover"
    />
    <div class="flex-1">
      <h3 class="text-base font-semibold">{{ user?.name }}</h3>
      <p class="text-sm leading-relaxed">{{ user?.bio }}</p>
    </div>
  </div>
</ASkeleton>
```

> **Sequencing matters in clone mode.** The first snapshot is taken when the slot mounts. If `loading` is `true` at that point and your slot uses `{{ user?.bio }}` style interpolations, the captured geometry reflects the **empty** strings — a multi-line bio shows up as a single bar because that's literally all there is to measure. The demo above starts with the real profile already loaded so the snapshot captures the multi-line paragraph; toggling "Show skeleton" then replays that captured layout. For production code, either preload your data, render with a placeholder that hides under the real value, or use `mode="mirror"` (where the vnode walker emits per-tag placeholders without needing a measurement).

## Lists & grids — `v-for`, `#prototype`, `repeat`

Lists of cards are the most common loading state, and two details make them work cleanly.

**1. Always supply a `#prototype` when the default slot iterates.** The component does **not** auto-detect `v-for` and pick the first sibling — heuristics over keyed siblings misfire on legitimate-but-similar markup, and you're the only one who knows authoritatively which element is the prototype. The `#prototype` slot gives the skeleton an explicit single-instance template to measure; it takes precedence over the default slot during loading and is never rendered when `loading=false`. Without `#prototype`, the default slot is used as the shape source verbatim — so an empty `v-for` during the initial load produces a blank skeleton.

**2. `:repeat="N"` × the prototype fills the grid.** The wrapper carries your layout class (`grid grid-cols-3 gap-4`, `flex flex-wrap`, …), and the prototype copies become direct grid/flex children. Set `:repeat` to the expected item count so the loading state occupies the same visual area as the loaded state — no layout shift when data arrives.

The user's failing case (cards-with-switch-and-buttons in a responsive grid) now reads exactly like the loaded code:

```vue
<ASkeleton
  :loading="loading"
  :repeat="6"
  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
>
  <!-- Prototype: one card. Used as the skeleton shape while loading. -->
  <template #prototype>
    <article class="p-5 rounded-lg bg-white flex flex-col gap-3 ring-1 ring-gray-200">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ t('admin.users.roles.list.users_count', { n: 0 }) }}</p>
        <UiSwitch :model-value="false" />
      </div>
      <h3 class="text-lg text-gray-900 font-bold">{{ t('admin.users.roles.placeholder') }}</h3>
      <div class="pt-2 flex gap-2 items-center justify-end">
        <UiButton type="button" variant="outline">{{ t('admin.users.roles.actions.view_users') }}</UiButton>
        <UiButton type="button" variant="ghost">{{ t('admin.users.roles.actions.edit') }}</UiButton>
      </div>
    </article>
  </template>

  <!-- Real content. Rendered when loading=false. -->
  <article
    v-for="role in roles"
    :key="role?.id"
    class="p-5 rounded-lg bg-white flex flex-col gap-3 ring-1 ring-gray-200"
  >
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500">{{ t('admin.users.roles.list.users_count', { n: role.users_count ?? 0 }) }}</p>
      <UiSwitch
        :model-value="Boolean(role.is_active)"
        @update:model-value="(v) => toggleStatus(role, v)"
      />
    </div>
    <h3 class="text-lg text-gray-900 font-bold">{{ role.name }}</h3>
    <div class="pt-2 flex gap-2 items-center justify-end">
      <UiButton type="button" variant="outline" @click="goToRoleUsers(role)">
        {{ t('admin.users.roles.actions.view_users') }}
      </UiButton>
      <UiButton type="button" variant="ghost" @click="goToEdit(role)">
        <template #suffix><Icon name="lucide:pencil" class="size-4" /></template>
        {{ t('admin.users.roles.actions.edit') }}
      </UiButton>
    </div>
  </article>
</ASkeleton>
```

What this gets you:

- **No wrapper churn.** The `class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"` lives on `<ASkeleton>` itself, so the grid container is the same DOM element in both states. The `lg:grid-cols-3` breakpoints kick in identically while loading and after.
- **Six skeleton cards** while loading, each shaped like one real card (`:repeat="6"`), laid out by the grid. When data arrives, the same grid populates with the real `v-for` items.
- **Vue components inside the prototype work.** `<UiSwitch>`, `<UiButton>`, and `<Icon>` are walked into via their slot children — the button text shimmers as a text-bar inside a button-shaped wrapper, the switch becomes a switch-shaped block, the icon becomes an icon-sized block. Components that render a wrapper with sub-`minNodeSize` children fall back to a single block at the component's own rect rather than disappearing.
- **No skeleton classes leak when not loading.** With `loading=false` the wrapper carries only `grid grid-cols-…` — no `a-skeleton`, no inner `__capture`, no `aria-busy`. The DOM is exactly what you'd write by hand.
- **Empty `class` opt-out.** If you don't pass a `class`, the wrapper switches to `display: contents` when not loading — invisible to `parent > article` selectors, so flex/grid parents still target your real items.

**When may you skip `#prototype`?** When the default slot has a single, static, representative element (not iterated with `v-for`). In that case the default slot IS the shape:

```vue
<ASkeleton :loading="loading" :repeat="3" class="grid grid-cols-3 gap-4">
  <article class="…">…one static card…</article>
</ASkeleton>
```

The single article is used verbatim as the prototype and repeated three times. Anything iterated — `v-for`, async lists, conditional groups — should go through `#prototype` to keep the shape predictable.

## API reference

### `<ASkeleton>` props

| Prop          | Type                             | Default            | Description                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loading`     | `boolean`                        | —                  | When `true`, show the skeleton.                                                                                                                                                                                                                                      |
| `mode`        | `'clone' \| 'mirror'`            | `'clone'`          | Rendering strategy. `clone` snapshots `getComputedStyle()`; `mirror` walks the vnode tree (SSR-safe).                                                                                                                                                                |
| `cacheKey`    | `string`                         | auto, per-instance | Auto-generated as `<slot-fingerprint>:<useId()>` so each instance has its own slot. Pass explicitly to share a captured shape across instances or to differentiate prop-variant shapes from the same component.                                                      |
| `maxDepth`    | `number`                         | `16`               | Max recursion depth when capturing.                                                                                                                                                                                                                                  |
| `maxNodes`    | `number`                         | `600`              | Hard cap on captured / structural nodes. Walks bail beyond this with `truncated: true` and a one-time `console.warn` per `cacheKey`.                                                                                                                                 |
| `minNodeSize` | `number`                         | `4`                | Skip elements smaller than this many CSS pixels (either axis).                                                                                                                                                                                                       |
| `persist`     | `boolean`                        | `false`            | Mirror captured shape to `localStorage`. Schema-versioned; entries from older releases auto-purge on read.                                                                                                                                                           |
| `animation`   | `'shimmer' \| 'pulse' \| 'none'` | `'shimmer'`        | Animation variant. `prefers-reduced-motion` disables animation automatically.                                                                                                                                                                                        |
| `fallback`    | `'shimmer' \| 'block'`           | `'shimmer'`        | Default cache-miss UI when no `#fallback` slot is provided (mirror mode only).                                                                                                                                                                                       |
| `repeat`      | `number`                         | `1`                | Number of prototype copies to render while loading. Pair with a `grid` / `flex` class on `<ASkeleton>` to fill the layout 1:1 with the eventual loaded content — no shift when data arrives.                                                                         |
| `class`       | `HTMLAttributes['class']`        | —                  | Class on the wrapper. Persists across `loading=true` ↔ `false` so layout classes (`grid grid-cols-3 gap-4`, …) keep working in both states. When omitted and `loading=false`, the wrapper falls back to `display: contents` so it's invisible to surrounding layout. |

### Slots

| Slot        | Description                                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`   | The real content. Rendered when `loading` is false; the slot's first iteration is also used as the skeleton's shape source when no `#prototype` is provided.                           |
| `prototype` | Optional single-instance template used as the shape source while loading. Takes precedence over the default slot. Pair with `:repeat="N"` when the default slot iterates with `v-for`. |
| `fallback`  | Custom UI for cache misses (mirror mode). Defaults to a single full-width shimmer block.                                                                                               |

### DOM escape hatches

Mark elements during the walk via data attributes — applies to all three strategies:

| Attribute              | Effect                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `data-skeleton-stop`   | Stop recursing into this element — render as a single block carrying its outer `class` / `style`.           |
| `data-skeleton-ignore` | Skip the element entirely (no block emitted). Use for decorative chrome that should always render verbatim. |

Skeleton-ise **content**, not **chrome**. If a component's identity is its gradient background / decorative SVGs, wrap only the inner content with `<ASkeleton>` and let the container always render. Mark decorations with `data-skeleton-ignore` so the walker treats them as invisible.

### Variant primitives

::DemoSkeletonVariants
::

When auto-capture isn't the right fit, drop in a named variant. Each accepts `animation="pulse | shimmer | wave | none"`, `class`, and inline `style`. Every variant ships `role="status"`, `aria-busy="true"`, and a visually-hidden `<span class="a-skel-sr-only">Loading…</span>`.

| Component             | Maps to                                    | Key props                                              |
| --------------------- | ------------------------------------------ | ------------------------------------------------------ |
| `<ASkeletonText>`     | n stacked bars, last line shorter          | `lines`, `width`                                       |
| `<ASkeletonHeading>`  | one bar sized to heading level             | `level` (1–6), `width`                                 |
| `<ASkeletonAvatar>`   | circle / square / rounded                  | `size`, `shape`                                        |
| `<ASkeletonImage>`    | aspect-ratio rect + image-icon placeholder | `ratio`, `width`, `height`, `showIcon`                 |
| `<ASkeletonVideo>`    | rect + play-icon placeholder               | `ratio`, `width`, `height`, `showIcon`                 |
| `<ASkeletonButton>`   | rounded rect, filled or outlined           | `width`, `height`, `outlined`                          |
| `<ASkeletonInput>`    | bordered rect with caret bar inside        | `width`, `height`                                      |
| `<ASkeletonChip>`     | small pill                                 | `width`, `height`                                      |
| `<ASkeletonListItem>` | avatar + n text lines + trailing slot      | `avatar`, `lines`, `trailing`                          |
| `<ASkeletonCard>`     | media + heading + paragraph + actions      | `media`, `heading`, `lines`, `actions`, `footerAvatar` |
| `<ASkeletonTable>`    | header row + n × m body cells              | `rows`, `columns`, `showHeader`                        |
| `<ASkeletonChart>`    | n vertical bars of varying heights         | `bars`, `height`, `showHeader`                         |
| `<ASkeletonForm>`     | label + input pairs + submit               | `fields`, `showSubmit`                                 |
| `<ASkeletonArticle>`  | heading + media + n paragraphs             | `media`, `paragraphs`, `linesPerParagraph`             |
| `<ASkeletonDivider>`  | thin shimmer rule                          | `thickness`                                            |

### `<ASkeletonBlock>`

::DemoSkeletonBlock
::

Single-block primitive for hand-crafted skeletons. Flow-layout friendly — composes with flex, grid, stacks.

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

| Prop        | Type                                       | Default     | Notes                                                        |
| ----------- | ------------------------------------------ | ----------- | ------------------------------------------------------------ |
| `type`      | `'block' \| 'text' \| 'image' \| 'circle'` | `'block'`   | `circle` defaults `border-radius: 50%`.                      |
| `w`         | `number \| string`                         | —           | Width (number = px).                                         |
| `h`         | `number \| string`                         | —           | Height (number = px).                                        |
| `radius`    | `number \| string`                         | —           | Border radius (number = px).                                 |
| `lines`     | `number`                                   | `1`         | For `type='text'`, render N stacked bars; last is 70% width. |
| `animation` | `'shimmer' \| 'pulse' \| 'none'`           | `'shimmer'` | Animation variant.                                           |
| `class`     | `HTMLAttributes['class']`                  | —           | Class on the root.                                           |

### `<ASkeletonLayer>`

Renders a `StructuralShape` (from `useSkeleton()` or `walkStructural()`) in normal flow.

| Prop        | Type                             | Default     | Description                                                                                                |
| ----------- | -------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `shape`     | `StructuralShape \| undefined`   | —           | Renders nothing when `undefined`. The layer is a transparent shell — captured containers carry the layout. |
| `animation` | `'shimmer' \| 'pulse' \| 'none'` | `'shimmer'` | Animation variant.                                                                                         |
| `class`     | `HTMLAttributes['class']`        | —           | Class on the layer wrapper.                                                                                |

### Composables

#### `useSkeleton(options) → { shape, captureNow, clear }`

Wires the DOM probe + structural cache + reactivity around a target element. The reactive `shape` feeds `<ASkeletonLayer>`.

| Option             | Type                        | Default | Description                                                          |
| ------------------ | --------------------------- | ------- | -------------------------------------------------------------------- |
| `cacheKey`         | `string`                    | —       | Required. Identifier for the shape cache.                            |
| `target`           | `() => HTMLElement \| null` | —       | Getter for the element to measure. Return `null` to disable capture. |
| `persist`          | `boolean`                   | `false` | Mirror captured shape to `localStorage`.                             |
| `maxDepth`         | `number`                    | `12`    | Forwarded to `walkStructural`.                                       |
| `maxNodes`         | `number`                    | `500`   | Forwarded to `walkStructural`.                                       |
| `minSize`          | `number`                    | `4`     | Forwarded to `walkStructural`.                                       |
| `resizeDebounceMs` | `number`                    | `150`   | `ResizeObserver` re-capture debounce.                                |

Returns `{ shape: Readonly<Ref<StructuralShape | undefined>>, captureNow: () => StructuralShape | undefined, clear: () => void }`.

#### `useShapeProbe(getTarget, options)`

Lower-level — `ResizeObserver` + debounced capture without the cache. You manage persistence (Pinia, API, server-rendered geometry). The `capture` option swaps in any strategy:

```ts
import { useShapeProbe, walkStructural } from '@alikhalilll/a-skeleton';

useShapeProbe(() => containerRef.value, {
  maxDepth: 12,
  resizeDebounceMs: 200,
  capture: walkStructural, // default is walkDom (flat); pass walkStructural for the tree shape.
  onCapture: (shape) => myStore.saveShape('user-card', shape),
});
```

### Pure utilities

When none of the components fit, drop down to the pure functions:

| Symbol                                     | Returns                  | Purpose                                                                               |
| ------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------- |
| `walkDom(el, options)`                     | `CachedShape` (flat)     | One-shot synchronous capture — positioned-block model, root-relative absolute coords. |
| `walkStructural(el, options)`              | `StructuralShape` (tree) | One-shot synchronous capture — preserves container layout, normal-flow replay.        |
| `captureSnapshot(el, options)`             | `CaptureSnapshot` (tree) | Comprehensive computed-style snapshot used by clone mode.                             |
| `buildStructuralSkeleton(vnodes, options)` | `VNode[]`                | Mirror-mode renderer for any vnode tree (e.g. inside a render-function component).    |
| `fingerprintSlot(vnodes)`                  | `string`                 | Slot-name fragment of the auto `cacheKey` (`'UserCard'`, `'div'`, or `'anonymous'`).  |

### Cache primitives

| Symbol                                     | Namespace                                   | Purpose                                                            |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------ |
| `getCached(key, persist)`                  | flat (`a-skeleton:` prefix, `v: 2`)         | Lookup for the legacy flat-shape cache (mirror cache-replay path). |
| `setCached(key, value, persist)`           | flat                                        | Store a flat shape.                                                |
| `clearCached(key?)`                        | flat **and** structural                     | Wipes both namespaces.                                             |
| `getCachedStructural(key, persist)`        | structural (`a-skeleton:s:` prefix, `v: 3`) | Lookup for the tree-shape cache.                                   |
| `setCachedStructural(key, value, persist)` | structural                                  | Store a tree shape.                                                |
| `clearCachedStructural(key?)`              | structural only                             | Wipes only the structural namespace.                               |

Persisted entries carry a schema version. Mismatched versions auto-purge on read — upgrades can't replay wrong geometry from a previous version's cache.

## Theming

::DemoSkeletonThemed
::

Light / dark is driven entirely by the `--ak-skel-*` tokens — set them to dark values under `.dark` (or however your app gates dark mode) and everything follows.

### CSS custom properties

Set these on `:root` (or any ancestor) to retint every primitive:

| Token                 | Used for                                                      |
| --------------------- | ------------------------------------------------------------- |
| `--ak-skel-base`      | Block fill (also used by text bars and variant primitives).   |
| `--ak-skel-base-soft` | Secondary endpoint for variants that use a vertical gradient. |
| `--ak-skel-highlight` | Shimmer / wave sweep colour.                                  |
| `--ak-skel-radius`    | Default block border radius.                                  |
| `--ak-skel-radius-sm` | Tighter radius for text bars, chips.                          |
| `--ak-skel-radius-lg` | Wider radius for cards, images.                               |
| `--ak-skel-duration`  | Animation cycle length.                                       |
| `--ak-skel-pulse-min` | Opacity at the trough of the pulse cycle.                     |
| `--ak-skel-ring`      | Subtle 1-px inset ring colour.                                |
| `--ak-skel-icon`      | Placeholder icon colour (image / video variants).             |

Backward-compat aliases for v1 token names (`--ak-skeleton-block`, `--ak-skeleton-shimmer`, `--ak-skeleton-radius`, `--ak-skeleton-duration`, `--ak-skeleton-pulse-opacity`, `--ak-skeleton-ring`) are kept — existing consumer overrides continue to work.

```css
/* Per-tenant override — applies to anything inside .tenant-acme */
.tenant-acme {
  --ak-skel-base: hsl(220 30% 18%);
  --ak-skel-highlight: hsl(220 60% 60% / 0.35);
  --ak-skel-radius: 0.5rem;
  --ak-skel-duration: 2s;
}
```

```vue
<!-- Or inline, scoped to one tree -->
<ASkeleton :loading style="--ak-skel-base: hotpink; --ak-skel-radius: 9999px;">
  <UserCard />
</ASkeleton>
```

### Multi-tenant + dark mode

Three strategies, all built in:

- **`.dark` class scope** — apply `.dark` to any ancestor (Tailwind / shadcn / `nuxt-color-mode` convention). The package ships `:where(.dark) { --ak-skel-base: hsl(220 13% 22%) … }` so dark tokens kick in automatically.
- **`@media (prefers-color-scheme: dark)`** — falls back to OS preference when no explicit `.dark` / `.light` class is on an ancestor.
- **Explicit `.light` class** — wins back light tokens (consumer override).

Variant-specific overrides also work — e.g. `<ASkeletonImage style="--ak-skel-base: hsl(200 50% 90%)">` retints one instance.

## Animations

| Value     | What                                                               | Default? |
| --------- | ------------------------------------------------------------------ | -------- |
| `shimmer` | gradient sweep ::after, contained per block via `overflow: hidden` | yes      |
| `pulse`   | opacity 1 → `--ak-skel-pulse-min` → 1 over `--ak-skel-duration`    | —        |
| `wave`    | gradient via `background-position` (sliding)                       | —        |
| `none`    | static blocks                                                      | —        |

`prefers-reduced-motion: reduce` disables every animation automatically (`animation: none !important` + the shimmer pseudo-element drops to a static low-opacity overlay).

## Accessibility

- Every wrapper / layer / variant root carries `role="status"` while loading.
- `aria-busy="true"` mirrors the loading state.
- `aria-live="polite"` so screen readers announce the loading state without interrupting the user.
- A visually-hidden `<span class="a-skel-sr-only">Loading…</span>` ships with every variant primitive.
- Every emitted shimmer surface carries `aria-hidden="true"` — the placeholder is decorative; the announcement is the wrapper's job.
- Mirror-mode skeletons disable `user-select` and `pointer-events` on the slot tree so the placeholder can't be interacted with mid-load.
- `prefers-reduced-motion` strips animation.

## Performance

Designed for components with hundreds of leaf elements — busy dashboards, long lists, dense forms.

- **Walk budget** — every walker (`walkDom`, `walkStructural`, `captureSnapshot`) enforces `maxNodes` (defaults 500 / 500 / 800) and reports `truncated: true`. A 5 000-row table will not lock up the main thread. `<ASkeleton>` logs a one-time `console.warn` per `cacheKey` whenever a capture truncates so missing nodes surface during development.
- **Min-size filter** — `minSize` (default 4 px) drops hairlines / spacer dots.
- **One-layout reads** — `getBoundingClientRect()` + `getComputedStyle()` happen in a single top-down pass with no intervening writes. One layout up front, then cached values.
- **Allocation-free render** — captured nodes carry frozen pre-computed styles.
- **Debounced re-capture** — initial measurement via `requestAnimationFrame`; subsequent `ResizeObserver` callbacks debounced 150 ms.
- **CSS containment** — `.a-skeleton[data-loading]` uses `overflow: clip` + `contain: paint`, so shadows / filters / transforms can't bleed outside the box.
- **Composited shimmer** — only `transform: translateX(...)` changes each frame, with `will-change: transform` lifting blocks to their own compositor layer up front.

## SSR

- **`mode="mirror"`** is fully SSR-safe — the walker runs on vnodes, no `window` access required.
- **`mode="clone"`** is client-side only (needs `getComputedStyle()` + a real DOM). The wrapper renders the slot's normal markup on the server; the snapshot + replay kick in on hydration.
- **`useSkeleton()`** runs in `onMounted` and bails out cleanly when `window` is undefined.

If you need a server-rendered placeholder before hydration finishes, use `mode="mirror"` or hand-craft with `<ASkeletonBlock>` / variant primitives.

## TypeScript

Import the public types from the main entry:

```ts
import type {
  ASkeletonProps,
  ASkeletonSlots,
  ASkeletonLayerProps,
  ASkeletonBlockProps,
  CachedShape,
  ShapeNode,
  ShapeNodeType,
  StructuralShape,
  StructuralNode,
  ContainerNode,
  LeafNode,
  LeafKind,
  CaptureSnapshot,
  CapturedNode,
  UseSkeletonOptions,
  UseSkeletonReturn,
  ShapeProbeOptions,
  CaptureStrategy,
  WalkOptions,
  WalkStructuralOptions,
  CaptureOptions,
  BuildOptions,
  SkeletonAnimation,
  SkeletonFallback,
} from '@alikhalilll/a-skeleton';
```

## Browser support

Modern evergreen browsers — last two versions of Chrome, Edge, Firefox, Safari, and the matching mobile WebViews. Uses `Range.getClientRects()` (universal since 2017), `ResizeObserver` (universal since 2020), and CSS `contain: paint` (universal since 2022). No polyfills required.

`overflow: clip` falls back to `overflow: hidden` on older browsers via the standard CSS cascade — no JavaScript fallback needed.

## Troubleshooting

**The skeleton is blank.**
Make sure your slot's tags are rendered unconditionally. If the slot is `<div v-if="data">…</div>`, the walker sees one comment during loading and falls back to a generic shimmer. Gate **content** per leaf via `{{ data?.field }}`, not the entire template on `v-if`.

**An empty `<h3>{{ data?.name }}</h3>` doesn't shimmer.**
This was the v1 walker's behaviour. v2+ classifies empty text-owner tags (`<h1>`-`<h6>`, `<p>`, `<span>`, …) as text bars rather than generic blocks, so the heading shimmers at its natural rendered height.

**My `<button>` loses its background colour.**
Mirror mode keeps real `bg-*` classes — the engine detects an explicit background and skips the skeleton fallback. If your button has no `bg-*` class and no inline `background`, the walker assumes you want the default skeleton fill. Either add `bg-emerald-600` (or whatever) explicitly, or wrap the inner text in `<ASkeletonBlock>` and let the real `<button>` render around it.

**The clone-mode replay drifts after a viewport resize.**
Clone mode captures absolute coordinates at the moment of snapshot. Resize-aware skeletons should use the structural strategy (`useSkeleton()` + `<ASkeletonLayer>`) — captured containers preserve their flex / grid layout and reflow with the parent.

**The structural-mode skeleton looks like a single block, not a tree.**
The cache may be stale from an older version. `localStorage` entries with schema version `v: 2` (from the `walkDom`-flat-model) won't load as `v: 3` structural shapes. Call `clearCachedStructural()` once after upgrading, or wait for the auto-purge on next read.

**A decorative SVG / background image renders as a giant skeleton block.**
Mark it with `data-skeleton-ignore` so the walker treats it as invisible. The slot's chrome (gradients, decorative shapes) should always render verbatim; the skeleton is for **content**.

**The structural skeleton's flex / grid layout breaks when rendered in a different CSS context.**
Containers preserve both the original `class` (for utility CSS) and the resolved layout CSS as inline `style`. If your styles aren't present at the mount point, the inline `display: flex; flex-direction: column; gap: 16px;` fallback still drives the layout.

> Theming tokens, multi-tenant CSS, and theming gotchas — see the [UI overview](/ui).
