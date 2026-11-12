---
title: ASmartSkeleton
description: A measured skeleton loader for Vue 3 and Nuxt 3+. Lays your real component out unseen, reads its geometry, and replays it as a placeholder. One template, zero layout shift.
package: '@alikhalilll/a-smart-skeleton'
order: 2
---

# `@alikhalilll/a-smart-skeleton`

> A skeleton that **measures itself** from your real component. One template, pixel-aligned chrome, no second DOM tree to maintain.

::DemoSkeletonPostFeedMinimal
::

Every grey rectangle above was measured from the component rendered beneath it. There is no parallel placeholder file. Padding changes on the real card and the skeleton follows; text wraps differently and the bars re-flow; a card gains a shadow and the outline copies it.

::alert{type="note" title="What this package is — and isn't"}
`ASmartSkeleton` **owns a loading state**. It is not a hand-authored shape library (`<RectBone />` / `<CircleBone />`), and it does nothing useful without a real component plus a representative `sample` to measure. If you want to draw an arbitrary pill or bar with no measurement, that's `<ASmartSkeletonBox>` — covered [below](#standalone-box).
::

## Why this exists

A hand-authored `<ProductCardSkeleton>` next to `<ProductCard>` is a second template that drifts: padding diverges, fonts change, images start loading later and the reveal jumps.

`ASmartSkeleton` sidesteps that by laying the real component out invisibly, reading the DOM it produced with `getBoundingClientRect()` and Canvas 2D font metrics, then reconstructing a placeholder from what it saw. One template — the real one — stays the source of truth.

- **Zero layout shift.** Bone positions come from the actual DOM, not a copy.
- **Painted chrome is reproduced**, not re-drawn. Backgrounds, borders, radii, and box-shadows copy over verbatim onto chrome bones.
- **Text follows the font's ascender / descender**, not a guessed line-height.
- **One document clock** drives every shimmer, so skeletons mounted at different times still sweep in phase.
- **Direction-aware animations.** The shimmer, the content-reveal sweep, and the `byPosition` sequence order all follow the inherited CSS `direction` — an RTL page flows right-to-left with no prop or custom property.
- **One component, four states** — loading, content, empty, error — plus the reveal transition between them.

## Install

::doc-install{pkg="@alikhalilll/a-smart-skeleton"}
::

### Nuxt 3 / 4

Register the module. The four components auto-import, the stylesheet is injected, and the pre-paint boot script is wired for you.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-smart-skeleton/nuxt'],
});
```

### Vue 3 + Vite

Import the stylesheet once in your entry. Optionally wire the resolver so `unplugin-vue-components` auto-imports the four components the first time you use them.

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

::alert{type="info" title="Four components ship"}
`<ASmartSkeleton>` (the measured loader), `<ASmartSkeletonBox>` (a standalone bar), `<ASmartSkeletonSuspense>` (a `<Suspense>` wrapper that measures its fallback), and `<ASmartSkeletonProvider>` (app-wide theme + reveal defaults).
::

## Quick start

Wrap a component with `<ASmartSkeleton>`. Pass the data ref and a representative `sample`. While `data` is `null`, the plugin renders the sample out of sight, measures it, and paints the skeleton. When data arrives, it reveals.

Five rules keep the measurement honest and the paint on-brand. Each one has a short section below with a tiny before/after; the full example at the end puts them together.

## Rule 1 — Always pass a `sample`

The sample is the shape the plugin measures while real data is loading. Its structure should mirror the real response: same number of lines of text, same avatar size, same list length. Skip it and there's nothing to measure, so the skeleton has no shape to draw.

```vue
<!-- ❌ no sample — the skeleton has nothing to measure -->
<ASmartSkeleton :data="user">
  <template #default="{ data }"><UserCard :user="data" /></template>
</ASmartSkeleton>

<!-- ✅ sample matches real-response shape -->
<ASmartSkeleton :data="user" :sample="SAMPLE_USER">
  <template #default="{ data }"><UserCard :user="data" /></template>
</ASmartSkeleton>
```

## Rule 2 — Give the skeleton a stable `id`

Shape memory is keyed by `id` across visits. A returning user sees last session's measured shape immediately — no fresh measurement delay, no generic fallback. Omit the `id` and every mount is a cold start.

```vue
<!-- ❌ no id — cold measurement every mount -->
<ASmartSkeleton :data="user" :sample="SAMPLE_USER">…</ASmartSkeleton>

<!-- ✅ stable id — shape is recalled across visits -->
<ASmartSkeleton id="user-card" :data="user" :sample="SAMPLE_USER">…</ASmartSkeleton>
```

## Rule 3 — Destructure `{ data }` in `#default`

The plugin invokes the slot with `{ data: SAMPLE }` during measurement. If the slot ignores that argument and reads an outer ref instead, that ref is still `null` while loading — children receive empty data, the ghost captures a half-drawn shape, and the cold-load skeleton is wrong. Warm visits hide the bug because the cache was written _after_ real data arrived. See [Thread `data` through the slot](#thread-data-through-the-slot) for the full walkthrough.

```vue
<!-- ❌ reads the outer ref → rows=[] during measurement -->
<template #default>
  <PagesTable :rows="content?.rows ?? []" />
</template>

<!-- ✅ destructures the slot prop → rows=SAMPLE.rows during measurement -->
<template #default="{ data }">
  <PagesTable :rows="data?.rows ?? []" />
</template>
```

## Rule 4 — Give images explicit dimensions

An `<img>` without `width` / `height` or `aspect-ratio` reports zero height until the pixels arrive. The skeleton measures that zero and reserves no space, so the reveal jumps when the image finally loads.

```vue
<!-- ❌ no dimensions — reserved height is 0 until load -->
<img :src="user.avatar" />

<!-- ✅ aspect-ratio pins the reserved space -->
<img :src="user.avatar" class="aspect-square w-16" />
```

## Rule 5 — Theme to your design with `<ASmartSkeletonProvider>`

The raw fallback greys (`rgb(128 128 128 / 0.2)` base, `rgb(255 255 255 / 0.12)` highlight) are translucent so they read on both light and dark pages — they're a stand-in, not a production look. Wrap your app once in `<ASmartSkeletonProvider>` to set the bone fill and shimmer colour against your real surface, and the provider's `mode="system"` toggle keeps the theme in step with `prefers-color-scheme`. Per-skeleton overrides work too: any ancestor can declare the `--ask-*` variables and the cascade carries them down.

```vue
<!-- ❌ no provider — bones use the fallback greys regardless of your design -->
<ASmartSkeleton :data="user" :sample="SAMPLE_USER">…</ASmartSkeleton>

<!-- ✅ app-wide provider, light and dark themed against real surfaces -->
<ASmartSkeletonProvider
  mode="system"
  :theme="{
    light: { base: '#d1d4dc', highlight: '#ffffff' },
    dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
    radius: '6px',
  }"
>
  <ASmartSkeleton :data="user" :sample="SAMPLE_USER">…</ASmartSkeleton>
</ASmartSkeletonProvider>
```

See [Theming](#theming) for the full token table and chrome-bone rules.

## Putting it together

All five rules applied — provider wraps the app with themed bones, each skeleton has a stable `id`, a matching `sample`, `{ data }` destructured in the slot, and the avatar's dimensions pinned via the class on `<UserCard>`'s own `<img>`:

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
  <ASmartSkeletonProvider
    mode="system"
    :theme="{
      light: { base: '#d1d4dc', highlight: '#ffffff' },
      dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
      radius: '6px',
    }"
  >
    <ASmartSkeleton id="user-card" :data="user" :sample="SAMPLE_USER">
      <template #default="{ data }">
        <UserCard :user="data" />
      </template>
    </ASmartSkeleton>
  </ASmartSkeletonProvider>
</template>
```

A product card driven by `:data` + `:sample`:

::DemoSkeletonDataDriven
::

## State machine

One component resolves four mutually-exclusive states. Resolution order is `loading` → `error` → `empty` → `content`:

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

::alert{type="info" title="When does the skeleton activate?"}
Only when `:data` is passed as a bound prop **and** its value is `null` / `undefined`, or when `loading` is explicitly `true`. Passing nothing (no `:data` prop at all) treats the slot as always-rendered content — the escape hatch is `loading`.
::

::alert{type="note" title="Prefer `data` + `sample` over `loading`"}
The `loading` prop is an escape hatch for state you can't model as "data is `null`". Default to binding `:data` and let the skeleton auto-activate — you get shape memory, the ghost measurement, and the reveal transitions for free.
::

`@reveal` fires once per `skeleton → content` transition. It does not fire on error / empty transitions or on subsequent re-renders.

::DemoSkeletonStates
::

## Reveal transitions

The `reveal` prop picks how the skeleton gives way to real content. Set it on `<ASmartSkeleton>` to override one skeleton, or on `<ASmartSkeletonProvider>` as the app-wide default.

| Mode       | Behaviour                                                                           |
| ---------- | ----------------------------------------------------------------------------------- |
| `smart`    | Instant if content lands under ~150 ms, otherwise a crossfade. The default.         |
| `together` | A single crossfade. Recommended for lists — per-piece staggers read as noise there. |
| `sequence` | Top-to-bottom cascade across pieces.                                                |
| `sweep`    | A highlight beam traverses the transition edge. Reads best on wide cards.           |
| `instant`  | Snap with no crossfade. The height ease still runs.                                 |

::alert{type="warning" title="Reduced motion wins"}
When the user has `(prefers-reduced-motion: reduce)`, the reveal is forced to `instant` and the shimmer freezes. Your chosen `reveal` prop is a preference, not a guarantee.
::

Every option above the "Motion" control in the playground below is wired to the provider in real time. The "Mode" row tracks the docs' own theme toggle, so flipping the site to dark re-tints the entire demo — including the chrome bones.

::alert{type="note" title="`reveal=\"together\"` on lists"}
The default `smart` picks `byRow` for lists with more than a few pieces, which stacks a per-card cascade on top of the pane fade and the height ease — three animations fighting each other. `together` collapses the list entry into one crossfade that lands with the resize.
::

::DemoSkeletonPostFeed
::

### Custom reveals

For one-off needs, `reveal` also accepts a `RevealSpec` object: `{ order, enter, wipe, delay, duration, hold, choose }`. The built-in modes are exported as helpers (`together`, `sequence`, `smart`, `sweep`, `instant`, `byRow`, `byPosition`, `byContent`, `quickly`) if you want to compose on top of them — see [Timing & helpers](#timing--helpers).

## Layout hints

The DOM walker is accurate by default. Three attributes let you override its decisions where it matters.

| Hint         | `data-*` alias         | Effect                                                                                                                                                                  |
| ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ask-block`  | `data-skeleton-block`  | Draws the element as **one** bone sized to its box + border-radius. The walker does not recurse. Use for action buttons where the icon + count should read as one pill. |
| `ask-ignore` | `data-skeleton-ignore` | Keeps the layout footprint but emits **zero** bones. Use for decorative dots, badges, or teleported modal shells that shouldn't appear in the ghost tree.               |
| `ask-own`    | `data-skeleton-own`    | The subtree opts out of measurement — you're drawing its own skeleton. The walker stops at this boundary.                                                               |

```vue
<article>
  <Header />

  <!-- icon + count collapse to a single pill bone -->
  <button type="button" data-ask-block class="rounded-full">
    <HeartIcon /> {{ count }}
  </button>

  <!-- decorative dot: leaves the layout slot, no bone -->
  <span data-ask-ignore class="status-dot" />
</article>
```

::alert{type="note" title="`ask-own` + `#skeleton` slot"}
If you pass your own skeleton via the `#skeleton` slot on `<ASmartSkeleton>`, measurement is skipped entirely — no need to annotate it with `ask-own`. `ask-own` is only for carving a hand-authored island **inside** a measured tree.
::

::alert{type="danger" title="`v-if`-gate teleported modals inside the ghost tree"}
Dialogs with `<Teleport to="body">` or `<ClientOnly>` roots render children inline at their declared location until they move to the target on hydration — the walker measures that inline shell and emits ghost bones for it. Wrap them in `v-if="open"` so they don't exist in the DOM until needed.
::

::DemoSkeletonHints
::

## Resizing between skeleton and content

A skeleton drawn from `sample` data or remembered shape is a guess. When the real data arrives with a different body length, image count, or line wrap, the frame around the swap doesn't snap — it eases from the outgoing pane's measured box to the incoming pane's live box.

- **`RESIZE_DURATION`** = 260 ms
- **`REVEAL_EASING`** = `cubic-bezier(0.32, 0.72, 0, 1)` (Apple's SF Pro curve)

A card that goes from 200 px to 600 px, or the other way, never jerks the viewer's eye.

::alert{type="warning" title="Match sample height to real height"}
The plugin warns `layout jumped on reveal` when the real data differs from the measured sample by more than 1 px. Fix by making the `sample` shape mimic the real response — same number of text lines, same avatar size — not by silencing the warning.
::

::DemoSkeletonResizing
::

### Timings at a glance

| Constant                 | Default                          | What it drives                                                                       |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------ |
| `FADE_DURATION`          | 260 ms                           | Content pane fade-in — ends on the same frame as the resize.                         |
| `SKELETON_FADE_DURATION` | 160 ms                           | Skeleton pane fade-out — shorter so bones clear while the frame is still settling.   |
| `RESIZE_DURATION`        | 260 ms                           | Height ease on the `[ask-reveal]` container and the outgoing pane's lockstep shrink. |
| `REVEAL_EASING`          | `cubic-bezier(0.32, 0.72, 0, 1)` | Shared curve for every reveal animation.                                             |

All four are exported from `@alikhalilll/a-smart-skeleton` so a consumer can match their own animations to the skeleton's rhythm.

### How the resize is wired

1. The outgoing pane is taken out of flow (`position: absolute` at its measured box) via `fadeOut()`.
2. The parent momentarily lays out at the incoming pane's natural height — that reading is the resize target.
3. A Web Animation on the parent's `height` interpolates from the outgoing box's height to the incoming pane's live height. `overflow: clip`, `will-change: height`, and `contain: layout` are applied inline so the browser promotes the element onto its own compositor layer.
4. In lockstep, when the outgoing pane was taller than the incoming one, a second animation runs on the outgoing pane's own `height` with the same duration and easing, clipping its bones so nothing is painted below where the real content settles.
5. The skeleton's fade (`SKELETON_FADE_DURATION`, 160 ms) finishes before the resize settles — the viewer's eye isn't fighting a fading skeleton on top of content that's already laid out.

::alert{type="info" title="`easeHeight()` for custom code paths"}

```ts
import { easeHeight } from '@alikhalilll/a-smart-skeleton';

const from = panel.getBoundingClientRect().height;
panel.style.height = '480px';
easeHeight(panel, from, 480);
```

The height ease runs with `prefers-reduced-motion: reduce` honoured automatically — reduced-motion visitors see a snap.
::

## Synchronized shimmer

Six cards, each mounted a beat after the last, every bone sharing the same document-clock sweep. Nothing resets, nothing pops in out of phase. The same pattern scales to paginated feeds, async grid cells, staggered data fetches.

::DemoSkeletonShimmerSync
::

## Direction-aware animations

::DemoSkeletonDirection
::

Every directional animation in the skeleton reads the inherited CSS `direction` and flips to match. Set `<html dir="rtl">` once — or scope it with `style="direction: rtl"` on any ancestor — and three things flip together:

- **Shimmer** — the sweep across each bone travels right-to-left instead of left-to-right. Every bone in a group stays in phase; the shared stream is preserved.
- **Sweep reveal** — the content-wipe front enters from the right edge and crosses to the left, with its trailing gloss band staying behind the front in motion direction.
- **`sequence` cascade** — the horizontal component of `byPosition` reads right-to-left, so a top-to-bottom cascade tilts in reading order rather than always running toward the right.

There is no prop, no new CSS variable, and no provider setting. The reason: the browser already owns writing direction through `direction` and `dir`, every other UI library you use is reading the same signal, and adding a parallel knob would just drift from it.

```html
<!-- An entire page in RTL: shimmer, sweep, and sequence cascade all follow. -->
<html dir="rtl">
  <body>
    <ASmartSkeleton :data="profile" :sample="SAMPLE_PROFILE">
      <ProfileCard :profile="profile" />
    </ASmartSkeleton>
  </body>
</html>
```

```vue
<!-- Or scope it to one subtree, e.g. a localised comment thread. -->
<section dir="rtl">
  <ASmartSkeleton :data="thread" :sample="SAMPLE_THREAD">
    <CommentThread :thread="thread" />
  </ASmartSkeleton>
</section>
```

::alert{type="note" title="What stays unchanged"}
`pulse` is an opacity fade — non-directional, so it looks identical in LTR and RTL. The content fades, the height-ease between panes, and the `byRow` sequence order are purely vertical or non-spatial, so they don't flip. The gradient's 20° slant is kept as-is in RTL (the motion direction flips, the band's visual slant doesn't) because mirroring it crosses from "noticeable" into "sub-threshold" at that angle and would double the geometry the sweep has to reason about.
::

## Chrome capture

When the walker crosses a **painted container** — anything with a background, a border, or a box-shadow — it emits an extra `chrome` bone that reproduces that paint verbatim. The bone carries the captured `background`, per-side `border-*`, `border-radius`, and `box-shadow` inline, and skips the shimmer animation so it reads as an outline, not a placeholder fill.

This is why cards look right from the first frame: a `border-t` footer divider survives as a hairline, and the card's radius is preserved even when the outer wrapper clips it.

What chrome capture tracks:

- `backgroundColor` and gradient `backgroundImage` layers
- Four border sides captured separately — a one-sided border reads as a divider, not a box
- `border-radius`, per-corner when the parent's `overflow` clips it
- `box-shadow`

Chrome bones ignore `--ask-base` (they aren't placeholders) and carry `[ask-rect="chrome"]` so stylesheets can target them separately.

::alert{type="warning" title="`url(…)` backgrounds are stripped"}
Bitmap `backgroundImage` layers (`url('/hero.jpg')`) are filtered out so the skeleton doesn't re-download them. Gradient layers come through as normal. If your card's "background" is a hero bitmap, the skeleton will show the solid fallback colour where the image would have been — which is almost always what you want.
::

## Theming

Everything is driven by CSS custom properties. A single declaration anywhere above the skeleton re-tints every bone inside.

```css
.my-feed {
  --ask-base: #d1d4dc;
  --ask-highlight: #ffffff;
  --ask-radius: 6px;
}
```

For app-wide defaults, wrap your app in `<ASmartSkeletonProvider>`. The provider supports `mode="system"` which reads `prefers-color-scheme`:

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

::alert{type="info" title="Light and dark are the same component tree"}
The provider doesn't fork its slot into two renders. It flips the `--ask-*` variables based on `mode` and lets the cascade do the rest — which is why chrome bones also re-tint when you toggle the site theme, because they inherit from `<article>`'s computed `background-color` at measurement time.
::

::alert{type="note" title="Chrome bones ≠ bone fill"}
`--ask-base` re-tints placeholder bones only. A card's outline keeps whatever colour the real `<article>` had — that's chrome capture working as intended, reproducing real paint rather than re-colouring it.
::

### CSS variables

| Variable            | Default                           | Description                                           |
| ------------------- | --------------------------------- | ----------------------------------------------------- |
| `--ask-base`        | `rgb(128 128 128 / 0.2)`          | Fill of placeholder bones. Chrome bones ignore this.  |
| `--ask-highlight`   | `rgb(255 255 255 / 0.12)`         | Shimmer sweep colour.                                 |
| `--ask-radius`      | `0px` (text bars pill by default) | Border-radius on text bars and `<ASmartSkeletonBox>`. |
| `--ask-animation`   | `shimmer`                         | `shimmer` / `group-shimmer` / `pulse` / `none`.       |
| `--ask-speed`       | `slow`                            | `slow` / `fast`.                                      |
| `--ask-text-top`    | `ascender`                        | Which font line each text bar starts at.              |
| `--ask-text-bottom` | `descender`                       | Which font line each text bar ends at.                |

::alert{type="note" title="Two layers of defaults"}
Without a provider, the raw CSS fallbacks are the translucent greys shown above — they read on both light and dark pages. Wrap in `<ASmartSkeletonProvider>` and the provider's own `DEFAULT_COLORS` (light `rgb(0 0 0 / 0.07)`, dark `rgb(255 255 255 / 0.08)`) win, keyed off `mode`.
::

### Per-type bone styling

Bones ship as `<div [ask-rect="text|media|box|chrome"]>` in the light DOM (no shadow root), so your stylesheet reaches them without `:deep()`. A 4-px minimum radius is applied to every non-chrome bone so nothing reads as a sharp glyph.

```css
/* Soft inset ring on placeholder bones. */
[ask-rect='text'],
[ask-rect='box'] {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
```

| `[ask-rect]` value | Emitted by                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `text`             | Text-node per-line bars via `Range.getClientRects()`                                                     |
| `media`            | `<img>` / `<svg>` / `<video>` / `<canvas>` / `<picture>` / `<iframe>`                                    |
| `box`              | `<button>` / `<input>` / painted leaf elements / anything with `data-ask-block`                          |
| `chrome`           | Painted or divider-bordered container — carries captured `background` / `border-*` / `box-shadow` inline |

## `<ASmartSkeletonBox>` — standalone bars {#standalone-box}

Use `<ASmartSkeletonBox>` when you need an explicit placeholder outside the measurement path — a loading indicator that doesn't wrap a component, an inline progress strip, or a composite skeleton you're hand-authoring.

```vue
<div class="flex items-center gap-3">
  <ASmartSkeletonBox width="40px" height="40px" radius="999px" />
  <div class="flex-1 flex flex-col gap-1.5">
    <ASmartSkeletonBox width="60%" height="1rem" radius="4px" />
    <ASmartSkeletonBox width="40%" height="0.75rem" radius="4px" />
  </div>
</div>
```

It shares the document-clock shimmer, respects the provider, and honours the `--ask-*` variables.

## `<ASmartSkeletonSuspense>` — for Suspense boundaries

A thin wrapper around Vue's `<Suspense>` that measures its fallback like any other `<ASmartSkeleton>`. Use it when your loading surface is driven by an `async setup()` / top-level `await` rather than a `null → value` transition.

```vue
<ASmartSkeletonSuspense id="profile" label="Loading profile">
  <template #default>
    <AsyncProfile />
  </template>
  <template #skeleton>
    <ProfilePlaceholder />
  </template>
</ASmartSkeletonSuspense>
```

## Accessibility

- `aria-busy="true"` is set on the outer wrapper while loading.
- The `label` prop renders as visually hidden text inside an `[ask-status]` element — screen readers hear `label` instead of silence.
- Skeleton panes are `aria-hidden="true"` and `inert`, so assistive tech doesn't try to announce empty shapes.
- `(prefers-reduced-motion: reduce)` disables the shimmer and collapses the reveal to `instant`.
- The inherited CSS `direction` is read at runtime, so a `<html dir="rtl">` page (or any `dir`-scoped subtree) flips the shimmer sweep, the content reveal, and the `sequence` cascade without any extra wiring — the skeleton reads the same writing-direction signal as the rest of the page.

```vue
<ASmartSkeleton :data="profile" :sample="SAMPLE_PROFILE" label="Loading your profile">
  ...
</ASmartSkeleton>
```

## Debugging a wrong-looking skeleton

If a measured skeleton doesn't line up with the real card — bones in the wrong places, padding missing, cards too narrow — turn on the built-in trace. The plugin ships a `traceMeasurement()` logger that fires once per element the walker touches, so you can see exactly what the DOM looked like **at measurement time**.

### Enable it

Any one of these flips the plugin into debug mode:

- Add `?ask-debug` to the URL.
- Run `localStorage.setItem('a-smart-skeleton:debug', '1')` in DevTools, then reload.
- Call `setDebug(true)` once from your app code.
- Add an `ask-debug` attribute to any ancestor of the `<ASmartSkeleton>` you're investigating (scopes the trace to that subtree).

### Reading the trace

Open DevTools and trigger a skeleton render (cold refresh, sort change, anything that puts `:data` back to `null`). The console fills with lines like:

```
[a-smart-skeleton] <header> 456×60  padding:4px 20px 16px 20px
{ class: 'flex gap-3 items-start px-5 pb-4 pt-4', element: <header…> }

[a-smart-skeleton] <div> 420×38  padding:0px 0px 0px 0px  · ⚠ 0-padding
{ class: 'flex flex-col', element: <div…> }
```

Each line is one element's measured box with its class list, computed padding, and width × height. The `⚠ 0-padding` marker appears on containers that have children but no inner padding — the common signal that something went wrong between what you wrote and what the browser rendered.

Pick the element you care about (usually one that should have padding but doesn't) and check three things:

| What you see                                                                             | What it means                                                                                                                                            | Fix                                                                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Expected class in `class:` **and** padding is non-zero                                   | Everything's fine. The visual problem is elsewhere (CSS specificity, parent `overflow`, a wrapper collapsing margins).                                   | Look upstream.                                                                                           |
| Expected class in `class:` **but** padding is `0px 0px…`                                 | The class reached the DOM but your CSS didn't emit the rule. Classic UnoCSS / Tailwind lazy-scan miss — the utility isn't in the output bundle.          | Add the utility to your scanner's safelist, or widen the source globs so the component is covered.       |
| Expected class **not** in `class:`                                                       | Vue dropped it. Happens when a child component has a true fragment root (multiple top-level elements). Vue can't auto-forward the class into a fragment. | Collapse to a single root with `:class` branching, or `defineOptions({ inheritAttrs: false })` + manual. |
| `class:` is correct, padding is right in the real card, wrong only in the skeleton trace | The ghost tree rendered before an async style settled (fonts, lazy CSS modules).                                                                         | Preload the font / stylesheet, or set an `aspect-ratio` so the first-paint measurement is correct.       |

::alert{type="warning" title="Debug is for dev only"}
The trace is noisy by design and runs synchronously per element. Don't ship it enabled — either gate `setDebug(true)` behind `import.meta.dev` or leave it off and use the URL / localStorage switches when investigating.
::

## Timing & helpers

Imported from `@alikhalilll/a-smart-skeleton` (or `/core`):

| Export                       | Signature / value                | What it does                                                                                  |
| ---------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| `FADE_DURATION`              | `260`                            | Content pane fade length.                                                                     |
| `SKELETON_FADE_DURATION`     | `160`                            | Skeleton pane fade length (shorter — bones clear before the frame settles).                   |
| `RESIZE_DURATION`            | `260`                            | Height ease length.                                                                           |
| `REVEAL_EASING`              | `cubic-bezier(0.32, 0.72, 0, 1)` | Shared curve for every reveal animation.                                                      |
| `SKELETON_DELAY`             | `150`                            | Minimum time a skeleton must be visible before `smart` swaps to a crossfade.                  |
| `easeHeight(root, from, to)` | —                                | Animate any element's height along the canonical curve. Reused internally by every pane swap. |
| `prefersReducedMotion()`     | `boolean`                        | Current reduced-motion preference.                                                            |
| `forgetShapes(id?)`          | —                                | Clear remembered shapes from `localStorage`. Omit `id` to wipe all.                           |
| `setDebug(on: boolean)`      | —                                | Switch debug mode on or off globally.                                                         |
| `traceMeasurement(el, …)`    | —                                | Logs one element's class list, computed padding, and bounds. Called by the measure walker.    |
| `debugging(el?)`             | `boolean`                        | `true` when the global flag is set, or when `el` has an `[ask-debug]` ancestor.               |

## API reference

### `<ASmartSkeleton>` props

| Prop      | Type         | Default              | Description                                                                |
| --------- | ------------ | -------------------- | -------------------------------------------------------------------------- |
| `data`    | `T \| null`  | `undefined`          | Your real data. The skeleton is active while this is `null` / `undefined`. |
| `sample`  | `T`          | `undefined`          | Stand-in used to measure the layout before real data arrives.              |
| `loading` | `boolean`    | `undefined`          | Force the skeleton on or off, overriding `data` detection.                 |
| `id`      | `string`     | `undefined`          | Key for cross-visit shape memory. Highly recommended.                      |
| `label`   | `string`     | `undefined`          | Screen-reader text announced in place of the skeleton.                     |
| `empty`   | `boolean`    | `false`              | Renders the `#empty` slot instead of content.                              |
| `error`   | `unknown`    | `undefined`          | Renders `#error="{ error }"` slot instead of content.                      |
| `reveal`  | `RevealMode` | provider / `'smart'` | Reveal transition. See [Reveal transitions](#reveal-transitions).          |

### Slots

| Slot       | Receives    | When                                                                                                                       |
| ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `default`  | `{ data }`  | Always, with `data` = real payload OR the `sample` during measurement. **Destructure and use this binding** — see pitfall. |
| `empty`    | —           | `empty` is true.                                                                                                           |
| `error`    | `{ error }` | `error` is truthy.                                                                                                         |
| `skeleton` | —           | Optional hand-authored skeleton — opts out of measurement.                                                                 |

::alert{type="warning" title="`#default` must use its `{ data }` argument"}
The plugin invokes the slot with the sample during the measurement pass. A slot that doesn't destructure it (and instead reads an outer `ref` which is still `null` while loading) hands empty data to its children — the skeleton measures an empty shape and the cold reload is wrong. See [Thread `data` through the slot](#thread-data-through-the-slot) for the before/after.
::

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
| `text`   | `{ top?, bottom? }`             | Font line each text bar runs from / to.                                               |
| `debug`  | `boolean`                       | Outlines every reveal pane and labels its source (sample / data / recall / fallback). |
| `nonce`  | `string`                        | CSP nonce for the inline boot script and injected stylesheet.                         |

### `<ASmartSkeletonBox>` props

| Prop     | Type     | Default        | Description     |
| -------- | -------- | -------------- | --------------- |
| `width`  | `string` | `100%`         | Any CSS length. |
| `height` | `string` | `1em`          | Any CSS length. |
| `radius` | `string` | `--ask-radius` | Any CSS length. |

### `<ASmartSkeletonSuspense>` props

| Prop     | Type         | Description                                            |
| -------- | ------------ | ------------------------------------------------------ |
| `id`     | `string`     | Key for cross-visit shape memory.                      |
| `label`  | `string`     | Screen-reader text announced in place of the skeleton. |
| `reveal` | `RevealMode` | Override for this boundary alone.                      |

### Author hints (HTML attributes)

| Attribute    | `data-*` alias         | Effect                                       |
| ------------ | ---------------------- | -------------------------------------------- |
| `ask-block`  | `data-skeleton-block`  | Draw as one bone, no recursion.              |
| `ask-ignore` | `data-skeleton-ignore` | Keep the layout footprint, emit no bones.    |
| `ask-own`    | `data-skeleton-own`    | Subtree draws its own skeleton.              |
| `ask-debug`  | `data-skeleton-debug`  | Scope the measurement trace to this subtree. |

## Thread `data` through the slot

The sample reaches your child components **only** through the slot's `{ data }` argument. Ignoring it and reading an outer ref directly means the ref is still `null` during measurement — children render empty, the ghost captures a half-drawn shape, and the cold-load skeleton is wrong. Warm visits hit the cache (written _after_ real data arrived) and hide the bug.

```vue
<!-- ❌ reads the outer ref → rows=[] during measurement -->
<template #default>
  <PagesTable :rows="content?.rows ?? []" />
</template>

<!-- ✅ destructures the slot prop → rows=SAMPLE.rows during measurement -->
<template #default="{ data }">
  <PagesTable :rows="data?.rows ?? []" />
</template>
```

When the slot pulls from a composable-level `computed` instead, make sure every derivation falls back to the sample while the real payload is still `null`:

```ts
const daily = computed<IDailyPoint[]>(
  () => kpiSeries.value ?? data.value?.daily ?? SAMPLE_PERFORMANCE.daily
);
```

::alert{type="note" title="Symptom to pattern-match against"}
A tabbed admin panel rendered its data tables as **half-drawn skeletons on cold reload** — only the first column had bars, the rest were blank. Warm navigation painted correctly. Cause: `<template #default>` was ignoring the slot prop and reading the composable's `data` ref, which was still `null` during measurement, so the data-table component received `rows=[]` and memory snapshotted an empty table. Fix was one line per tab — `<template #default="{ data }">` — then swap the ref reference for the slot binding.

If you see first-column-only bars on refresh that disappear on warm nav, it's this bug.
::
