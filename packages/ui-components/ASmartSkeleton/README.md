<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/alikhalilll/ali-nuxt-toolkit/master/packages/ui-components/ASmartSkeleton/logo-dark.png">
    <img src="https://raw.githubusercontent.com/alikhalilll/ali-nuxt-toolkit/master/packages/ui-components/ASmartSkeleton/logo-light.png" alt="a-smart-skeleton" width="96" height="96">
  </picture>
</p>

<h1 align="center"><code>@alikhalilll/a-smart-skeleton</code></h1>

> Measured skeleton loaders for Vue 3 and Nuxt 3+. Captures your real component's layout — background, border, radius, box-shadow, text lines, and media boxes — and replays it as a pixel-faithful placeholder. One template to maintain. Zero cumulative layout shift.

[![npm](https://img.shields.io/npm/v/@alikhalilll/a-smart-skeleton.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-smart-skeleton)
[![license](https://img.shields.io/npm/l/@alikhalilll/a-smart-skeleton.svg?color=444)](https://github.com/alikhalilll/ali-nuxt-toolkit/blob/main/LICENSE)
[![docs](https://img.shields.io/badge/docs-live%20demo-5c6ac4)](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton)

**[Live demo and full documentation →](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton)**

Hand-authored skeletons are the second template you have to maintain. Padding drifts, font sizes bump, images start loading later — the skeleton guesses wrong and the reveal jumps. `ASmartSkeleton` lays your real content out invisibly, measures the live geometry, and reconstructs a skeleton from what it saw. One template — the real one — stays the source of truth.

---

## Table of contents

- [Install](#install)
- [Minimal example](#minimal-example)
- [Full example — social feed card](#full-example--social-feed-card)
- [States: `loading`, `content`, `empty`, `error`](#states-loading-content-empty-error)
- [Hints — `ask-block`, `ask-ignore`, `ask-own`](#hints--ask-block-ask-ignore-ask-own)
- [Chrome capture](#chrome-capture)
- [Reveal transitions](#reveal-transitions)
- [Direction-aware animations](#direction-aware-animations)
- [Theming](#theming)
- [API reference](#api-reference)
- [Changelog highlights](#changelog-highlights)

---

## Install

```sh
pnpm add @alikhalilll/a-smart-skeleton
# or
npm install @alikhalilll/a-smart-skeleton
# or
yarn add @alikhalilll/a-smart-skeleton
```

**Nuxt 3 / 4** — add the module, four components auto-import:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-smart-skeleton/nuxt'],
});
```

**Vue 3 + Vite** — import the stylesheet and optionally register the auto-import resolver:

```ts
// main.ts
import '@alikhalilll/a-smart-skeleton/styles.css';
```

```ts
// vite.config.ts  (optional, for unplugin-vue-components)
import Components from 'unplugin-vue-components/vite';
import ASmartSkeletonResolver from '@alikhalilll/a-smart-skeleton/resolver';

export default {
  plugins: [Components({ resolvers: [ASmartSkeletonResolver()] })],
};
```

Full install guide with troubleshooting → [docs/install](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#install).

---

## Minimal example

The simplest useful pattern — bind `data`, pass a `sample`, give it an `id`, done:

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

**Three things to know:**

1. **Always pass a `sample`.** It's what the skeleton measures before real data arrives.
2. **Give the skeleton a stable `id`.** Shape memory is keyed by `id` across visits.
3. **Give images explicit `width` / `height`** (or `aspect-ratio`) so the skeleton can reserve their space.

Live on the site → [Quick start demo](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#quick-start).

---

## Full example — social feed card

A real social feed: `<article>` wrapper with `border` + `bg-white` + `rounded-[12px]`, split sub-components for `Header` (avatar + author + actions menu), body text, `MediaGrid`, and a `footer` divider holding the reactions and comment buttons.

Interactive version with reveal-mode / animation / theme controls → [Customize demo](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#customize).

```vue
<!-- PostList.vue (parent) -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import PostCard from './PostCard.vue';

interface Post {
  id: string;
  author: { id: string; name: string; avatar?: string | null; verified?: boolean };
  created_at_relative: string;
  body: string;
  media?: { type: 'image' | 'video'; url: string }[];
  reactions_count: number;
  comments_count: number;
  is_reacted?: boolean;
}

// Sample bodies match the real-feed replacements 1:1 in length so the
// reveal doesn't trigger the plugin's dev-only "layout jumped" warning.
const SAMPLE_POSTS: Post[] = [
  /* ... three sample shapes ... */
];

const feed = ref<Post[] | null>(null);
async function loadFeed() {
  feed.value = null;
  feed.value = await $fetch<Post[]>('/api/community/posts');
}

const theme = computed(() => ({
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
  animation: 'shimmer' as const,
  speed: 'slow' as const,
}));
</script>

<template>
  <ASmartSkeletonProvider :theme="theme" mode="system" reveal="smart">
    <ASmartSkeleton id="community-feed" :data="feed" :sample="SAMPLE_POSTS">
      <template #default="{ data }">
        <div class="flex flex-col gap-4">
          <PostCard v-for="post in data as Post[]" :key="post.id" :post="post" />
        </div>
      </template>
    </ASmartSkeleton>
  </ASmartSkeletonProvider>
</template>
```

```vue
<!-- PostCard.vue (child) -->
<script setup lang="ts">
import Header from './Header.vue';
import MediaGrid from './MediaGrid.vue';
import Reactions from './Reactions.vue';

defineProps<{ post: Post }>();
</script>

<template>
  <article
    :id="`post-${post.id}`"
    class="border border-[#EDF0F3] rounded-[12px] bg-white flex flex-col w-full"
  >
    <Header :post="post" class="px-5 pb-4 pt-4" />

    <div class="px-5 pb-4 flex flex-col gap-3">
      <p class="text-sm leading-relaxed whitespace-pre-wrap break-words">{{ post.body }}</p>
      <MediaGrid :media="post.media" />
    </div>

    <footer class="px-5 py-4 border-t border-[#EDF0F3] flex gap-4 items-center">
      <Reactions :count="post.reactions_count" :is-reacted="post.is_reacted" />
      <!--
        `data-ask-block` collapses the icon + count into a single pill bone
        during loading — otherwise the walker recurses and emits a tiny
        media bone for the icon and a separate text bar for the number.
      -->
      <button
        type="button"
        data-ask-block
        class="text-sm text-gray-600 rounded-lg flex gap-1.5 items-center hover:text-primary"
      >
        <svg class="size-4" aria-hidden="true"><!-- comment icon --></svg>
        <span>{{ post.comments_count }}</span>
      </button>
    </footer>
  </article>
</template>
```

**What this example exercises** (and what the demo on the docs site shows live):

- **Chrome capture** on the painted `<article>` — the skeleton reproduces the background, border, and radius verbatim from the real element's computed style. See [Chrome capture section](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#chrome-capture).
- **Divider capture** on the `<footer>`'s `border-t` — one-sided borders survive as hairlines in the skeleton.
- **`data-ask-block`** on action buttons for one-bone pills instead of SVG + text fragments. See [Hints](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#hints--ask-block-ask-ignore-ask-own).
- **Split sub-component walker** — the plugin follows DOM nodes, not Vue VNodes, so SFC boundaries are transparent.
- **Provider-driven theming** — switch `mode`, `theme.light`, `theme.dark`, `animation`, `speed`, `reveal` in one place. See [Theming](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#theming).

---

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

`@reveal` fires once per `skeleton → content` transition. Full behaviour → [States demo](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#states-loading-content-empty-error).

---

## Hints — `ask-block`, `ask-ignore`, `ask-own`

Three attributes let you override the walker where it matters:

| Hint         | Alias                  | What it does                                                                                 |
| ------------ | ---------------------- | -------------------------------------------------------------------------------------------- |
| `ask-block`  | `data-skeleton-block`  | Draws the element as **one** bone sized to its box + border-radius. Walker does not recurse. |
| `ask-ignore` | `data-skeleton-ignore` | Element keeps its layout footprint but emits **zero** bones.                                 |
| `ask-own`    | `data-skeleton-own`    | Subtree opts out — you're drawing its skeleton yourself.                                     |

See it in action → [Hints demo](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#hints--ask-block-ask-ignore-ask-own).

---

## Chrome capture

When the walker crosses a **painted container** (a background, a border on any side, or a box-shadow) it emits an extra `type: 'chrome'` bone that carries the captured `background`, per-side `border-*`, `border-radius`, and `box-shadow` inline. The bone skips the shimmer animation so it reads as an outline, not a placeholder fill.

- `backgroundColor` and gradient `backgroundImage` layers are kept. `url(…)` layers are stripped — hero bitmaps don't re-download in the skeleton.
- Each border side is captured separately, so a `border-t` footer divider survives as a hairline.
- `border-radius` is captured per-corner where the parent's overflow clips it.
- Chrome bones ignore `--ask-base` by design — they're reproductions, not placeholders.

Full details and before/after shots → [Chrome capture section](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#chrome-capture).

---

## Reveal transitions

| Mode       | Behaviour                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| `smart`    | Instant if the content lands under ~150 ms, otherwise crossfade. The default. |
| `together` | Simple crossfade.                                                             |
| `sequence` | Staggered top-to-bottom cascade.                                              |
| `sweep`    | A highlight beam sweeps across the transition edge.                           |
| `instant`  | Snap, no transition.                                                          |

`prefers-reduced-motion: reduce` forces `instant` automatically. Compare them side-by-side → [Reveal transitions](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#reveal-transitions).

---

## Direction-aware animations

The shimmer sweep, the content-reveal front, and the `byPosition` sequence cascade all read the inherited CSS `direction` and flip to match. Set `<html dir="rtl">` once — or scope it with `style="direction: rtl"` on any ancestor — and the animations flow right-to-left. No prop, no new custom property; the skeleton reads the same writing-direction signal as the rest of the page.

```html
<section dir="rtl">
  <ASmartSkeleton :data="thread" :sample="SAMPLE_THREAD">
    <CommentThread :thread="thread" />
  </ASmartSkeleton>
</section>
```

Non-directional motion is left untouched: `pulse` (opacity), content fades, the height ease between panes, and the `byRow` sequence order look identical in LTR and RTL. See [Direction-aware animations](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#direction-aware-animations) for the demo and trade-offs.

---

## Theming

Every surface is driven by CSS custom properties. Set them on any ancestor:

```css
.my-feed {
  --ask-base: #d1d4dc;
  --ask-highlight: #ffffff;
}
```

For app-wide defaults, wrap your app in `<ASmartSkeletonProvider>`:

```vue
<ASmartSkeletonProvider
  mode="system"
  :theme="{
    light: { base: '#d1d4dc', highlight: '#ffffff' },
    dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
    animation: 'shimmer',
    speed: 'slow',
  }"
  reveal="smart"
>
  <App />
</ASmartSkeletonProvider>
```

Bones ship as `<div [ask-rect="text|media|box|chrome"]>` in the **light DOM** (no shadow root), so your stylesheet reaches them without `:deep()`. A 4-px minimum radius is applied to every non-chrome bone so nothing reads as a sharp glyph.

```css
/* Handcrafted ASkeletonBlock-style look on placeholder bones. */
[ask-rect='text'],
[ask-rect='box'] {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
```

Full CSS variable table + per-type targeting → [Theming](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#theming).

---

## API reference

**`<ASmartSkeleton>`** — `data`, `sample`, `loading`, `id`, `label`, `empty`, `error`, `reveal` · emits `@reveal` · slots `default` / `empty` / `error` / `skeleton`.

**`<ASmartSkeletonProvider>`** — `theme`, `mode`, `reveal`, `debug`, `nonce`.

**`<ASmartSkeletonBox>`** — standalone shimmer bar · `width`, `height`, `radius`.

**`<ASmartSkeletonSuspense>`** — Suspense-boundary wrapper that measures a fallback skeleton.

**Author hints (HTML attrs)** — `ask-block`, `ask-ignore`, `ask-own` (each with a `data-skeleton-*` alias).

Full props / slots / events reference → [API reference](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton#api-reference).

---

## Changelog highlights

- **Direction-aware animations** — shimmer sweep, sweep reveal front, and `byPosition` sequence cascade follow the inherited CSS `direction`. An RTL page flows right-to-left with no prop or extra configuration.
- **Chrome capture** (`type: 'chrome'`) — reproduces card outlines pixel-for-pixel from the consumer's own paint. Partial borders (`border-t` dividers) are preserved. `url(…)` background layers are filtered out so hero bitmaps don't re-download.
- **Light-DOM bones** — placeholders now live in the light DOM with a `[ask-rect="text|media|box|chrome"]` attribute, so consumer stylesheets can style them per type without `:deep()` on a shadow root.
- **4-px minimum radius** — every non-chrome bone is floored at 4 px so sharp-cornered placeholders don't read as glyphs of the real content.
- **Fixed `reveal="instant"`** — previously threw `Cannot read properties of undefined (reading 'hold')`. Unknown reveal strings now fall through to `smart` instead of crashing.
- **Cleaned stylesheet** — the published `dist/styles.css` is now a hand-authored ~4 KB file. No Tailwind utilities, `@property` globals, or theme tokens leak into the consumer's `:root`.

See the full version history → [CHANGELOG](https://github.com/alikhalilll/ali-nuxt-toolkit/blob/main/packages/ui-components/ASmartSkeleton/CHANGELOG.md) · browse source → [GitHub](https://github.com/alikhalilll/ali-nuxt-toolkit/tree/main/packages/ui-components/ASmartSkeleton) · open an issue → [Issues](https://github.com/alikhalilll/ali-nuxt-toolkit/issues).

---

MIT © [alikhalilll](https://github.com/alikhalilll)
