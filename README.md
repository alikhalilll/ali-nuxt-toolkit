<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./logo-dark.png">
    <img src="./logo-light.png" alt="ali-nuxt-toolkit" width="112" height="112">
  </picture>
</p>

<h1 align="center"><code>ali-nuxt-toolkit</code></h1>

<p align="center">
  Five sharp, type-driven packages for Vue 3 and Nuxt 3+ — a typed <code>fetch</code> client,
  Web-Crypto encryption, layout-based route middleware, a headless international tel input,
  and measured skeleton loaders. Independently installable. Framework-agnostic cores. Zero
  overlap.
</p>

<p align="center">
  <a href="https://github.com/alikhalilll/ali-nuxt-toolkit/actions/workflows/ci.yml"><img src="https://github.com/alikhalilll/ali-nuxt-toolkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-444.svg" alt="License: MIT"></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-22c55e.svg" alt="PRs Welcome"></a>
  <a href="https://www.conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-444.svg" alt="Conventional Commits"></a>
  <a href="https://api.securityscorecards.dev/projects/github.com/alikhalilll/ali-nuxt-toolkit"><img src="https://api.securityscorecards.dev/projects/github.com/alikhalilll/ali-nuxt-toolkit/badge" alt="OpenSSF Scorecard"></a>
</p>

<p align="center">
  <a href="https://alikhalilll.github.io/ali-nuxt-toolkit/"><strong>Documentation</strong></a>
  ·
  <a href="https://stackblitz.com/github/alikhalilll/ali-nuxt-toolkit/tree/master/playgrounds/nuxt"><strong>Playground</strong></a>
  ·
  <a href="./CONTRIBUTING.md"><strong>Contributing</strong></a>
</p>

---

## Packages

| Package                                                                    | Version                                                                                                                                                 | Downloads                                                                                                                                               | Min+gzip                                                                                                                                                                     | Purpose                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [`@alikhalilll/a-tel-input`](./packages/ui-components/ATelInput)           | [![npm](https://img.shields.io/npm/v/@alikhalilll/a-tel-input.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-tel-input)                   | [![dl](https://img.shields.io/npm/dm/@alikhalilll/a-tel-input.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-tel-input)                   | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/a-tel-input?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/a-tel-input)                   | International tel input — country auto-detect, libphonenumber-js validation, VeeValidate + Zod integration with async server checks. |
| [`@alikhalilll/a-smart-skeleton`](./packages/ui-components/ASmartSkeleton) | [![npm](https://img.shields.io/npm/v/@alikhalilll/a-smart-skeleton.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-smart-skeleton)         | [![dl](https://img.shields.io/npm/dm/@alikhalilll/a-smart-skeleton.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-smart-skeleton)         | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/a-smart-skeleton?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/a-smart-skeleton)         | Measured skeleton loaders — renders your real template invisibly, captures geometry, replays it as a pixel-faithful placeholder.     |
| [`@alikhalilll/nuxt-api-provider`](./packages/api-provider)                | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-api-provider.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider)       | [![dl](https://img.shields.io/npm/dm/@alikhalilll/nuxt-api-provider.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider)       | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-api-provider?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-api-provider)       | Typed `fetch` client — TanStack-Query-style caching, interceptors, retry + backoff, timeouts, progress, structured `ApiError`.       |
| [`@alikhalilll/nuxt-crypto`](./packages/crypto)                            | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-crypto.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-crypto)                   | [![dl](https://img.shields.io/npm/dm/@alikhalilll/nuxt-crypto.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-crypto)                   | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-crypto?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-crypto)                   | AES-256-GCM + PBKDF2 via Web Crypto — derived-key cache, pluggable algorithms, server-only mode, device-fingerprint binding.         |
| [`@alikhalilll/nuxt-auto-middleware`](./packages/auto-middleware)          | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-auto-middleware.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware) | [![dl](https://img.shields.io/npm/dm/@alikhalilll/nuxt-auto-middleware.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware) | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-auto-middleware?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-auto-middleware) | Layout-based route middleware — globs, named groups, per-page overrides, typed registry.                                             |

---

## Design principles

What every package in this repo buys you by default — not as marketing, as the contract.

- **Types are the contract.** Public API is defined by exported types first, implementations
  second. Discriminated unions over boolean flags. `satisfies` over bare type annotations.
- **Framework-agnostic cores.** Every Nuxt module exposes the same functionality on a
  `./core` subpath — usable in Node, Bun, Deno, CLIs, and tests. Nuxt is a thin wrapper.
- **SSR-safe.** No `window` / `document` access at module scope. Browser-only effects
  gated behind `onMounted`. Hydration-stable DOM output.
- **Tree-shakeable.** `sideEffects` honestly declared. Subpath exports (`/core`, `/types`,
  `/zod`, `/vee-validate`) so unused code doesn't ship.
- **Strategy-pattern dispatch.** Runtime variants (reveal modes, auth presets, cache
  strategies) are entries in a table, never long `if` chains.
- **Pure-function first.** Side effects confined to the smallest possible boundary. Walkers,
  transformers, formatters stay pure and testable.

Supported runtimes: **Node ≥ 20.19**, **Nuxt ≥ 3.12**, **Vue ≥ 3.4**. Node 22 is in CI.

---

## Quick start

```bash
# In your browser — the Nuxt playground
# https://stackblitz.com/github/alikhalilll/ali-nuxt-toolkit/tree/master/playgrounds/nuxt

# Locally
git clone https://github.com/alikhalilll/ali-nuxt-toolkit.git
cd ali-nuxt-toolkit
pnpm install && pnpm build && pnpm play
```

---

## Install

Pick only what you need; every manager is first-class.

```bash
# UI components (Vue 3 — work outside Nuxt too)
pnpm add @alikhalilll/a-tel-input @alikhalilll/a-smart-skeleton

# Nuxt modules
pnpm add @alikhalilll/nuxt-api-provider \
         @alikhalilll/nuxt-crypto \
         @alikhalilll/nuxt-auto-middleware
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@alikhalilll/a-tel-input/nuxt',
    '@alikhalilll/a-smart-skeleton/nuxt',
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/nuxt-auto-middleware',
  ],
  css: ['@alikhalilll/a-tel-input/styles.css'],
});
```

For non-Nuxt Vue + Vite consumers, each component package ships a resolver at
`@alikhalilll/a-<name>/resolver` for
[`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components).

---

## `@alikhalilll/a-tel-input`

Headless international telephone input. Starts as a single clean input — the country picker
stays hidden until a number is recognised. Numbers validate against `libphonenumber-js` in
real time; the picker is a popover on desktop and a bottom-sheet drawer on mobile, both with
a sticky-safe scroll lock. Plugs straight into **VeeValidate + Zod**, with first-class
support for **async server-side checks** (`zPhone().refine(async …)`); the in-field spinner
follows the schema's `meta.pending` and sets `aria-busy="true"` for assistive tech.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref(''); // → '+201066105963'
</script>

<template>
  <ATelInput v-model="phone" default-country="SA" show-validation />
</template>
```

[Guide →](./packages/ui-components/ATelInput/README.md) · [Docs →](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/tel-input)

---

## `@alikhalilll/a-smart-skeleton`

Hand-authored skeletons are the second template you have to maintain — padding drifts,
font sizes bump, images start loading later, and the reveal jumps. `ASmartSkeleton` lays
your **real** content out invisibly, measures the live geometry (background, border, radius,
box-shadow, text lines, media boxes), and reconstructs a pixel-faithful placeholder from
what it saw. One template — the real one — stays the source of truth. Zero cumulative
layout shift. Four reveal strategies (`smart`, `sequence`, `sweep`, `together`) and four
built-in states (`loading`, `content`, `empty`, `error`).

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
const user = ref<User | null>(null);
const SAMPLE = { name: 'Sarah Connor', role: 'Chief Mitigation Officer', avatar: '/sample.jpg' };
onMounted(async () => (user.value = await $fetch('/api/me')));
</script>

<template>
  <ASmartSkeleton :data="user" :sample="SAMPLE" id="user-card">
    <template #default="{ data }">
      <!-- your real template — this is also what the skeleton measures -->
    </template>
  </ASmartSkeleton>
</template>
```

[Guide →](./packages/ui-components/ASmartSkeleton/README.md) · [Docs →](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton)

---

## `@alikhalilll/nuxt-api-provider`

A strongly-typed `fetch` client. TanStack-Query-style caching enabled by default — stale
time, GC time, SWR, in-flight deduplication. Interceptor chain, retry with exponential
backoff, request timeouts, upload + download progress via a transparent
`XMLHttpRequest` fallback, and a structured `ApiError` with a cross-realm `isApiError()`
guard (uses `Symbol.for(...)` so bundle duplication doesn't break the check).

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-api-provider'],
  apiProvider: {
    baseURL: 'https://api.example.com',
    provideName: '$apiProvider',
    defaultTimeoutMs: 20_000,
    retry: { attempts: 2, delayMs: 500, backoff: 2 },
    cache: { staleTime: 60_000, hydrate: true },
    onRequestPath: '~/api/on-request',
    onErrorPath: '~/api/on-error',
  },
});
```

```ts
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/types';
export const useApi = (): ApiProviderClient => useNuxtApp().$apiProvider;

const posts = await useApi()<Post[]>('/posts', null, { userId: 1, tag: ['news', 'featured'] });
await useApi()<Post>('/posts', { method: 'POST', body: { userId: 42, title: 'Hello' } });

useApi().cache.invalidate((key) => key.includes('/posts')); // manual invalidate
```

Repeated GETs return cached data within `staleTime` without hitting the network; after that
they return cached data **and** refresh in the background. Concurrent identical calls share
one in-flight promise. Mutations are never cached.

[Docs →](https://alikhalilll.github.io/ali-nuxt-toolkit/api-provider)

---

## `@alikhalilll/nuxt-crypto`

Symmetric encryption on the native **Web Crypto API** — AES-256-GCM + PBKDF2-SHA256 by
default, with derived-key caching, pluggable algorithms, and a server-only mode that keeps
the passphrase off the browser bundle. PBKDF2 is deliberately slow; cached per-salt derived
keys make the second decrypt essentially free. **Device-fingerprint binding** can tie a
payload to the browser that created it — the token copied into another browser refuses to
decrypt, with the fingerprint built from an HttpOnly device-ID cookie so it survives
Wi-Fi ↔ 4G switches, VPN rotations, and IP changes.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-crypto'],
  crypto: {
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
    iterations: 100_000,
    keyCacheSize: 64,
    serverOnly: false,
  },
});
```

```ts
const { $crypto } = useNuxtApp();
const payload = await $crypto.encrypt('super-secret'); // "v1.<salt>.<iv>.<cipher>"
const plain = await $crypto.decrypt(payload);
```

[Docs →](https://alikhalilll.github.io/ali-nuxt-toolkit/crypto)

---

## `@alikhalilll/nuxt-auto-middleware`

Declarative, layout-based route middleware. Map layouts → middlewares once in
`nuxt.config.ts` and the module generates a single global route middleware that dispatches
the right chain on each navigation. Glob patterns (`*`, `**`, `?`) and `RegExp` are both
supported; per-page overrides live in `definePageMeta({ middlewares: [...] })`. The module
emits a **typed registry** so typos are compile errors, not silent routing bugs.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-auto-middleware'],
  autoMiddleware: {
    groups: {
      auth: ['auth', 'verify-role'],
      adminOnly: ['auth', 'verify-role', 'require-admin'],
    },
    rules: [
      { layouts: ['default'], middlewares: ['log-activity'] },
      { layouts: ['dashboard', 'dashboard/*'], middlewares: ['@auth'] },
      { layouts: ['admin', 'admin/**'], middlewares: ['@adminOnly'] },
    ],
  },
});
```

[Docs →](https://alikhalilll.github.io/ali-nuxt-toolkit/auto-middleware)

---

## Framework-agnostic cores

Every Nuxt-module package exposes the same functionality without Nuxt, via `./core` — usable
in Node, Bun, Deno, CLIs, and tests.

```ts
import { createApiClient } from '@alikhalilll/nuxt-api-provider/core';
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';

const api = createApiClient({ baseURL: 'https://api.github.com', retry: { attempts: 2 } });
const repo = await api<{ stargazers_count: number }>('/repos/nuxt/nuxt');

const crypto = await createCryptoService({ passphrase: process.env.ENC_PASS! });
const token = await crypto.encrypt('hi');
```

---

## Monorepo layout

```
packages/
  api-provider/                     # @alikhalilll/nuxt-api-provider
  crypto/                           # @alikhalilll/nuxt-crypto
  auto-middleware/                  # @alikhalilll/nuxt-auto-middleware
  ui-components/
    ATelInput/                      # @alikhalilll/a-tel-input
    ASmartSkeleton/                 # @alikhalilll/a-smart-skeleton
    AInput/ APopover/ ADrawer/      # internal — bundled into the UI packages' dist
    AResponsivePopover/ AUiBase/
apps/
  docs/                             # Nuxt Content docs site (deployed to GitHub Pages)
playgrounds/
  nuxt/                             # Integration playground
scripts/
  release/ build/ validate/ lib/    # tk CLI — release, build, validate, helpers
```

---

## Development

```bash
pnpm install
pnpm build                      # Build all packages
pnpm typecheck                  # Type-check all packages
pnpm -r --if-present test       # Run package test suites
pnpm play                       # Run the Nuxt playground
pnpm -C apps/docs dev           # Run the docs site
```

Per-package: `pnpm -C packages/<name> build|typecheck`.

---

## Releasing

Every publish flow goes through the `tk` CLI:

```bash
pnpm tk release                 # Interactive: pick packages, bump, dist-tag
pnpm tk release all             # Drive every publishable package
pnpm tk release a-tel-input     # Target one

pnpm tk pack all                # Build tarballs → ./artifacts/ (no publish)
pnpm tk pack a-tel-input

# Fully non-interactive:
node scripts/release/index.ts --all --bump patch --tag latest
```

Requires `npm login` with publish rights to the `@alikhalilll` scope.

---

## Contributing

PRs welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, Conventional Commits,
Changesets, the PR checklist, how to add a new public export.

- **Code of Conduct:** [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — Contributor Covenant v2.1.
- **Security:** [`SECURITY.md`](./SECURITY.md) — please use GitHub Security Advisories rather than a public issue.
- **Good first issues:** [label filter](https://github.com/alikhalilll/ali-nuxt-toolkit/labels/good%20first%20issue)

---

## License

[MIT](./LICENSE) © Ali Khalil
