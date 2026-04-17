---
title: Introduction
description: Three strongly-typed Nuxt modules — api, crypto, layout-based middleware.
order: 0
---

# ali-nuxt-toolkit

Three focused Nuxt 3 / 4 modules published under the `@alikhalilll` npm scope. Each package is independently usable and ships with:

- A **Nuxt module** (default export from `.`)
- A **framework-agnostic core** (`./core`) for non-Nuxt consumers
- Full **type exports** (`./types`)

## Packages

| Package | Purpose |
| --- | --- |
| [`@alikhalilll/nuxt-api-provider`](/api-provider) | Typed `fetch` client with interceptors, retry, upload/download progress. |
| [`@alikhalilll/nuxt-crypto`](/crypto) | AES-GCM + PBKDF2 encryption with key caching and pluggable algorithms. |
| [`@alikhalilll/nuxt-auto-middleware`](/auto-middleware) | Layout-based middleware with glob matching, groups, per-page overrides. |

## Install

```bash
pnpm add @alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto @alikhalilll/nuxt-auto-middleware
```

Then register the modules you want in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/nuxt-auto-middleware',
  ],
});
```

## Why separate packages

- **Zero overlap.** api-provider doesn't know about crypto, crypto doesn't know about middleware, middleware doesn't know about either.
- **Pick what you need.** Every package can be installed on its own.
- **Same ergonomics.** Strong TypeScript throughout, identical registration pattern, consistent naming (`$apiProvider`, `$crypto`).

## Live demos

Every guide page below includes **live, working demos** that use the real published modules — not screenshots. Click around to try them.
