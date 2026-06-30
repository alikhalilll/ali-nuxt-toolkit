---
title: Introduction
description: Four focused packages for Nuxt 3 / 4 and Vue 3 — typed fetch, crypto, layout-based middleware, and a themable phone input.
order: 0
---

# ali-nuxt-toolkit

Four focused packages published under the `@alikhalilll` npm scope: three Nuxt modules (each ships as a module + a framework-agnostic core) and one Vue 3 component — `ATelInput`, a fully themable phone input with country picker.

## Packages

| Package                                                 | Type          | Summary                                                                                                  |
| ------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| [`@alikhalilll/nuxt-api-provider`](/api-provider)       | Nuxt module   | Typed `fetch` client with caching (TanStack-Query-style), interceptors, retry, upload/download progress. |
| [`@alikhalilll/nuxt-crypto`](/crypto)                   | Nuxt module   | AES-GCM + PBKDF2 encryption with key caching and pluggable algorithms.                                   |
| [`@alikhalilll/nuxt-auto-middleware`](/auto-middleware) | Nuxt module   | Layout-based middleware with glob matching, groups, per-page overrides.                                  |
| [`@alikhalilll/a-tel-input`](/ui)                       | Vue 3 library | Phone input with country picker, libphonenumber validation, popover/drawer picker.                       |

## Install

The Nuxt modules — install whichever you need and register them in `nuxt.config.ts`:

::doc-install{pkgs="@alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto @alikhalilll/nuxt-auto-middleware"}
::

```ts
export default defineNuxtConfig({
  modules: [
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/nuxt-auto-middleware',
  ],
});
```

The UI component — installed independently of the Nuxt modules:

::doc-install{pkg="@alikhalilll/a-tel-input"}
::

```ts
import { ATelInput, ACountrySelect } from '@alikhalilll/a-tel-input';
```

`ATelInput` is **not** a Nuxt module — it's a Vue 3 component that works in any Vue 3 app. See the [setup guide](/ui#setup) for the one-time CSS + Tailwind tokens wiring.

## Why this split

- **Zero overlap.** Each package does one thing. `api-provider` doesn't know about `crypto`, `crypto` doesn't know about `middleware`, and `a-tel-input` doesn't depend on any of the others.
- **Pick what you need.** Install one Nuxt module, all three, or just the phone input (`@alikhalilll/a-tel-input`).
- **Same ergonomics.** Strong TypeScript everywhere, identical registration pattern across the Nuxt modules, consistent naming (`$apiProvider`, `$crypto`).

## Live demos

Every guide page below includes **live, working demos** that use the real published packages — not screenshots. Click around to try them.
