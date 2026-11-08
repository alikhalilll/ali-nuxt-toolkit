---
title: Introduction
description: Four focused packages for Nuxt 3 / 4 and Vue 3 — a typed fetch client, encryption, layout-based middleware, and two UI components.
order: 0
---

# ali-nuxt-toolkit

Four focused packages under the `@alikhalilll` scope — three Nuxt modules (each ships a framework-agnostic core alongside its module entry) and two Vue 3 UI components.

::alert{type="note" title="Each package is independent"}
There is no runtime dependency between them. Install one, three, or all five. The modules follow the same registration pattern and the components follow the same CSS-variable theming pattern, so moving between them doesn't cost you a new mental model.
::

## Packages

| Package                                                 | Type          | What it does                                                                                             |
| ------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| [`@alikhalilll/nuxt-api-provider`](/api-provider)       | Nuxt module   | Typed `fetch` client with TanStack-Query-style caching, interceptors, retry, upload/download progress.   |
| [`@alikhalilll/nuxt-crypto`](/crypto)                   | Nuxt module   | AES-GCM + PBKDF2 encryption with key caching, optional device-fingerprint binding, pluggable algorithms. |
| [`@alikhalilll/nuxt-auto-middleware`](/auto-middleware) | Nuxt module   | Layout-based middleware dispatch with glob matching, named groups, per-page overrides.                   |
| [`@alikhalilll/a-tel-input`](/ui/tel-input)             | Vue 3 library | International phone input — country picker, `libphonenumber-js` validation, VeeValidate + Zod wiring.    |
| [`@alikhalilll/a-smart-skeleton`](/ui/smart-skeleton)   | Vue 3 library | Measured skeleton loader — lays your real component out unseen, replays its geometry as a placeholder.   |

## Install

Nuxt modules — install whichever you need and register them in `nuxt.config.ts`:

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

UI components — install independently of the Nuxt modules:

::doc-install{pkgs="@alikhalilll/a-tel-input @alikhalilll/a-smart-skeleton"}
::

```ts
import { ATelInput } from '@alikhalilll/a-tel-input';
import { ASmartSkeleton } from '@alikhalilll/a-smart-skeleton';
```

::alert{type="info" title="UI components are Vue 3, not Nuxt modules"}
Both `ATelInput` and `ASmartSkeleton` work in any Vue 3 app. The Nuxt entry (`/nuxt`) adds auto-import and SSR wiring; without it, import the stylesheet once in your Vite entry — see each component's **Install** section for the full setup.
::

## What each one solves

- **`api-provider`** when you want one typed client across your app with sensible defaults (caching, retries, interceptors) and an escape hatch (`/core`) for Nitro routes and workers.
- **`crypto`** when you need symmetric encryption for session cookies, magic links, or short-lived tokens — with a single API surface across the Nuxt plugin and server-only routes.
- **`auto-middleware`** when your auth / tracking / role rules repeat across layouts and the per-page `middleware` array has started to drift.
- **`a-tel-input`** when you need a phone input that validates against `libphonenumber-js`, picks a country on first keystroke, and plugs into VeeValidate without a glue layer.
- **`a-smart-skeleton`** when the hand-authored `<ComponentSkeleton>` next to your real component keeps drifting from it and the loading state is visibly wrong.

## Live demos

Every guide page below runs the real published packages — not screenshots, not videos. Click around to see how each one behaves.
