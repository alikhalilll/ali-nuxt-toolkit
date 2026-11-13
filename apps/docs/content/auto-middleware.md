---
title: 'auto-middleware — Nuxt 3 / 4 layout-based route middleware'
description: 'Declarative layout-based route middleware for Nuxt 3 / 4 — glob patterns, named groups, per-page overrides, and a typed registry. Map layouts to middlewares once in nuxt.config; the module generates the dispatch chain.'
package: '@alikhalilll/nuxt-auto-middleware'
order: 3
keywords:
  - nuxt middleware
  - nuxt route middleware
  - auto middleware
  - layout middleware
  - nuxt 3 middleware
  - nuxt 4 middleware
  - declarative middleware
  - glob middleware
  - typed middleware
  - nuxt 3
  - nuxt 4
  - typescript
  - nuxt module
---

# `@alikhalilll/nuxt-auto-middleware`

> Map **layouts** to middlewares once in `nuxt.config.ts`. The module generates a single global route middleware that dispatches the right chain per navigation. Typed, DRY, zero runtime dependencies.

::DemoAutoMiddleware
::

::alert{type="note" title="What this module is — and isn't"}
It dispatches middlewares **per layout**, not per page. Pages opt in or out through their layout assignment (or `definePageMeta`). If your rules are page-level — "this middleware only runs on `/settings/billing`" — you want Nuxt's standard per-page `middleware` array, not this module.
::

## Install

::doc-install{pkg="@alikhalilll/nuxt-auto-middleware"}
::

Register the module and declare your mapping:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-auto-middleware'],
  autoMiddleware: {
    groups: {
      auth: ['auth', 'verify-role'],
    },
    rules: [
      { layouts: ['default'], middlewares: ['log-activity'] },
      { layouts: ['dashboard', 'dashboard/*'], middlewares: ['@auth'] },
      { layouts: ['admin'], middlewares: ['@auth', 'require-admin'] },
    ],
    debug: false,
    pageMetaField: 'middlewares',
  },
});
```

Middleware files live in the standard Nuxt location: `~/middleware/auth.ts`, `~/middleware/verify-role.ts`, etc.

## Quick start — basic mapping

A single rule, the common case:

```ts
autoMiddleware: {
  rules: [
    { layouts: ['default'], middlewares: ['track-pageview'] },
  ],
},
```

Any page using the `default` layout runs `~/middleware/track-pageview.ts` before rendering. Pages with no explicit `layout` are treated as `default` — [see matching rules](#matching-rules).

## Named groups

Groups keep rules DRY when the same stack runs across multiple layouts. Reference a group as `@name` inside `middlewares`.

```ts
autoMiddleware: {
  groups: {
    auth:      ['auth', 'verify-role'],
    adminOnly: ['auth', 'verify-role', 'require-admin'],
  },
  rules: [
    { layouts: ['dashboard', 'dashboard/*'], middlewares: ['@auth'] },
    { layouts: ['admin', 'admin/*'],         middlewares: ['@adminOnly'] },
  ],
},
```

::alert{type="info" title="Groups are validated at `nuxt prepare`"}
Reference a group that isn't declared and the build fails before you hit a navigation. The typed registry means the same is true for middleware **names** — a typo surfaces in your editor, not at runtime.
::

## Glob patterns

Layouts support `*` (non-slash), `**` (any), and `?` (one non-slash char).

```ts
rules: [
  { layouts: ['dashboard/*'], middlewares: ['@auth'] },
  { layouts: ['admin/**'],    middlewares: ['@adminOnly'] },
  { layouts: ['settings-?'],  middlewares: ['verify-role'] },
],
```

::alert{type="warning" title="Anchored matches only"}
`layouts: ['dashboard']` does not match `dashboard/overview`. Use `['dashboard', 'dashboard/*']` or `['dashboard/**']` to match descendants. Readers trip on this once and then adopt the two-item pattern reflexively.
::

## RegExp patterns

When globs aren't enough:

```ts
rules: [
  { layouts: [/^(dashboard|portal)$/], middlewares: ['@auth'] },
  { layouts: [/^ops\//],               middlewares: ['require-ops'] },
],
```

## Per-page extras

Append middlewares for one page without touching the global rules. The field name (`middlewares` by default) is configurable via `pageMetaField`.

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middlewares: ['force-2fa'],
});
</script>
```

::alert{type="info" title="Per-page runs _after_ the layout rule"}
`force-2fa` above runs after the `@auth` group resolved from the layout rule. Order inside a chain matters — put the gate that can short-circuit first.
::

## Opting a page out

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  skipAutoMiddleware: true,
});
</script>
```

::alert{type="warning" title="`skipAutoMiddleware: true` opts out of _everything_"}
Including catch-all rules like `layouts: ['**']`. If you want a page to skip only one chain but keep the rest (e.g. skip `@auth` but keep `track-pageview`), rework the groups instead — there is no per-middleware opt-out.
::

::alert{type="warning" title="`layout: false` skips the module entirely"}
Pages with `layout: false` get **no** auto-middleware dispatch, including catch-all rules. If you have a public landing page with `layout: false`, it won't run `track-pageview` even if your rules say every layout should.
::

## Catch-all layout

Use `**` to run a middleware for every layout (except pages with `layout: false` or `skipAutoMiddleware: true`):

```ts
rules: [
  { layouts: ['**'], middlewares: ['track-pageview'] },
  { layouts: ['dashboard', 'admin'], middlewares: ['@auth'] },
],
```

When multiple rules match, middlewares are concatenated in config order and deduplicated — first occurrence wins.

::alert{type="warning" title="Dedup is first-wins, not last-wins"}
If `@auth` includes `verify-role` and your per-page `middlewares` also lists `verify-role`, the page-level entry is dropped. Rely on groups as the single source of truth or you'll have ghost entries that don't do anything but look meaningful.
::

## Middleware return values

Middleware functions receive `(to, from)` exactly like standard Nuxt route middlewares.

| Return        | Behaviour                                     |
| ------------- | --------------------------------------------- |
| `false`       | Stop the chain, allow navigation.             |
| `true` / void | Continue to the next middleware.              |
| anything else | Treated as a navigation result — chain stops. |

```ts
// ~/middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('token').value;
  if (!token) return navigateTo('/login');
});
```

Every middleware runs inside `callWithNuxt()`, so `useNuxtApp()` and composables work as usual.

## Typed registry

The module emits `#build/auto-middleware/types.d.ts`:

```ts
export type AutoMiddlewareName = 'auth' | 'verify-role' | 'require-admin' | 'log-activity';
```

Plus an augmentation that adds `middlewares?: AutoMiddlewareName[]` and `skipAutoMiddleware?: boolean` to `PageMeta`.

## Matching rules {#matching-rules}

The resolver's rules, in order:

- A page with no explicit layout is treated as `default`.
- `layout: false` pages are skipped entirely.
- `skipAutoMiddleware: true` pages are skipped entirely.
- Layout pattern matching is **anchored** — partial matches don't count. `dashboard/*` matches `dashboard/overview`, not `app-dashboard`.
- Multiple matching rules are concatenated in config order and deduplicated. First occurrence of a middleware wins.

## API reference

### Module options

| Option          | Type                       | Default         | Purpose                                                               |
| --------------- | -------------------------- | --------------- | --------------------------------------------------------------------- |
| `rules`         | `AutoMiddlewareRule[]`     | `[]`            | Layout → middlewares mapping. Required.                               |
| `groups`        | `Record<string, string[]>` | `{}`            | Named reusable middleware lists, referenced via `@name` inside rules. |
| `debug`         | `boolean`                  | `false`         | Log resolution + execution at runtime.                                |
| `pageMetaField` | `string \| false`          | `'middlewares'` | Page-meta key used to append extra middlewares. `false` disables it.  |

### Exported types

```ts
import type {
  AutoMiddlewareOptions,
  AutoMiddlewareRule,
} from '@alikhalilll/nuxt-auto-middleware/types';
```
