# ASkeleton v2 — comprehensive node-type detection, variant primitives, styling revamp

## Context

The current `@alikhalilll/a-skeleton` works on the **slot-tree mirror** model: walk the user's vnode tree, preserve every element, replace text + atomic leaves with shimmer surfaces. It's good — but four classes of bug keep surfacing across releases:

1. **Element types we don't model explicitly** (tables, lists, form fields, video, audio, picture, web components) fall through to generic container handling. Edge cases drift visually.
2. **Style detection is class-string regex** (`/^bg-/`). Robust enough for Tailwind but won't catch DaisyUI, CSS modules with hashed class names, or inline CSS-in-JS.
3. **Shimmer containment is reactive** — every overflow report so far has needed a targeted CSS fix (`overflow: clip`, `:where()`, `data-skeleton-ignore` propagation). We need a containment **invariant** the architecture enforces.
4. **No explicit-typed primitives**. When auto-detect isn't right, the user has no escape hatch other than "hand-roll with `<ASkeletonBlock>`". Vuetify / shadcn / Flowbite all provide this.

Goal: rebuild the engine + ship a primitive library that closes all four gaps **without breaking the existing `<ASkeleton :loading>` slot API**.

---

## Reference scan (what the three industry leaders do)

| Library                         | Model                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Strength                                                                                | Where it falls short                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Vuetify `v-skeleton-loader`** | Type-string composition. `type="card-avatar, article, actions"` expands into a preset tree. ~25 named types: `actions`, `article`, `avatar`, `button`, `card`, `card-avatar`, `card-heading`, `chip`, `divider`, `heading`, `image`, `list-item`, `list-item-avatar`, `list-item-three-line`, `list-item-two-line`, `paragraph`, `sentences`, `table-cell`, `table-heading`, `table-row`, `table-row-divider`, `table-tbody`, `text`. Comma = sibling, newline = nested. | Comprehensive type vocabulary. Composition syntax is terse.                             | No auto-detect from slot — user must declare every shape. Pulse animation only.     |
| **shadcn/ui `Skeleton`**        | One CSS primitive: `<Skeleton class="h-4 w-32 rounded-md" />`. User composes their own tree. Animation: `animate-pulse` (Tailwind), background: `bg-muted` (semantic token).                                                                                                                                                                                                                                                                                             | Tiny surface area, dark-mode for free via semantic tokens.                              | No higher-level types. User retypes the entire layout in skeleton form.             |
| **Flowbite Skeleton**           | Variant components: `default`, `image`, `video`, `list`, `card`, `widget` (chart), `button`, `paragraph`, `testimonial`. Each variant is a fixed HTML structure with `animate-pulse` placeholders. Image / video variants include placeholder SVG icons. Includes `role="status"` + `<span class="sr-only">Loading...</span>` for a11y.                                                                                                                                  | Drop-in patterns for common layouts. Solid a11y default. Dark mode via Tailwind tokens. | Fixed structures — no composition. No auto-detect. Inline HTML, no component reuse. |

**Synthesis** — we want all three modes:

- **Auto-detect from slot** (our existing differentiator; no one else has this).
- **Type-string composition** (Vuetify-style, terse for common patterns).
- **Composable primitive** (shadcn-style, full control when needed).

---

## Problem statement

The walker today (`src/utils/buildStructuralSkeleton.ts`) dispatches on three buckets: atomic tags, surface tags, generic containers. That's coarse. We need explicit handling for **every category** below so visual treatment is predictable:

| Category                  | Examples                                                                                                                    | Today                                        | v2                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Heading                   | `<h1>`–`<h6>`                                                                                                               | generic container (text-content span inside) | dedicated `headingTransform` — bar height matches font-size, single line by default                                                |
| Paragraph                 | `<p>`, `<blockquote>`                                                                                                       | generic container                            | `paragraphTransform` — wraps inline text content, last visual line shorter                                                         |
| Inline phrasing           | `<span>`, `<a>`, `<em>`, `<strong>`, `<code>`, `<mark>`                                                                     | generic container                            | `inlineTransform` — pass-through with text-content replacement                                                                     |
| Atomic media              | `<img>`, `<svg>`, `<video>`, `<canvas>`                                                                                     | atomic block (size from class/attr)          | `mediaTransform` — shimmer block + optional placeholder icon (image, video, file SVG like Flowbite)                                |
| Audio                     | `<audio>`                                                                                                                   | atomic block                                 | `audioTransform` — narrow horizontal bar + play-icon placeholder                                                                   |
| Form controls             | `<input>`, `<textarea>`, `<select>`                                                                                         | atomic block                                 | `inputTransform` — bordered rect with caret-like inner bar                                                                         |
| Form structural           | `<form>`, `<fieldset>`, `<legend>`, `<label>`                                                                               | surface fallback                             | `formTransform` — group rendering, legend as small text bar, fieldset border preserved                                             |
| Interactive               | `<button>`, `<a>`, `<summary>`                                                                                              | surface fallback (bg detection)              | `interactiveTransform` — bg detection + button/link shape preservation + shimmer text inside                                       |
| Containers (block)        | `<div>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<main>`, `<aside>`, `<nav>`                                     | generic container                            | `containerTransform` — surface signal detection (bg/border/shadow) → preserve, otherwise pass-through                              |
| List                      | `<ul>`, `<ol>`, `<li>`, `<dl>`, `<dt>`, `<dd>`                                                                              | generic container                            | `listTransform` — preserves list semantics; `<li>` gets `list-item-avatar` / `list-item-two-line` style treatment by content shape |
| Table                     | `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<td>`, `<th>`, `<caption>`, `<colgroup>`, `<col>`                      | generic container (broken)                   | `tableTransform` — preserves table structure; cells become text bars matching column widths                                        |
| Embedded                  | `<iframe>`, `<object>`, `<embed>`                                                                                           | atomic block                                 | `embedTransform` — placeholder rect with frame icon                                                                                |
| Picture / Source          | `<picture>`, `<source>`                                                                                                     | atomic block                                 | `pictureTransform` — recurse to inner `<img>`, replace it with media leaf                                                          |
| Web components            | custom-element names (hyphenated)                                                                                           | component vnode → opaque block               | `webComponentTransform` — detect by hyphen + treat as opaque block carrying outer attrs                                            |
| Component vnodes          | Vue components                                                                                                              | opaque block carrying outer class            | `componentTransform` — opt-in `data-skeleton-introspect` to render the component's default tree                                    |
| SVG content               | `<circle>`, `<rect>`, `<path>` inside `<svg>`                                                                               | walked recursively (wrong)                   | `svgInteriorTransform` — when inside `<svg>`, **don't** recurse — treat the whole svg as one media leaf                            |
| Comment / Text / Fragment | Vue's `Comment`, `Text`, `Fragment`                                                                                         | handled correctly                            | unchanged                                                                                                                          |
| Author opt-outs           | `data-skeleton-ignore`, `data-skeleton-stop`, `data-skeleton-text`, `data-skeleton-block`, `data-skeleton-variant="<name>"` | only first two                               | five attributes, all handled in the dispatch table before tag-based dispatch                                                       |

---

## Architecture

### 1. Dispatch table (replaces the if-chain in `transformElement`)

```ts
type Transformer = (v: VNode, opts: BuildOptions, ctx: WalkContext) => VNode;

const TAG_TRANSFORMERS: Record<string, Transformer> = {
  /* heading */
  h1: headingT,
  h2: headingT,
  h3: headingT,
  h4: headingT,
  h5: headingT,
  h6: headingT,
  /* paragraph */
  p: paragraphT,
  blockquote: paragraphT,
  /* inline phrasing — pass-through */
  span: inlineT,
  em: inlineT,
  strong: inlineT,
  code: inlineT,
  mark: inlineT,
  small: inlineT,
  time: inlineT,
  b: inlineT,
  i: inlineT,
  /* atomic media */
  img: mediaT,
  svg: mediaT,
  canvas: mediaT,
  video: mediaT,
  picture: pictureT,
  audio: audioT,
  /* form controls */
  input: inputT,
  textarea: textareaT,
  select: selectT,
  /* form structural */
  form: formT,
  fieldset: fieldsetT,
  legend: legendT,
  label: labelT,
  /* interactive */
  button: interactiveT,
  a: interactiveT,
  summary: interactiveT,
  /* lists */
  ul: listT,
  ol: listT,
  li: listItemT,
  dl: listT,
  dt: listItemT,
  dd: listItemT,
  /* tables */
  table: tableT,
  thead: tableSectionT,
  tbody: tableSectionT,
  tfoot: tableSectionT,
  tr: tableRowT,
  td: tableCellT,
  th: tableCellT,
  caption: captionT,
  colgroup: passT,
  col: passT,
  /* embedded */
  iframe: embedT,
  object: embedT,
  embed: embedT,
  progress: atomicT,
  meter: atomicT,
  hr: atomicT,
  /* default */
  div: containerT,
  section: containerT,
  article: containerT,
  header: containerT,
  footer: containerT,
  main: containerT,
  aside: containerT,
  nav: containerT,
};

function transformElement(v, opts, ctx) {
  const tag = (v.type as string).toLowerCase();
  /* 1. author opt-outs (highest priority) */
  const optOut = applyOptOut(v, opts);
  if (optOut) return optOut;
  /* 2. inside SVG context — don't walk SVG interior */
  if (ctx.inSvg) return mediaT(v, opts, ctx); /* never reached if parent is svg leaf */
  /* 3. tag-based dispatch */
  const t = TAG_TRANSFORMERS[tag];
  if (t) return t(v, opts, { ...ctx, inSvg: tag === 'svg' });
  /* 4. web component fallback */
  if (tag.includes('-')) return webComponentT(v, opts, ctx);
  /* 5. unknown HTML element — pass through as container */
  return containerT(v, opts, ctx);
}
```

The `WalkContext` carries depth, parent-tag-hint, and a `inSvg` flag.

### 2. Author opt-outs (full set)

| Attribute                        | Behaviour                                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-skeleton-ignore`           | Render the original vnode verbatim. Chrome (decorative SVGs, dividers, persistent badges).                                                          |
| `data-skeleton-stop`             | Collapse the subtree into one shimmer block carrying outer class/style.                                                                             |
| `data-skeleton-text`             | Force the leaf into text-bar treatment (override tag detection).                                                                                    |
| `data-skeleton-block`            | Force the leaf into shimmer-block treatment.                                                                                                        |
| `data-skeleton-variant="<name>"` | Render the named variant primitive (`avatar`, `heading`, `paragraph`, `image`, `card`, `list-item`, `table-row`, etc.) instead of walking children. |

All five live in a single `applyOptOut(v, opts)` checked **before** tag dispatch.

### 3. Containment invariant (overflow, once and for all)

Three layers of containment, none reactive:

1. **Wrapper** — `.a-skeleton[data-loading]` uses `overflow: clip` (sticky-safe) with `overflow: hidden` fallback. Already in place.
2. **Per-block** — `.a-skel-block` keeps `overflow: hidden` + `position: relative` (structural rules, not in `:where()`). The shimmer ::after is contained.
3. **Inline text** — `.a-skel-text-content` uses opacity pulse only (no gradient sweep that can bleed across line boundaries with `box-decoration-break: clone`).

**Plus** a new safety net for elements that produce visible output outside their box (`filter`, `transform: scale`, `box-shadow`):

```css
.a-skeleton[data-loading] {
  /* Painting from descendants (shadows, filters, transforms) is also clipped. */
  contain: paint;
}
```

`contain: paint` does NOT establish a containing block for sticky descendants (unlike `overflow: hidden`), but it DOES clip painting. Combined with `overflow: clip`, the wrapper becomes a hard visual boundary.

### 4. Style detection — replace regex with a layered cascade

Instead of detecting `bg-*` by string, **render two candidate trees** and let CSS decide:

- Every walker output carries `class="<original> a-skel-default"`.
- `.a-skel-default { background: var(--ak-skeleton-block); … }` is wrapped in `:where()` so it has zero specificity.
- Any consumer class (Tailwind `bg-emerald-600`, DaisyUI `btn-primary`, custom `.my-card`, inline `style="background: …"`) wins the cascade naturally.

No regex. Works for every styling system. The detector code shrinks to nothing.

### 5. Variant primitives (Flowbite-style + shadcn-style)

Ship `<ASkeleton[Name]>` components for the common patterns. Each is a thin render-function component built on top of `<ASkeletonBlock>` / `<ASkeletonText>`:

| Primitive                                      | Maps to                                   | Notes                             |
| ---------------------------------------------- | ----------------------------------------- | --------------------------------- |
| `<ASkeletonBlock>`                             | `<div class="a-skel-block">` + size props | existing, unchanged               |
| `<ASkeletonText :lines :width>`                | n stacked bars, last shorter              | new — matches Vuetify `paragraph` |
| `<ASkeletonHeading :level>`                    | one bar sized to `text-{xl,2xl,…}`        | new                               |
| `<ASkeletonAvatar :size :circle>`              | circle/square block                       | new                               |
| `<ASkeletonImage :icon :ratio>`                | aspect-ratio rect + image icon            | new — Flowbite-style placeholder  |
| `<ASkeletonVideo :ratio>`                      | rect + play icon                          | new                               |
| `<ASkeletonButton :variant>`                   | rounded rect, optional border             | new                               |
| `<ASkeletonInput>`                             | bordered rect with caret bar              | new                               |
| `<ASkeletonCard>`                              | image + heading + paragraph + actions     | new — Flowbite `card`             |
| `<ASkeletonListItem :avatar :lines :trailing>` | avatar + n text lines + trailing slot     | new — Vuetify `list-item-*`       |
| `<ASkeletonTable :rows :columns>`              | thead + N×M body                          | new — Vuetify `table-row`         |
| `<ASkeletonChart :bars :height>`               | N vertical bars of varying heights        | new — Flowbite `widget`           |
| `<ASkeletonForm :fields>`                      | label/input pairs + submit                | new                               |
| `<ASkeletonArticle :paragraphs :media>`        | heading + media + paragraphs              | new                               |

Each primitive accepts a `class` prop forwarded to the root + reads from the same CSS vars (`--ak-skeleton-*`) so theming is consistent.

### 6. Type-string composition (Vuetify-style)

Extend `<ASkeleton>` with a `type` prop:

```vue
<ASkeleton type="card-avatar, article, actions" :loading="loading" />
<ASkeleton type="list-item-two-line" :loading="loading" />
<ASkeleton :types="['heading', 'paragraph']" :loading="loading" />
```

The `type` string is parsed: comma = sibling, newline = nested. Each token resolves to a variant primitive. If both `type` and a default slot are provided, the type-string wins (matches Vuetify behaviour).

Vocabulary (~30 tokens) — superset of Vuetify's: `actions`, `article`, `avatar`, `button`, `card`, `card-avatar`, `card-heading`, `chart`, `chip`, `divider`, `form`, `form-field`, `heading`, `image`, `input`, `list-item`, `list-item-avatar`, `list-item-three-line`, `list-item-two-line`, `paragraph`, `sentences`, `table`, `table-cell`, `table-heading`, `table-row`, `table-row-divider`, `table-tbody`, `text`, `textarea`, `video`, `widget`.

### 7. Styling revamp

Adopt a hybrid of all three references:

- **Default animation: opacity pulse** (shadcn / Flowbite) — already done in 1.4.2+. Visible at every frame, no gradient bleeds.
- **Optional: shimmer sweep** via `animation` prop value `"shimmer"` — kept for users who prefer it. Constrained per-element by `.a-skel-block { overflow: hidden }`.
- **Semantic tokens** (shadcn-style) — `--ak-skeleton-base`, `--ak-skeleton-highlight`, `--ak-skeleton-radius`, `--ak-skeleton-duration`. Light/dark via class scope (`.dark .a-skeleton { … }`) AND `@media (prefers-color-scheme: dark)`.
- **Theme presets** ship as opt-in CSS layers consumers can `@import`:
  - `@alikhalilll/a-skeleton/themes/minimal.css` (shadcn-flavoured, low contrast)
  - `@alikhalilll/a-skeleton/themes/elegant.css` (Vuetify-flavoured, gradient sweep)
  - `@alikhalilll/a-skeleton/themes/structured.css` (Flowbite-flavoured, opaque blocks)
- **Variant-level overrides** via `--ak-skeleton-{variant}-base` cascade: `<ASkeletonImage style="--ak-skeleton-image-base: hsl(200 50% 90%)">`.

Animation menu (existing `animation` prop):

| Value     | What                                                        | Default? |
| --------- | ----------------------------------------------------------- | -------- |
| `pulse`   | opacity 1 → 0.55 → 1 over `--ak-skeleton-duration`          | yes      |
| `shimmer` | gradient sweep ::after, contained per block                 | no       |
| `wave`    | gradient via `background-position` (Flowbite-style sliding) | no       |
| `none`    | static blocks                                               | no       |

### 8. A11y

Every variant root gets `role="status"` + an invisible `<span class="sr-only">Loading…</span>` + `aria-busy="true"` (matching Flowbite). The mirror wrapper already does this — extend to primitives.

---

## Implementation phases

### Phase 1 — Detection refactor (no API change)

- [ ] Build the dispatch table (`TAG_TRANSFORMERS`) in a new `src/utils/transformers/` directory, one file per category.
- [ ] Each transformer is pure: `(v, opts, ctx) => VNode`. Tested in isolation.
- [ ] `applyOptOut` handles all five attributes.
- [ ] `WalkContext` carries `depth`, `parentTag`, `inSvg`.
- [ ] Replace existing `transformElement` body with the dispatch lookup.
- [ ] Tests: one test file per transformer; ~150 unit tests total.

Files touched: `src/utils/buildStructuralSkeleton.ts`, new `src/utils/transformers/*.ts`, `tests/transformers/*.test.ts`. **No breaking changes** — existing `<ASkeleton :loading>` behaviour identical, just more accurate for tables / forms / video.

### Phase 2 — Variant primitives

- [ ] One Vue render-function component per primitive in `src/components/variants/`.
- [ ] Shared base via composable `useSkeletonStyles(props)` that consumes CSS vars.
- [ ] Export from `src/index.ts`, register in `src/nuxt/index.ts` for auto-import, add to `web-types.json` generator.
- [ ] Tests: mount each primitive, assert structural DOM shape; ~40 unit tests.

### Phase 3 — Type-string composition

- [ ] Parser: `parseTypeString(str)` → `TypeNode[]` (tree).
- [ ] Resolver: `TypeNode → VNode` using the variant primitives.
- [ ] Wire to `<ASkeleton>` props (`type: string` + `types: string[]` for the array form).
- [ ] Tests: parse + resolve coverage for all ~30 tokens.

### Phase 4 — Styling revamp

- [ ] Refactor `styles.src.css` into:
  - `tokens.css` — variable declarations + light/dark scopes
  - `base.css` — `.a-skel-block`, `.a-skel-text-content`, wrapper containment
  - `animations.css` — keyframes for `pulse`, `shimmer`, `wave`
  - `variants.css` — per-variant tweaks
- [ ] Move every cosmetic default behind `:where()` for cascade-safety.
- [ ] Add `contain: paint` to wrapper for shadow/filter containment.
- [ ] Ship theme presets under `dist/themes/*.css`.

### Phase 5 — Visual regression suite

- [ ] Playwright script captures every variant in light + dark mode, peak + trough of animation.
- [ ] Compare against committed reference PNGs (with a small diff tolerance).
- [ ] Block CI on diff.
- [ ] Add to `pnpm validate` flow.

### Phase 6 — Docs + playground

- [ ] One section per variant in `apps/docs/content/ui/skeleton.md`.
- [ ] One demo component per variant in `apps/docs/components/DemoSkeleton{Name}.vue`.
- [ ] Playground page gets a section per category: **auto-detect**, **type-string**, **variant primitive**, **theme switcher**.
- [ ] Migration guide ("upgrading from 1.x" — no breaking changes; surfaces new primitives + opt-outs).

---

## Containment edge cases the design must handle

Listing every overflow source so the design closes each one:

| Source                                                             | Today                                           | v2 fix                                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.a-skel-block::after` shimmer sweep extends 25% beyond box        | clipped by `.a-skel-block { overflow: hidden }` | unchanged                                                                                      |
| `box-decoration-break: clone` + animated background on inline text | bleeds across lines                             | replaced with opacity pulse (no bg animation on text)                                          |
| Absolutely-positioned decorations inside skeleton tree             | rendered as huge shimmer blocks (320×320)       | `data-skeleton-ignore` honoured in DOM-mirror walker (already shipped)                         |
| `box-shadow` on inner card extends past wrapper                    | painted, not clipped                            | wrapper gets `contain: paint` in v2                                                            |
| `transform: scale` / `filter: blur` extend past box                | painted, not clipped                            | wrapper gets `contain: paint`                                                                  |
| `position: sticky` inside a slot with parent `overflow: hidden`    | broken                                          | wrapper uses `overflow: clip` (already shipped)                                                |
| User passes their own `class` with `overflow: visible`             | overrides ours                                  | structural rules NOT in `:where()`; user override would need higher specificity / `!important` |

---

## Verification (Phase 5 in detail)

Six checkpoints, all automated:

1. **Visual regression** — every variant × theme × animation × loading-state combination has a committed reference image. CI blocks on diff > 1%.
2. **Containment audit** — every demo passes a "no descendant rect overflows wrapper rect" assertion in Playwright.
3. **Sticky-safety** — a demo with `<div style="position: sticky; top: 0">` inside the slot scrolls correctly past the wrapper.
4. **Layout fidelity** — for the existing complex hero, assert `skeletonHeight === realHeight ± 4px`.
5. **A11y** — every primitive's root has `role="status"`, `aria-busy="true"`, and a `.sr-only` "Loading…" span (assert via `@testing-library/vue` queries).
6. **Theme switching** — toggling `.dark` on a wrapper changes the rendered colour tokens (assert via computed style).

---

## Migration / backwards compatibility

- **No breaking changes** to `<ASkeleton :loading>` slot-based API.
- All variant primitives are new exports — additive.
- `type` prop on `<ASkeleton>` is new — additive.
- Five new `data-skeleton-*` attributes — additive.
- Schema version bump for cache (cache-replay is a rarely-used legacy path; bump alerts old payloads as needed).
- README + docs site updated with a "What's new in v2" section.

---

## Open questions for review

1. **Cache-replay path** — should we deprecate `useSkeleton` / `<ASkeletonLayer>` (the measured positioned-block model) in v2 since the DOM-mirror approach has subsumed its use cases?
2. **Animation default** — `pulse` (current, shipped in 1.4.2+) or `shimmer` (more flashy, but harder to contain)?
3. **`type`-string syntax** — keep Vuetify's comma/newline convention, or use an array prop (`:types`) only?
4. **Theme presets** — three is a starting set; do we ship more, or let consumers fork?
5. **Web-component introspection** — should we read `customElement.connectedCallback`'s rendered DOM and walk that, or always opaque-block? (Probably always opaque for now; introspection is an advanced opt-in.)

Resolve before starting Phase 1.
