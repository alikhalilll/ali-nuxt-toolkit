---
title: Introduction
description: Four focused packages for Nuxt 3 / 4 and Vue 3 — typed fetch, crypto, layout-based middleware, and a tree-shakable UI library.
order: 0
---

# ali-nuxt-toolkit

Four focused packages published under the `@alikhalilll` npm scope. The three Nuxt modules each ship as a module + a framework-agnostic core; the UI library is a multi-entry Vue 3 package whose components are importable individually via subpath imports.

## Packages

| Package                                                 | Type          | Summary                                                                                      |
| ------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| [`@alikhalilll/nuxt-api-provider`](/api-provider)       | Nuxt module   | Typed `fetch` client with interceptors, retry, upload/download progress.                     |
| [`@alikhalilll/nuxt-crypto`](/crypto)                   | Nuxt module   | AES-GCM + PBKDF2 encryption with key caching and pluggable algorithms.                       |
| [`@alikhalilll/nuxt-auto-middleware`](/auto-middleware) | Nuxt module   | Layout-based middleware with glob matching, groups, per-page overrides.                      |
| [`@alikhalilll/ui`](/ui)                                | Vue 3 library | Headless components — `ATellInput`, `APopover`, `ADrawer`, …. Per-component subpath imports. |

## Install

The Nuxt modules — install whichever you need and register them in `nuxt.config.ts`:

```bash
pnpm add @alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto @alikhalilll/nuxt-auto-middleware
```

```ts
export default defineNuxtConfig({
  modules: [
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/nuxt-auto-middleware',
  ],
});
```

The UI library — install once, import per component via the subpath for the smallest bundle:

```bash
pnpm add @alikhalilll/ui
```

```ts
import { ATellInput } from '@alikhalilll/ui/tell-input'; // tree-shaken subpath
import { APopover } from '@alikhalilll/ui/popover';
```

`@alikhalilll/ui` is **not** a Nuxt module — it's a Vue 3 component library that works in any Vue 3 app. See [its setup guide](/ui#setup) for the one-time CSS + Tailwind tokens wiring.

## Why this split

- **Zero overlap.** Each package does one thing. `api-provider` doesn't know about `crypto`, `crypto` doesn't know about `middleware`, the UI doesn't depend on any of the others.
- **Pick what you need.** Install one module, or all three, or just the UI lib. Inside `@alikhalilll/ui`, install once and import individual components — `dist/popover.mjs` etc. live behind their own subpaths so consumers only pay for what they touch.
- **Same ergonomics.** Strong TypeScript everywhere, identical registration pattern across the Nuxt modules, consistent naming (`$apiProvider`, `$crypto`), uniform `A`-prefixed components in the UI lib.

## Live demos

Every guide page below includes **live, working demos** that use the real published packages — not screenshots. Click around to try them.
