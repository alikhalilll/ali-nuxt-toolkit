# @alikhalilll/nuxt-auto-middleware

Declarative, layout-based route middleware for Nuxt 3 / 4. Map layouts to middlewares once in your `nuxt.config.ts` — the module generates a single global route middleware that dispatches the right chain on each navigation.

- **Layout → middleware mapping** with **glob patterns** (`dashboard/*`, `admin*`) or RegExp objects.
- **Named middleware groups** for DRY configuration: `{ auth: ['auth', 'verify-role'] }` referenced as `@auth`.
- **Per-page overrides** via `definePageMeta({ middlewares: [...] })` or `skipAutoMiddleware: true`.
- **Typed registry** — the module generates a `AutoMiddlewareName` union type and augments `PageMeta`, so typos are compile errors.
- **Early termination** — a middleware returning `false` stops the chain; any other value is treated as a navigation result.
- **Zero runtime deps** — just Nuxt.

---

## Table of contents

1. [Install](#install)
2. [Register the module](#register-the-module)
3. [Usage](#usage)
    - [Basic mapping](#basic-mapping)
    - [Named groups](#named-groups)
    - [Glob patterns](#glob-patterns)
    - [RegExp patterns](#regexp-patterns)
    - [Per-page extras](#per-page-extras)
    - [Opt a page out entirely](#opt-a-page-out-entirely)
    - [Catch-all layout](#catch-all-layout)
    - [Disabling per-page overrides](#disabling-per-page-overrides)
    - [Debug logs](#debug-logs)
4. [Middleware return values](#middleware-return-values)
5. [Typed registry](#typed-registry)
6. [Matching rules](#matching-rules)
7. [Module options reference](#module-options-reference)
8. [Exported types](#exported-types)

---

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
    pageMetaField: 'middlewares', // set to false to disable per-page extras
  },
});
```

Middleware files live in the standard Nuxt location: `~/middleware/auth.ts`, `~/middleware/verify-role.ts`, etc.

## Usage

### Basic mapping

One layout, one middleware — the simplest rule:

```ts
autoMiddleware: {
  rules: [
    { layouts: ['default'], middlewares: ['track-pageview'] },
  ],
},
```

Any page using the `default` layout (explicitly, or implicitly — no `layout` in `definePageMeta`) will run `~/middleware/track-pageview.ts` before rendering.

### Named groups

Groups keep rules DRY when the same stack of middlewares is used from multiple layouts:

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

Group references are expanded at build time. An unknown `@group` name throws during `nuxt prepare`, so typos don't silently ship.

### Glob patterns

Layouts support `*` (non-slash), `**` (any), and `?` (one non-slash char):

```ts
rules: [
  { layouts: ['dashboard/*'], middlewares: ['@auth'] },      // dashboard/x, dashboard/y
  { layouts: ['admin/**'],    middlewares: ['@adminOnly'] }, // admin/x, admin/x/y, ...
  { layouts: ['settings-?'],  middlewares: ['verify-role'] }, // settings-a, settings-b
],
```

### RegExp patterns

For anything more expressive, pass a RegExp directly:

```ts
rules: [
  { layouts: [/^(dashboard|portal)$/], middlewares: ['@auth'] },
  { layouts: [/^ops\//],               middlewares: ['require-ops'] },
],
```

### Per-page extras

Append additional middlewares for one page without changing global rules. The field name (`middlewares` by default) is configurable via `pageMetaField`:

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middlewares: ['force-2fa'], // runs AFTER @auth resolved from the layout rule
});
</script>
```

Because the `AutoMiddlewareName` type is generated from your rules + groups, typos are compile-time errors.

### Opt a page out entirely

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  skipAutoMiddleware: true, // no middleware runs, even though dashboard would match
});
</script>
```

### Catch-all layout

Use `**` to run middleware for every layout (except pages with `layout: false` or `skipAutoMiddleware: true`):

```ts
rules: [
  { layouts: ['**'], middlewares: ['track-pageview'] },
  { layouts: ['dashboard', 'admin'], middlewares: ['@auth'] },
],
```

When multiple rules match the same layout, their middlewares are concatenated in config order (duplicates are dropped).

### Disabling per-page overrides

```ts
autoMiddleware: {
  pageMetaField: false, // ignore definePageMeta({ middlewares: [...] })
  rules: [ /* ... */ ],
},
```

The typed registry is still generated (so `AutoMiddlewareName` remains useful elsewhere); the dispatcher just doesn't look at page meta.

### Debug logs

```ts
autoMiddleware: { debug: true, rules: [ /* ... */ ] }
```

With debug on, each navigation logs the resolved layout and the full ordered chain, plus whether any middleware returned `false` or a redirect.

## Middleware return values

Middleware functions receive `(to, from)` exactly like standard Nuxt route middlewares:

| Return        | Behaviour                                      |
|---------------|------------------------------------------------|
| `false`       | Stop the chain, allow navigation.              |
| `true` / void | Continue to the next middleware.               |
| anything else | Treated as a navigation result — chain stops.  |

Example: an auth middleware that redirects to `/login` when the cookie is missing, otherwise lets the chain continue:

```ts
// ~/middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('token').value;
  if (!token) return navigateTo('/login');
  // undefined → continue to the next middleware
});
```

Every middleware runs inside `callWithNuxt()`, so `useNuxtApp()` / composables work as usual.

## Typed registry

The module emits `#build/auto-middleware/types.d.ts` with:

```ts
export type AutoMiddlewareName = 'auth' | 'verify-role' | 'require-admin' | 'log-activity';
```

…plus an augmentation that adds `middlewares?: AutoMiddlewareName[]` and `skipAutoMiddleware?: boolean` to `PageMeta`. Both are auto-included in the Nuxt-generated `nuxt.d.ts`, so you don't need to import anything. You *can* import the type if you're authoring outside of `definePageMeta`:

```ts
import type { AutoMiddlewareName } from '#build/auto-middleware/types';

const stack: AutoMiddlewareName[] = ['auth', 'verify-role'];
```

## Matching rules

- A page with no explicit layout is treated as `default`.
- A page with `layout: false` is skipped entirely.
- A page with `skipAutoMiddleware: true` is skipped entirely.
- Layout pattern matching is anchored (`^...$`) — partial matches do **not** count.
- When multiple rules match, middlewares are concatenated in config order and deduped (first occurrence wins).

## Module options reference

| Option          | Type                                      | Default             | Purpose                                                                                                |
|-----------------|-------------------------------------------|---------------------|--------------------------------------------------------------------------------------------------------|
| `rules`         | `AutoMiddlewareRule[]`                    | `[]`                | Layout → middlewares mapping. Required.                                                                |
| `groups`        | `Record<string, string[]>`                | `{}`                | Named reusable middleware lists, referenced via `@name` inside rules.                                  |
| `debug`         | `boolean`                                 | `false`             | Log resolution + execution at runtime.                                                                 |
| `pageMetaField` | `string \| false`                         | `'middlewares'`     | Page-meta key used to append extra middlewares. Set to `false` to disable per-page overrides.          |

## Exported types

```ts
import type {
  AutoMiddlewareOptions,
  AutoMiddlewareRule,
} from '@alikhalilll/nuxt-auto-middleware/types';
```

## License

MIT
