---
title: auto-middleware
description: Declarative, layout-based route middleware for Nuxt 3/4 with glob patterns, named groups, and per-page overrides.
package: "@alikhalilll/nuxt-auto-middleware"
order: 3
---

# @alikhalilll/nuxt-auto-middleware

Declarative, layout-based route middleware for Nuxt 3 / 4. Map layouts to middlewares once in your `nuxt.config.ts` — the module generates a single global route middleware that dispatches the right chain on each navigation.

- **Layout → middleware mapping** with **glob patterns** or RegExp.
- **Named middleware groups** for DRY rules: `{ auth: ['auth', 'verify-role'] }` referenced as `@auth`.
- **Per-page overrides** via `definePageMeta({ middlewares: [...] })` or `skipAutoMiddleware: true`.
- **Typed registry** — the module generates an `AutoMiddlewareName` union and augments `PageMeta`, so typos are compile errors.
- **Early termination** — a middleware returning `false` stops the chain; any other value is treated as a navigation result.
- **Zero runtime deps** — just Nuxt.

## Install

```bash
pnpm add @alikhalilll/nuxt-auto-middleware
```

## Register the module

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

::DemoAutoMiddleware
::

## Basic mapping

```ts
autoMiddleware: {
  rules: [
    { layouts: ['default'], middlewares: ['track-pageview'] },
  ],
},
```

Any page using the `default` layout will run `~/middleware/track-pageview.ts` before rendering.

## Named groups

Groups keep rules DRY when the same stack is used from multiple layouts. Unknown `@group` names throw during `nuxt prepare`.

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

## Glob patterns

Layouts support `*` (non-slash), `**` (any), and `?` (one non-slash char).

```ts
rules: [
  { layouts: ['dashboard/*'], middlewares: ['@auth'] },
  { layouts: ['admin/**'],    middlewares: ['@adminOnly'] },
  { layouts: ['settings-?'],  middlewares: ['verify-role'] },
],
```

## RegExp patterns

```ts
rules: [
  { layouts: [/^(dashboard|portal)$/], middlewares: ['@auth'] },
  { layouts: [/^ops\//],               middlewares: ['require-ops'] },
],
```

## Per-page extras

Append middlewares for one page without changing the global rules. The field name (`middlewares` by default) is configurable via `pageMetaField`.

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middlewares: ['force-2fa'], // runs AFTER @auth resolved from the layout rule
});
</script>
```

Because `AutoMiddlewareName` is generated from your rules + groups, typos are compile-time errors.

## Opt a page out entirely

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  skipAutoMiddleware: true,
});
</script>
```

## Catch-all layout

Use `**` to run a middleware for every layout (except pages with `layout: false` or `skipAutoMiddleware: true`):

```ts
rules: [
  { layouts: ['**'], middlewares: ['track-pageview'] },
  { layouts: ['dashboard', 'admin'], middlewares: ['@auth'] },
],
```

When multiple rules match, middlewares are concatenated in config order and deduped (first occurrence wins).

## Middleware return values

Middleware functions receive `(to, from)` exactly like standard Nuxt route middlewares.

| Return        | Behaviour                                      |
|---------------|------------------------------------------------|
| `false`       | Stop the chain, allow navigation.              |
| `true` / void | Continue to the next middleware.               |
| anything else | Treated as a navigation result — chain stops.  |

```ts
// ~/middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('token').value;
  if (!token) return navigateTo('/login');
});
```

Every middleware runs inside `callWithNuxt()`, so `useNuxtApp()` / composables work as usual.

## Typed registry

The module emits `#build/auto-middleware/types.d.ts` with:

```ts
export type AutoMiddlewareName = 'auth' | 'verify-role' | 'require-admin' | 'log-activity';
```

…plus an augmentation that adds `middlewares?: AutoMiddlewareName[]` and `skipAutoMiddleware?: boolean` to `PageMeta`.

## Matching rules

- A page with no explicit layout is treated as `default`.
- `layout: false` is skipped.
- `skipAutoMiddleware: true` is skipped.
- Layout pattern matching is **anchored** — partial matches don't count.
- Multiple matches are concatenated in config order and deduped.

## Module options

| Option          | Type                                      | Default             | Purpose                                                                      |
|-----------------|-------------------------------------------|---------------------|------------------------------------------------------------------------------|
| `rules`         | `AutoMiddlewareRule[]`                    | `[]`                | Layout → middlewares mapping. Required.                                      |
| `groups`        | `Record<string, string[]>`                | `{}`                | Named reusable middleware lists, referenced via `@name` inside rules.        |
| `debug`         | `boolean`                                 | `false`             | Log resolution + execution at runtime.                                       |
| `pageMetaField` | `string \| false`                         | `'middlewares'`     | Page-meta key used to append extra middlewares.                              |

## Exported types

```ts
import type {
  AutoMiddlewareOptions,
  AutoMiddlewareRule,
} from '@alikhalilll/nuxt-auto-middleware/types';
```
