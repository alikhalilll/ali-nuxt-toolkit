---
title: ASmartSkeleton
description: Intelligent, zero-shift skeleton loaders for Vue 3 and Nuxt 3+. Lays real content out unseen in normal DOM flow, traces typographic font metrics and element boxes, then reveals with smooth synchronized animations.
package: '@alikhalilll/a-smart-skeleton'
order: 2
---

# `@alikhalilll/a-smart-skeleton`

> Measured skeleton loaders for Vue 3 and Nuxt 3+. Captures your real component's layout — background, border, radius, box-shadow, text lines, and media boxes — and replays it as a pixel-faithful placeholder. One template to maintain. Zero cumulative layout shift.

::DemoSkeletonPostFeedMinimal
::

A real social-feed card, a `Refresh` button, and that's the whole surface. Every bone you see during the loading phase was measured from the exact elements that follow — chrome, text lines, avatars, and action pills. No second template to maintain, no manual placeholder to keep in sync.

## Why this exists

Hand-authored skeletons are the second template you have to maintain. Padding changes on the real card, the skeleton drifts. Font size bumps, the bars go off. Images start loading later, the skeleton guesses wrong and the reveal jumps.

`ASmartSkeleton` sidesteps the whole problem: it lays your real content out invisibly, measures the live geometry, and reconstructs a skeleton from what it saw. One template — the real one — stays the source of truth.

- **Zero layout shift** — bone positions come from `getBoundingClientRect()` on the real DOM.
- **Faithful chrome** — card backgrounds, borders, radii, and box-shadows are captured verbatim and replayed on the skeleton's own bones.
- **Typographic accuracy** — text bars follow the font's ascender and descender lines via Canvas 2D font metrics.
- **Synchronized shimmer** — every bone syncs to the document clock, so late-mounting cards join the wave mid-sweep without a pop.
- **Rich state machine** — one component handles `loading`, `content`, `empty`, `error`, plus reveal transitions.

## Install

::doc-install{pkg="@alikhalilll/a-smart-skeleton"}
::

**Nuxt 3 / 4** — add the module, components auto-import:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-smart-skeleton/nuxt'],
});
```

**Vue 3 + Vite** — import the stylesheet and optionally register the resolver:

```ts
// main.ts
import '@alikhalilll/a-smart-skeleton/styles.css';
```

```ts
// vite.config.ts  (optional, for unplugin-vue-components auto-import)
import Components from 'unplugin-vue-components/vite';
import ASmartSkeletonResolver from '@alikhalilll/a-smart-skeleton/resolver';

export default {
  plugins: [Components({ resolvers: [ASmartSkeletonResolver()] })],
};
```

Four components auto-register: `<ASmartSkeleton>`, `<ASmartSkeletonBox>`, `<ASmartSkeletonSuspense>`, `<ASmartSkeletonProvider>`.

## Customize

The same social feed from the top of this page, wired to a live control panel. Every pill is bound to the `<ASmartSkeletonProvider>` that wraps it, so each change takes effect on the next refresh. Pick a reveal mode, switch the animation, retint the placeholder bones — the real posts and the measured skeleton both follow.

::DemoSkeletonPostFeed
::

- **Reveal** chooses how the skeleton gives way to real content — same values as the `reveal` prop.
- **Motion** picks between the four animation styles the plugin ships and swaps tempo.
- **Settings** (`⚙`) opens the colour editor, a debug-outlines toggle, and a reset.
- **Mode** isn't shown as a control — it tracks the docs' own theme toggle, so flipping the site to dark re-tints the whole demo (including the chrome bones) automatically.

## Quick start

Wrap any component with `<ASmartSkeleton>`, pass a representative `sample` of the data shape, and a `data` ref. While `data` is `null`, the plugin renders the sample unseen, measures its layout, and paints the skeleton. When `data` arrives, it reveals.

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
  <ASmartSkeleton :data="user" :sample="SAMPLE_USER" id="user-card">
    <template #default="{ data }">
      <UserCard :user="data" />
    </template>
  </ASmartSkeleton>
</template>
```

Three things to know:

1. **Always pass a `sample`.** It's what the skeleton measures before real data arrives. Keep its shape as close as possible to the real response so the reveal doesn't jump.
2. **Give the skeleton a stable `id`.** Shape memory is keyed by `id` across visits, so the bones match what the user saw last time.
3. **Give images explicit `width` / `height` or an `aspect-ratio`.** Otherwise the skeleton can't reserve their space and the layout shifts on load.

::DemoSkeletonDataDriven
::

## States: `loading`, `content`, `empty`, `error`

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

## Hints — `ask-block`, `ask-ignore`, `ask-own`

The walker is accurate by default, but three attributes let you override its decisions where it matters:

| Hint         | Class alias            | What it does                                                                                                                                                                           |
| ------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ask-block`  | `data-skeleton-block`  | Draws the element as **one** bone sized to its box + border-radius. Walker does not recurse. Use for action buttons where you want the whole pill instead of an icon + count fragment. |
| `ask-ignore` | `data-skeleton-ignore` | Element keeps its layout footprint but emits **zero** bones. Use for decorative dividers, small corner badges, or anything the loading state can omit.                                 |
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

## Chrome capture — what makes card outlines pixel-perfect

When the walker crosses a **painted container** — anything with a background, border, or box-shadow — it emits an extra `chrome` bone that reproduces that paint verbatim. The bone carries the captured `background`, per-side `border-*`, `border-radius`, and `box-shadow` inline, and skips the shimmer animation so it reads as an outline, not a placeholder fill.

This is why cards look right from the first frame — even partial borders (`border-t` on a footer divider) survive.

What chrome capture tracks:

- `backgroundColor` and `backgroundImage` (gradient layers only — `url(…)` layers are stripped so hero bitmaps don't re-download in the skeleton)
- Four border sides as separate paint — a one-sided border reads as a divider, not a box
- `border-radius`, per-corner where the parent's overflow clips it
- `box-shadow`

Chrome bones ignore `--ask-base` (they're not placeholders) and get `type="chrome"` on their `[ask-rect]` attribute so consumer CSS can target them separately.

## Reveal transitions

The `reveal` prop picks how the skeleton gives way to real content:

| Mode       | Behaviour                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| `smart`    | Instant if the content lands under ~150 ms, otherwise crossfade — the human-friendly default. |
| `together` | Simple crossfade.                                                                             |
| `sequence` | Staggered top-to-bottom cascade.                                                              |
| `sweep`    | A highlight beam sweeps across the transition edge. Prettiest on wide cards.                  |
| `instant`  | Snap, no transition.                                                                          |

`prefers-reduced-motion: reduce` forces `instant` automatically.

## Resizing — easing to the new height

A skeleton drawn from `sample` data or a remembered shape is a guess. When the real data arrives with a different body length, image count, or line wrap, the frame around the swap doesn't snap — it eases from the outgoing pane's measured box to the incoming pane's live box over **`RESIZE_DURATION` (320 ms)** with **`REVEAL_EASING` (`cubic-bezier(0.22, 1, 0.36, 1)`)**, so a card that goes from 200 px to 600 px (or the other way) never jerks the viewer's eye.

::DemoSkeletonResizing
::

The mechanism is baked into `fadeOut()` and runs on every reveal except when `prefers-reduced-motion: reduce` is set. It's independent of the `reveal` prop — even `reveal="instant"` (or `smart` picking `instant` for a sub-150 ms fetch) still eases the frame, because layout continuity is a separate concern from how the content itself arrives.

### Timings at a glance

| Constant                 | Default                          | What it drives                                                                                 |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `RESIZE_DURATION`        | 320 ms                           | Height ease on the `[ask-reveal]` container, and the outgoing pane's own shrink                |
| `FADE_DURATION`          | 320 ms                           | Content pane fade-in — ends on the same frame as the resize                                    |
| `SKELETON_FADE_DURATION` | 180 ms                           | Skeleton pane fade-out — deliberately shorter so bones clear while the frame is still settling |
| `REVEAL_EASING`          | `cubic-bezier(0.22, 1, 0.36, 1)` | iOS-style standard-decelerate curve shared by every reveal animation                           |

All four are exported from `@alikhalilll/a-smart-skeleton` so a consumer can match an animation of their own to the skeleton's rhythm.

### Internal steps

1. The outgoing pane is taken out of flow (`position: absolute` at its measured box) via `popOut()`.
2. The parent momentarily lays out at the incoming pane's natural height — that reading is the resize's target.
3. A Web Animation on the parent's `height` interpolates from the outgoing box's height to the incoming pane's live height, with `overflow: clip` applied inline so the shrinking frame doesn't expose the leaving pane underneath.
4. **In lockstep**: when the outgoing pane was taller than the incoming one, a second animation runs on the outgoing pane's _own_ `height` with the same duration and easing, clipping its bones to the container's current size. Without this step, the skeleton's bottom portion would stay painted below where the real content settles (still within the container's bounds) until the overflow:clip catch-up frame. Both animations end on the same frame.
5. The skeleton's own fade (`SKELETON_FADE_DURATION`, 180 ms) finishes well before the resize settles, so the viewer's eye isn't fighting a fading skeleton on top of content that's already laid out.

### Exposed primitive — `easeHeight()`

For custom code paths (not just pane swaps), the package exports `easeHeight(root, from, to)` — the same primitive the reveal lifecycle uses internally:

```ts
import { easeHeight, RESIZE_DURATION } from '@alikhalilll/a-smart-skeleton';

// Animate `panel` from its current height to 480 px with the package's canonical curve.
const from = panel.getBoundingClientRect().height;
panel.style.height = '480px';
easeHeight(panel, from, 480);
```

No consumer configuration is needed for the built-in reveal — it's on by default. If you need to bypass the easing entirely (e.g. a parent with a hard-coded height), make sure your container doesn't set `height` itself and the easing will just work; otherwise, call `easeHeight()` yourself to drive the rhythm.

## Theming

Everything is driven by CSS custom properties, so a single declaration anywhere above the skeleton re-tints every bone inside:

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
/* The handcrafted ASkeletonBlock look — a soft inset ring on placeholder bones. */
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

## Standalone bars — `<ASmartSkeletonBox>`

When you need an explicit placeholder outside the automatic measurement path:

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

## Multi-card shimmer sync

When multiple skeletons mount at different times — paginated feeds, staggered data fetches, grid cards — they all join the **same** document-clock sweep. Nothing resets, nothing pops in out of phase.

::DemoSmartSkeletonGrid
::

## Debugging a wrong-looking skeleton

If the measured skeleton doesn't line up with your real card — bones in the wrong places, padding missing, cards too narrow — turn on the built-in trace. The plugin ships a `traceMeasurement()` logger that fires once per element the walker touches, so you can see exactly what the DOM looks like **when the ghost tree is being measured**.

### Enable it

Any one of these flips the plugin into debug mode:

- Add `?ask-debug` to the URL
- Run `localStorage.setItem('a-smart-skeleton:debug', '1')` in DevTools, then reload
- Call `setDebug(true)` once from your app code
- Add an `ask-debug` attribute to any ancestor of the `<ASmartSkeleton>` you're investigating (scopes the trace to that subtree)

### What you'll see

Open DevTools and trigger a skeleton render (cold refresh, sort change, anything that puts `:data` back to `null`). The console fills with lines like:

```
[a-smart-skeleton] <header> 456×60  padding:4px 20px 16px 20px
{ class: 'flex gap-3 items-start px-5 pb-4 pt-4', element: <header…> }

[a-smart-skeleton] <div> 420×38  padding:0px 0px 0px 0px  · ⚠ 0-padding
{ class: 'flex flex-col', element: <div…> }
```

Each line is one element's measured box, with its class list, computed `padding`, and width × height. The `⚠ 0-padding` marker appears on containers that have non-empty children but no inner padding — the common signal that something went wrong between what you wrote and what the browser rendered.

### How to read the trace

Pick the element you care about (usually one that should have padding but doesn't) and look at three things:

| What you see                                                                                                       | What it means                                                                                                                                                                             | Fix                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The expected class is in `class:` **and** padding is non-zero                                                      | Everything's fine. The visual problem is elsewhere (CSS specificity, parent `overflow`, a wrapper collapsing margins).                                                                    | Look upstream.                                                                                                                                                             |
| The expected class is in `class:` **but** padding is `0px 0px…`                                                    | The class reached the DOM but your CSS didn't emit the rule. Classic UnoCSS/Tailwind lazy-scan miss — the utility isn't in the output bundle because the scanner didn't see it.           | Add the utility to your CSS tool's safelist, or make sure the component's source file is covered by the scan globs.                                                        |
| The expected class is **not** in `class:`                                                                          | Vue dropped it. Happens when a child component has a true fragment root (multiple top-level elements, not `v-if`/`v-else`). Vue can't auto-forward the fallthrough class into a fragment. | Collapse the child to a single root with `:class` branching inside, or use `defineOptions({ inheritAttrs: false })` + manual `:class="[…own, $attrs.class]"` on each root. |
| `class:` includes utilities but `padding` is correct **in the real card** and wrong **only in the skeleton trace** | The ghost tree rendered before an async style settled — fonts, lazy CSS modules, etc.                                                                                                     | Preload the font / stylesheet, or set an explicit `aspect-ratio` on the container so the first-paint measurement is correct.                                               |

### Why this is a diagnostic, not a fix

The plugin reads the **real DOM** at measurement time. The `<MyComponent />` tag you wrote in your template has already been compiled away — only the component's output is in the DOM. If a class you passed got dropped somewhere in between, the plugin has no way to reach back and retrieve it. The trace just makes the gap visible, so you can fix it at the right layer (Vue template, CSS tool config, or wherever the drop actually happened).

See the [`traceMeasurement` API reference](#api-reference) for the exported signature if you want to call it from your own walker.

## Accessibility

- `aria-busy="true"` is applied to the outer wrapper while loading.
- The `label` prop renders as visually hidden text inside an `[ask-status]` element — the screen reader hears `label` instead of silence.
- Skeleton panes are `aria-hidden="true"` and `inert`, so AT doesn't try to announce empty shapes.
- `(prefers-reduced-motion: reduce)` disables shimmer and collapses reveal to `instant`.

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

### Debug helpers

Imported from `@alikhalilll/a-smart-skeleton/core`:

| Export                              | Signature                                                                                     | What it does                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `setDebug(on: boolean)`             | Switches debug mode on or off globally.                                                       | Alternative to the `?ask-debug` URL flag — useful inside tests or a feature-flag check.                  |
| `traceMeasurement(el, style, rect)` | Logs one element's class list, computed padding, and measured bounds.                         | Called automatically by the measure walker when debug is on. Also exported for custom measurement loops. |
| `debugging(el?)`                    | Returns `true` when the global debug flag is set, or when `el` has an `[ask-debug]` ancestor. | Gate your own diagnostics on the same flag.                                                              |

## Patterns and pitfalls

**Match sample height to real height.** The plugin warns `layout jumped on reveal` when the real data differs from the measured sample by more than 1 px. Fix by making the `sample` shape mimic the real shape — same number of text lines, same avatar size — not by silencing the warning.

**Give images dimensions.** An `<img>` without `width` / `height` or `aspect-ratio` reports zero height until it loads, so the skeleton reserves no space and the reveal shifts. Set at least one.

**Prefer `data` + `sample` over `loading`.** The `loading` prop is an escape hatch. Normal usage is to bind `data` and let the skeleton auto-activate when it's `null`.

**Use `id` religiously.** A stable `id` lets the plugin recall the previous shape from memory, so a user returning to a page sees the real card's shape immediately, not a generic fallback.

**Chrome bones ≠ bone fill.** If you re-tint via `--ask-base`, the card outline keeps whatever colour the real `<article>` had. That's chrome capture working as intended — you're changing bone fill, not real paint.
