---
title: ASmartSkeleton
description: Measured skeleton loaders for Vue 3 and Nuxt 3+. Captures your real component's layout — background, border, radius, box-shadow, text metrics — and replays it as a pixel-faithful placeholder. One template to maintain. Zero cumulative layout shift.
package: '@alikhalilll/a-smart-skeleton'
order: 2
---

# `@alikhalilll/a-smart-skeleton`

> Skeletons that **measure themselves** from your real component. One template. Pixel-accurate chrome. Zero layout shift. Ships on first paint.

::DemoSkeletonPostFeedMinimal
::

Everything in grey above was measured from the exact component below. No second template, no hand-authored placeholders, no drift between what the user sees while loading and what they get when the data lands.

## Why this exists

The industry default — a hand-authored `<ProductCardSkeleton>` sitting next to your `<ProductCard>` — is a second template you maintain forever. Padding changes on the real card, the skeleton drifts. Font size bumps, the bars go off. Images start loading later, the skeleton guesses wrong and the reveal jumps. The placeholder becomes a bug class of its own.

`ASmartSkeleton` sidesteps it: it lays your real content out invisibly, measures the live geometry with `getBoundingClientRect()` and Canvas 2D font metrics, and reconstructs a skeleton from what it saw. One template — the real one — stays the source of truth.

- **Zero layout shift** — bone positions come from the real DOM, not from a parallel template.
- **Pixel-faithful chrome** — card backgrounds, borders, radii, and box-shadows are captured verbatim and replayed on the skeleton's own `chrome` bones.
- **Typographic accuracy** — text bars follow the font's ascender and descender lines; no guessing at line heights.
- **Synchronized shimmer** — every bone syncs to the document clock, so late-mounting cards join the wave mid-sweep without a pop.
- **One-component state machine** — `loading`, `content`, `empty`, `error`, plus reveal transitions, all handled in a single `<ASmartSkeleton>`.

## Install

::doc-install{pkg="@alikhalilll/a-smart-skeleton"}
::

### Nuxt 3 / 4

Add the module. Components auto-register, styles are injected, the pre-paint boot script is set up for you.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-smart-skeleton/nuxt'],
});
```

### Vue 3 + Vite

Import the stylesheet in your entry. Optionally register the resolver so `unplugin-vue-components` auto-imports the four components on use.

```ts
// main.ts
import '@alikhalilll/a-smart-skeleton/styles.css';
```

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import ASmartSkeletonResolver from '@alikhalilll/a-smart-skeleton/resolver';

export default {
  plugins: [Components({ resolvers: [ASmartSkeletonResolver()] })],
};
```

Four components ship: `<ASmartSkeleton>`, `<ASmartSkeletonBox>`, `<ASmartSkeletonSuspense>`, `<ASmartSkeletonProvider>`.

## First use — the 10-line version

Wrap any component with `<ASmartSkeleton>`. Pass the data ref and a representative `sample`. While `data` is `null`, the plugin renders the sample unseen, measures its layout, and paints the skeleton. When data arrives, it reveals.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const user = ref<User | null>(null);

const SAMPLE_USER = {
  name: 'Sarah Connor',
  role: 'Chief Mitigation Officer',
  avatar: 'https://example.com/avatar.jpg',
};

onMounted(async () => {
  user.value = await $fetch('/api/me');
});
</script>

<template>
  <ASmartSkeleton id="user-card" :data="user" :sample="SAMPLE_USER">
    <template #default="{ data }">
      <UserCard :user="data" />
    </template>
  </ASmartSkeleton>
</template>
```

Three things to remember:

1. **Always pass a `sample`.** It's what the skeleton measures before real data arrives. Keep its shape as close as possible to the real response so the reveal doesn't jump.
2. **Give the skeleton a stable `id`.** Shape memory is keyed by `id` across visits, so returning users see the previous session's shape immediately instead of a generic fallback.
3. **Give images explicit `width` / `height` or an `aspect-ratio`.** Otherwise the skeleton can't reserve their space and the layout shifts when they load.

A live example of the above — a product card driven by `:data` + `:sample`:

::DemoSkeletonDataDriven
::

## Full playground

Every surface in the plugin is wired to a `<ASmartSkeletonProvider>`. The playground below binds every provider option to a control — reveal mode, animation style, colours — so you can watch the social feed respond to each change in real time.

::DemoSkeletonPostFeed
::

- **Reveal** chooses how the skeleton gives way to real content — same values as the [`reveal` prop](#reveal-transitions).
- **Motion** picks between the four built-in animation styles and swaps tempo.
- **Settings** (`⚙`) opens the colour editor, a debug-outlines toggle, and a reset.
- **Mode** isn't a control — it tracks the docs' own theme toggle, so flipping the site to dark re-tints the whole demo (including the chrome bones) automatically.

## State machine — `loading`, `content`, `empty`, `error`

One component handles all four states. Resolution order is `loading` → `error` → `empty` → `content`:

```vue
<ASmartSkeleton
  :data="posts"
  :sample="SAMPLE_POSTS"
  :error="fetchError"
  :empty="posts?.length === 0"
  @reveal="onContentRevealed"
>
  <template #default="{ data }">
    <PostList :posts="data" />
  </template>
  <template #empty>
    <EmptyIllustration message="No posts yet" />
  </template>
  <template #error="{ error }">
    <ErrorBanner :error="error" @retry="reload" />
  </template>
</ASmartSkeleton>
```

`@reveal` fires once per `skeleton → content` transition. It does not fire on error / empty transitions or on subsequent re-renders.

::DemoSkeletonStates
::

## Layout hints — `ask-block`, `ask-ignore`, `ask-own`

The walker is accurate by default, but three attributes let you override its decisions where it matters:

| Hint         | Class alias            | What it does                                                                                                                                                                           |
| ------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ask-block`  | `data-skeleton-block`  | Draws the element as **one** bone sized to its box + border-radius. Walker does not recurse. Use for action buttons where you want the whole pill instead of an icon + count fragment. |
| `ask-ignore` | `data-skeleton-ignore` | Element keeps its layout footprint but emits **zero** bones. Use for decorative dividers, small corner badges, or teleported modal shells that shouldn't be in the ghost tree.         |
| `ask-own`    | `data-skeleton-own`    | Subtree opts out of measurement — you're drawing its skeleton yourself. The walker stops at this boundary.                                                                             |

```vue
<article>
  <Header />

  <!-- icon + count collapses to a single pill bone -->
  <button type="button" data-ask-block class="rounded-full">
    <HeartIcon /> {{ count }}
  </button>

  <!-- decorative dot: leaves the layout slot, no bone -->
  <span data-ask-ignore class="status-dot" />
</article>
```

::DemoSkeletonHints
::

## Smooth resizing between skeleton and content

A skeleton drawn from `sample` data or a remembered shape is a guess. When the real data arrives with a different body length, image count, or line wrap, the frame around the swap doesn't snap — it eases from the outgoing pane's measured box to the incoming pane's live box over **`RESIZE_DURATION` (260 ms)** with Apple's **`REVEAL_EASING` (`cubic-bezier(0.32, 0.72, 0, 1)`)**, so a card that goes from 200 px to 600 px (or the other way) never jerks the viewer's eye.

::DemoSkeletonResizing
::

### Timings at a glance

| Constant                 | Default                          | What it drives                                                                                 |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `FADE_DURATION`          | 260 ms                           | Content pane fade-in — ends on the same frame as the resize                                    |
| `SKELETON_FADE_DURATION` | 160 ms                           | Skeleton pane fade-out — deliberately shorter so bones clear while the frame is still settling |
| `RESIZE_DURATION`        | 260 ms                           | Height ease on the `[ask-reveal]` container, and the outgoing pane's own lockstep shrink       |
| `REVEAL_EASING`          | `cubic-bezier(0.32, 0.72, 0, 1)` | Apple SF Pro curve shared by every reveal animation                                            |

All four are exported from `@alikhalilll/a-smart-skeleton` so a consumer can match an animation of their own to the skeleton's rhythm.

### Mechanism

1. The outgoing pane is taken out of flow (`position: absolute` at its measured box) via `popOut()`.
2. The parent momentarily lays out at the incoming pane's natural height — that reading is the resize's target.
3. A Web Animation on the parent's `height` interpolates from the outgoing box's height to the incoming pane's live height, with `overflow: clip` + `will-change: height` + `contain: layout` applied inline so the browser promotes the element onto its own compositor layer and the per-frame height change doesn't re-flow every ancestor.
4. **In lockstep**: when the outgoing pane was taller than the incoming one, a second animation runs on the outgoing pane's _own_ `height` with the same duration and easing, clipping its bones to the container's current size. Without this step, the skeleton's bottom portion would stay painted below where the real content settles.
5. The skeleton's own fade (`SKELETON_FADE_DURATION`, 160 ms) finishes well before the resize settles, so the viewer's eye isn't fighting a fading skeleton on top of content that's already laid out.

### Consumer-callable primitive — `easeHeight()`

For custom code paths (not just pane swaps), the package exports `easeHeight(root, from, to)` — the same primitive the reveal lifecycle uses internally:

```ts
import { easeHeight } from '@alikhalilll/a-smart-skeleton';

// Animate `panel` from its current height to 480 px with the package's canonical curve.
const from = panel.getBoundingClientRect().height;
panel.style.height = '480px';
easeHeight(panel, from, 480);
```

The built-in reveal is on by default and needs no consumer configuration. `prefers-reduced-motion: reduce` disables the ease entirely.

## Reveal transitions

The `reveal` prop picks how the skeleton gives way to real content:

| Mode       | Behaviour                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| `smart`    | Instant if the content lands under ~150 ms, otherwise crossfade — the human-friendly default. |
| `together` | Simple crossfade. Recommended for lists, where per-piece cascading reads as noise.            |
| `sequence` | Staggered top-to-bottom cascade.                                                              |
| `sweep`    | A highlight beam sweeps across the transition edge. Prettiest on wide cards.                  |
| `instant`  | Snap, no fade. Height still eases.                                                            |

`prefers-reduced-motion: reduce` forces `instant` automatically.

## Chrome capture — pixel-perfect card outlines

When the walker crosses a **painted container** — anything with a background, border, or box-shadow — it emits an extra `chrome` bone that reproduces that paint verbatim. The bone carries the captured `background`, per-side `border-*`, `border-radius`, and `box-shadow` inline, and skips the shimmer animation so it reads as an outline, not a placeholder fill.

This is why cards look right from the first frame — even partial borders (`border-t` on a footer divider) survive.

What chrome capture tracks:

- `backgroundColor` and `backgroundImage` (gradient layers only — `url(…)` layers are stripped so hero bitmaps don't re-download in the skeleton)
- Four border sides as separate paint — a one-sided border reads as a divider, not a box
- `border-radius`, per-corner where the parent's overflow clips it
- `box-shadow`

Chrome bones ignore `--ask-base` (they're not placeholders) and get `[ask-rect="chrome"]` so consumer CSS can target them separately.

## Theming

Everything is driven by CSS custom properties. A single declaration anywhere above the skeleton re-tints every bone inside:

```css
.my-feed {
  --ask-base: #d1d4dc;
  --ask-highlight: #ffffff;
  --ask-radius: 6px;
}
```

For app-wide defaults, wrap your app in `<ASmartSkeletonProvider>`. The provider also supports `mode="system"` which reads `prefers-color-scheme`:

```vue
<ASmartSkeletonProvider
  mode="system"
  :theme="{
    light: { base: '#d1d4dc', highlight: '#ffffff' },
    dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
    radius: '6px',
    animation: 'shimmer',
    speed: 'slow',
  }"
  reveal="smart"
>
  <App />
</ASmartSkeletonProvider>
```

### CSS variables

| Variable            | Default                           | Description                                                   |
| ------------------- | --------------------------------- | ------------------------------------------------------------- |
| `--ask-base`        | `rgb(128 128 128 / 0.2)`          | Fill of placeholder bones. Chrome bones ignore this.          |
| `--ask-highlight`   | `rgb(255 255 255 / 0.12)`         | Shimmer sweep colour.                                         |
| `--ask-radius`      | `0px` (text bars pill by default) | Border-radius applied to text bars and `<ASmartSkeletonBox>`. |
| `--ask-animation`   | `shimmer`                         | `shimmer` / `group-shimmer` / `pulse` / `none`.               |
| `--ask-speed`       | `slow`                            | `slow` / `fast`.                                              |
| `--ask-text-top`    | `ascender`                        | Which font line each text bar starts at.                      |
| `--ask-text-bottom` | `descender`                       | Which font line each text bar ends at.                        |

### Per-type bone styling

Bones ship as `<div [ask-rect="text|media|box|chrome"]>` in the light DOM (no shadow root), so consumer stylesheets reach them directly. A minimum 4-px radius is applied automatically to every non-chrome bone so nothing reads as a sharp glyph.

```css
/* The handcrafted `ASkeletonBlock` look — a soft inset ring on placeholder bones. */
[ask-rect='text'],
[ask-rect='box'] {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
```

| `[ask-rect]` value | Emitted by                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `text`             | Text-node per-line bars via `Range.getClientRects()`                                                         |
| `media`            | `<img>` / `<svg>` / `<video>` / `<canvas>` / `<picture>` / `<iframe>`                                        |
| `box`              | `<button>` / `<input>` / painted leaf elements / anything with `data-ask-block`                              |
| `chrome`           | Painted or divider-bordered container — carries its captured `background` / `border-*` / `box-shadow` inline |

## Multi-card shimmer sync

Six cards, each mounted a beat after the last, every bone sharing the same document-clock sweep. Nothing resets, nothing pops in out of phase. The pattern scales — paginated feeds, async grid cells, staggered data fetches, all stay in rhythm.

::DemoSkeletonShimmerSync
::

## `<ASmartSkeletonBox>` — standalone bars

When you need an explicit placeholder outside the automatic measurement path (loading states that don't wrap a component, inline progress strips, bespoke composite skeletons):

```vue
<div class="flex items-center gap-3">
  <ASmartSkeletonBox width="40px" height="40px" radius="999px" />
  <div class="flex-1 flex flex-col gap-1.5">
    <ASmartSkeletonBox width="60%" height="1rem" radius="4px" />
    <ASmartSkeletonBox width="40%" height="0.75rem" radius="4px" />
  </div>
</div>
```

`<ASmartSkeletonBox>` shares the same document-clock shimmer, respects the provider, and honours the `--ask-*` variables.

## Debugging a wrong-looking skeleton

If the measured skeleton doesn't line up with your real card — bones in the wrong places, padding missing, cards too narrow — turn on the built-in trace. The plugin ships a `traceMeasurement()` logger that fires once per element the walker touches, so you can see exactly what the DOM looks like **when the ghost tree is being measured**.

### Enable it

Any one of these flips the plugin into debug mode:

- Add `?ask-debug` to the URL
- Run `localStorage.setItem('a-smart-skeleton:debug', '1')` in DevTools, then reload
- Call `setDebug(true)` once from your app code
- Add an `ask-debug` attribute to any ancestor of the `<ASmartSkeleton>` you're investigating (scopes the trace to that subtree)

### Reading the trace

Open DevTools and trigger a skeleton render (cold refresh, sort change, anything that puts `:data` back to `null`). The console fills with lines like:

```
[a-smart-skeleton] <header> 456×60  padding:4px 20px 16px 20px
{ class: 'flex gap-3 items-start px-5 pb-4 pt-4', element: <header…> }

[a-smart-skeleton] <div> 420×38  padding:0px 0px 0px 0px  · ⚠ 0-padding
{ class: 'flex flex-col', element: <div…> }
```

Each line is one element's measured box, with its class list, computed `padding`, and width × height. The `⚠ 0-padding` marker appears on containers that have non-empty children but no inner padding — the common signal that something went wrong between what you wrote and what the browser rendered.

Pick the element you care about (usually one that should have padding but doesn't) and look at three things:

| What you see                                                                                                       | What it means                                                                                                                                                                             | Fix                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The expected class is in `class:` **and** padding is non-zero                                                      | Everything's fine. The visual problem is elsewhere (CSS specificity, parent `overflow`, a wrapper collapsing margins).                                                                    | Look upstream.                                                                                                                                                             |
| The expected class is in `class:` **but** padding is `0px 0px…`                                                    | The class reached the DOM but your CSS didn't emit the rule. Classic UnoCSS/Tailwind lazy-scan miss — the utility isn't in the output bundle because the scanner didn't see it.           | Add the utility to your CSS tool's safelist, or make sure the component's source file is covered by the scan globs.                                                        |
| The expected class is **not** in `class:`                                                                          | Vue dropped it. Happens when a child component has a true fragment root (multiple top-level elements, not `v-if`/`v-else`). Vue can't auto-forward the fallthrough class into a fragment. | Collapse the child to a single root with `:class` branching inside, or use `defineOptions({ inheritAttrs: false })` + manual `:class="[…own, $attrs.class]"` on each root. |
| `class:` includes utilities but `padding` is correct **in the real card** and wrong **only in the skeleton trace** | The ghost tree rendered before an async style settled — fonts, lazy CSS modules, etc.                                                                                                     | Preload the font / stylesheet, or set an explicit `aspect-ratio` on the container so the first-paint measurement is correct.                                               |

The plugin reads the **real DOM** at measurement time. The `<MyComponent />` tag you wrote in your template has already been compiled away — only the component's output is in the DOM. The trace just makes the gap visible, so you can fix it at the right layer (Vue template, CSS tool config, or wherever the drop actually happened).

## Accessibility

- `aria-busy="true"` on the outer wrapper while loading.
- The `label` prop renders as visually hidden text inside an `[ask-status]` element — screen readers hear `label` instead of silence.
- Skeleton panes are `aria-hidden="true"` and `inert`, so assistive tech doesn't try to announce empty shapes.
- `(prefers-reduced-motion: reduce)` disables the shimmer and collapses the reveal to `instant`.

```vue
<ASmartSkeleton :data="profile" :sample="SAMPLE_PROFILE" label="Loading your profile">
  ...
</ASmartSkeleton>
```

## API reference

### `<ASmartSkeleton>` props

| Prop      | Type         | Default              | Description                                                                |
| --------- | ------------ | -------------------- | -------------------------------------------------------------------------- |
| `data`    | `T \| null`  | `undefined`          | Your real data. The skeleton is active while this is `null` / `undefined`. |
| `sample`  | `T`          | `undefined`          | Stand-in used to measure the layout before real data arrives.              |
| `loading` | `boolean`    | `undefined`          | Force the skeleton on or off, overriding `data` detection.                 |
| `id`      | `string`     | `undefined`          | Key for cross-visit shape memory. Highly recommended.                      |
| `label`   | `string`     | `undefined`          | Screen-reader text announced in place of the skeleton.                     |
| `empty`   | `boolean`    | `false`              | Renders `#empty` slot.                                                     |
| `error`   | `unknown`    | `undefined`          | Renders `#error="{ error }"` slot.                                         |
| `reveal`  | `RevealMode` | provider / `'smart'` | Reveal transition — see **Reveal transitions** above.                      |

### Slots

| Slot       | Receives    | When                                                |
| ---------- | ----------- | --------------------------------------------------- |
| `default`  | `{ data }`  | `data` is non-null (also the `empty` fallback).     |
| `empty`    | —           | `empty` is true.                                    |
| `error`    | `{ error }` | `error` is truthy.                                  |
| `skeleton` | —           | Optional custom skeleton — opts out of measurement. |

### Events

| Event    | Payload | Fires when                                                       |
| -------- | ------- | ---------------------------------------------------------------- |
| `reveal` | —       | Real content takes over from a skeleton, exactly once per cycle. |

### `<ASmartSkeletonProvider>` props

| Prop     | Type                            | Description                                                                           |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `theme`  | `SkeletonTheme`                 | `{ light, dark, radius, animation, speed, text }`.                                    |
| `mode`   | `'light' \| 'dark' \| 'system'` | Which theme half to apply.                                                            |
| `reveal` | `RevealMode`                    | Default reveal for every skeleton inside.                                             |
| `debug`  | `boolean`                       | Outlines every reveal pane and labels its source (sample / data / recall / fallback). |
| `nonce`  | `string`                        | CSP nonce for the inline boot script and injected stylesheet.                         |

### `<ASmartSkeletonBox>` props

| Prop     | Type     | Default        | Description     |
| -------- | -------- | -------------- | --------------- |
| `width`  | `string` | `100%`         | Any CSS length. |
| `height` | `string` | `1em`          | Any CSS length. |
| `radius` | `string` | `--ask-radius` | Any CSS length. |

### Author hints (HTML attributes)

| Attribute    | Alias                  | Effect                                                                                   |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| `ask-block`  | `data-skeleton-block`  | Draw as one bone, no recursion.                                                          |
| `ask-ignore` | `data-skeleton-ignore` | Keep the layout footprint, emit no bones.                                                |
| `ask-own`    | `data-skeleton-own`    | Subtree draws its own skeleton.                                                          |
| `ask-debug`  | `data-skeleton-debug`  | Scope the measurement trace to this subtree. See **Debugging a wrong-looking skeleton**. |

### Timing constants + helpers

Imported from `@alikhalilll/a-smart-skeleton` (or `/core`):

| Export                       | Signature / value                | What it does                                                                                            |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `FADE_DURATION`              | `260`                            | Content pane fade length.                                                                               |
| `SKELETON_FADE_DURATION`     | `160`                            | Skeleton pane fade length (shorter — bones clear before the frame settles).                             |
| `RESIZE_DURATION`            | `260`                            | Height ease length.                                                                                     |
| `REVEAL_EASING`              | `cubic-bezier(0.32, 0.72, 0, 1)` | Shared curve for every reveal animation.                                                                |
| `easeHeight(root, from, to)` | —                                | Animate any element's height along the package's canonical curve. Reused internally by every pane swap. |
| `setDebug(on: boolean)`      | —                                | Switch debug mode on or off globally.                                                                   |
| `traceMeasurement(el, …)`    | —                                | Logs one element's class list, computed padding, and measured bounds. Called by the measure walker.     |
| `debugging(el?)`             | —                                | Returns `true` when the global debug flag is set, or when `el` has an `[ask-debug]` ancestor.           |

## Patterns and pitfalls

**Match sample height to real height.** The plugin warns `layout jumped on reveal` when the real data differs from the measured sample by more than 1 px. Fix by making the `sample` shape mimic the real shape — same number of text lines, same avatar size — not by silencing the warning.

**Give images dimensions.** An `<img>` without `width` / `height` or `aspect-ratio` reports zero height until it loads, so the skeleton reserves no space and the reveal shifts. Set at least one.

**Prefer `data` + `sample` over `loading`.** The `loading` prop is an escape hatch. Normal usage is to bind `data` and let the skeleton auto-activate when it's `null`.

**Use `id` religiously.** A stable `id` lets the plugin recall the previous shape from memory, so a user returning to a page sees the real card's shape immediately, not a generic fallback.

**Use `reveal="together"` on lists.** The default `smart` picks `byRow` for lists with more than a few pieces, which stacks a per-card cascade on top of the pane fade and the height ease — three animations fighting each other. `together` collapses the list entry into one crossfade that lands with the resize.

**`v-if`-gate teleported modals inside the ghost tree.** Dialogs with `<Teleport to="body">` or `<ClientOnly>` roots render children inline at their declared location until they move to the target on hydration — the walker measures that inline shell and emits ghost bones for it. Wrap them in `v-if="open"` so they don't exist in the DOM until needed.

**Chrome bones ≠ bone fill.** If you re-tint via `--ask-base`, the card outline keeps whatever colour the real `<article>` had. That's chrome capture working as intended — you're changing bone fill, not real paint.
