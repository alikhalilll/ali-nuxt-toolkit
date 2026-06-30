# `ali-nuxt-toolkit`

> A focused, strongly-typed toolkit for Nuxt 3 / 4 — a typed `fetch` client, Web-Crypto encryption, layout-based middleware, and a flagship headless **international tel input**. Each package is independently installable, ships a framework-agnostic core, and has zero overlap.

[![CI](https://github.com/alikhalilll/ali-nuxt-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/alikhalilll/ali-nuxt-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-444.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-22c55e.svg)](./CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-444.svg)](https://www.conventionalcommits.org)

📘 **Docs site →** <https://alikhalilll.github.io/ali-nuxt-toolkit/>

---

## What's inside

| Package                                                           | Version                                                                                                                                                 | Downloads                                                                                                                                               | Min+gzip                                                                                                                                                                     | One-liner                                                                                                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@alikhalilll/a-tel-input`](./packages/ui-components/ATelInput)  | [![npm](https://img.shields.io/npm/v/@alikhalilll/a-tel-input.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-tel-input)                   | [![dl](https://img.shields.io/npm/dm/@alikhalilll/a-tel-input.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/a-tel-input)                   | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/a-tel-input?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/a-tel-input)                   | International tel input — country auto-detect, libphonenumber-js validation, responsive popover/drawer picker, **first-class VeeValidate + Zod integration** with async server-side validation hooks. |
| [`@alikhalilll/nuxt-api-provider`](./packages/api-provider)       | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-api-provider.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider)       | [![dl](https://img.shields.io/npm/dm/@alikhalilll/nuxt-api-provider.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider)       | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-api-provider?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-api-provider)       | Typed `fetch` client — caching (TanStack-Query-style: SWR, dedupe, GC), interceptors, retry/backoff, timeouts, upload/download progress, structured `ApiError`.                                       |
| [`@alikhalilll/nuxt-crypto`](./packages/crypto)                   | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-crypto.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-crypto)                   | [![dl](https://img.shields.io/npm/dm/@alikhalilll/nuxt-crypto.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-crypto)                   | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-crypto?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-crypto)                   | AES-256-GCM + PBKDF2 via Web Crypto — key cache, pluggable algorithms, server-only mode, device-fingerprint binding.                                                                                  |
| [`@alikhalilll/nuxt-auto-middleware`](./packages/auto-middleware) | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-auto-middleware.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware) | [![dl](https://img.shields.io/npm/dm/@alikhalilll/nuxt-auto-middleware.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware) | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-auto-middleware?label=&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-auto-middleware) | Layout-based route middleware — globs, named groups, per-page overrides, typed registry.                                                                                                              |

Every Nuxt-module package ships:

- A **Nuxt module** — default export from the package root.
- A **framework-agnostic core** (`./core` subpath) usable in Node, Bun, Deno, CLIs, tests.
- Full **type exports** (`./types` subpath).

The `@alikhalilll/a-*` UI packages are plain **Vue 3 components** — they work in any Vue app, not just Nuxt.

---

## Quick start

Open the playground straight in your browser:

> <https://stackblitz.com/github/alikhalilll/ali-nuxt-toolkit/tree/master/playgrounds/nuxt>

Or clone locally:

```bash
git clone https://github.com/alikhalilll/ali-nuxt-toolkit.git
cd ali-nuxt-toolkit
pnpm install && pnpm build && pnpm play
```

---

## Install

Pick your package manager — all four are first-class.

### `@alikhalilll/a-tel-input`

```bash
# pnpm
pnpm add @alikhalilll/a-tel-input

# npm
npm install @alikhalilll/a-tel-input

# yarn
yarn add @alikhalilll/a-tel-input

# bun
bun add @alikhalilll/a-tel-input
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-tel-input/nuxt'],
  // One stylesheet — popover, drawer, and design tokens are all bundled in.
  css: ['@alikhalilll/a-tel-input/styles.css'],
});
```

### Nuxt modules (api-provider · crypto · auto-middleware)

```bash
# pnpm
pnpm add @alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto @alikhalilll/nuxt-auto-middleware

# npm
npm install @alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto @alikhalilll/nuxt-auto-middleware

# yarn
yarn add @alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto @alikhalilll/nuxt-auto-middleware

# bun
bun add @alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto @alikhalilll/nuxt-auto-middleware
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

For non-Nuxt Vue + Vite consumers, each component package also ships a resolver at
`@alikhalilll/a-<name>/resolver` for [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components).

---

## `@alikhalilll/a-tel-input` — flagship

A **headless international telephone input** for Vue 3 / Nuxt 3+. The field starts as a single
clean input — the country picker stays hidden until the user's number is recognised. Numbers
validate against `libphonenumber-js` in real time, the picker is a popover on desktop and a
bottom-sheet on mobile (with a sticky-safe scroll lock on both), and the component plugs
straight into **VeeValidate + Zod** with built-in support for **async server-side checks**.

### What's in the box

- Smart country detection (debounced typing + IP / timezone / locale chain on mount).
- libphonenumber-js validation with seven failure reasons and a per-country format hint.
- Responsive picker — popover on desktop, vaul-vue drawer on mobile, page-scroll locked.
- Headless slots for every visual region (trigger, chevron, flag, item, search, hint, error, …).
- **VeeValidate + Zod + async server validation** via `@alikhalilll/a-tel-input/vee-validate`
  - `@alikhalilll/a-tel-input/zod`. Drops into VeeValidate's `<Field v-slot="{ field }">`
    pattern with a single `v-bind="field"`.
- i18n + RTL out of the box — alternative numerals (Arabic-Indic, Persian, Devanagari, Bengali)
  folded to ASCII on input; country names + numerals localised via `Intl.DisplayNames`.
- SSR-safe, TypeScript-first, web-types for JetBrains IDEs.

### Use

Pick one of two binding contracts — they stay in sync.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref(''); // → '+201066105963'
</script>

<template>
  <!-- Single E.164 string — works with VeeValidate's <Field v-slot="{ field }"> + native forms -->
  <ATelInput v-model="phone" default-country="SA" show-validation />
</template>
```

```vue
<!-- Or split into two v-models for the digits-only national + the dial code -->
<ATelInput v-model:phone="phone" v-model:country="country" default-country="SA" show-validation />
```

### VeeValidate's `<Field v-slot="{ field, errors }">` — `v-bind="field"` just works

```vue
<script setup lang="ts">
import { useForm, Field as VeeField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { ATelInput } from '@alikhalilll/a-tel-input';
import { zPhone } from '@alikhalilll/a-tel-input/zod';

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: zPhone() })),
});
</script>

<template>
  <form @submit="handleSubmit(onSubmit)">
    <VeeField v-slot="{ field, errors }" name="phone">
      <ATelInput
        v-bind="field"
        :error="errors[0]"
        :aria-invalid="!!errors.length"
        default-country="SA"
        show-validation
      />
    </VeeField>
  </form>
</template>
```

### Server-side validation (e.g. "is this phone already registered?")

Chain the async check onto the form schema via `z.refine(async)` — `handleSubmit` awaits it before invoking your callback, and the in-field spinner (`useTelField`'s `validating`) follows the schema's async work via `meta.pending`.

```ts
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useTelField } from '@alikhalilll/a-tel-input/vee-validate';
import { zPhone } from '@alikhalilll/a-tel-input/zod';

const phoneSchema = zPhone().refine(
  async (value) => {
    if (!value) return true;
    const { exists } = await $fetch('/api/phone/exists', { query: { phone: value } });
    return !exists;
  },
  { message: 'This phone number is already registered.' }
);

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: phoneSchema })),
});

const { phone, country, error, handleBlur, fieldProps, validating } = useTelField('phone', {
  validateOn: 'blur',
});
```

```vue
<ATelInput
  v-model:phone="phone"
  v-model:country="country"
  v-bind="fieldProps"
  :error="error"
  :validating="validating"
  show-validation
  @blur="handleBlur"
/>
```

`:validating` shows a spinner inside the field while the server check is in flight; the
inner input stays focusable and `aria-busy="true"` is set for assistive tech.

[Full tel-input guide →](./packages/ui-components/ATelInput/README.md) · [Docs site →](https://alikhalilll.github.io/ali-nuxt-toolkit/ui/tel-input)

---

## `@alikhalilll/nuxt-api-provider`

A strongly-typed `fetch` client. TanStack-Query-style caching enabled by default, interceptor chain,
retry+backoff, request timeouts, upload + download progress, and a structured `ApiError` with a
cross-realm `isApiError()` guard.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-api-provider'],
  apiProvider: {
    baseURL: 'https://api.example.com',
    provideName: '$apiProvider',
    defaultTimeoutMs: 20_000,
    retry: { attempts: 2, delayMs: 500, backoff: 2 },
    // Caching defaults: staleTime 30s, gcTime 5min, SWR, GET/HEAD only.
    // Override or set `hydrate: true` to forward the SSR cache to the client.
    cache: { staleTime: 60_000, hydrate: true },
    onRequestPath: '~/api/on-request',
    onErrorPath: '~/api/on-error',
  },
});
```

```ts
// composables/useApi.ts
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/types';
export const useApi = (): ApiProviderClient => useNuxtApp().$apiProvider;

// usage — the 3rd arg is the query object (null/undefined/'' skipped, arrays repeat)
const posts = await useApi()<Post[]>('/posts', null, { userId: 1, tag: ['news', 'featured'] });
await useApi()<Post>('/posts', { method: 'POST', body: { userId: 42, title: 'Hello' } });

// per-call cache control
await useApi()<Stock>('/stocks/AAPL', { cache: false }); // bypass
await useApi()<User>('/me', { cache: { refetch: true } }); // force refetch
useApi().cache.invalidate((key) => key.includes('/posts')); // manual invalidate
```

Repeated GETs return cached data within `staleTime` (30s default) without hitting the network.
After that they return cached data _and_ refresh in the background (stale-while-revalidate).
Concurrent identical calls share one in-flight promise (deduplication). Mutations are never cached.

Pass `onRequestProgress` and the client transparently swaps to `XMLHttpRequest` for upload progress
— retry, timeout, `AbortSignal`, `ApiError`, and caching still work identically; the fast path stays
on native `fetch`.

Errors are `ApiError` (HTTP **and** network; `status === 0` means no response). Discriminate with
`isApiError(e)` — uses a `Symbol.for(...)` brand that survives bundle duplication and
cross-realm boundaries.

[Full guide →](https://alikhalilll.github.io/ali-nuxt-toolkit/api-provider)

---

## `@alikhalilll/nuxt-crypto`

Symmetric encryption on the native **Web Crypto API**. AES-256-GCM + PBKDF2-SHA256 by default,
with derived-key caching, pluggable algorithms, and server-only mode.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-crypto'],
  crypto: {
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
    iterations: 100_000,
    keyCacheSize: 64,
    serverOnly: false, // true → skip client plugin; keep passphrase off the browser bundle
  },
});
```

```ts
const { $crypto } = useNuxtApp();

const payload = await $crypto.encrypt('super-secret');
// → "v1.<saltB64>.<ivB64>.<cipherB64>"

const plain = await $crypto.decrypt(payload);
```

PBKDF2 is deliberately slow; derived keys are cached per salt so a second decrypt is essentially
free. `serverOnly: true` skips the client plugin so the passphrase never ships to the browser.

**Device-fingerprint binding** lets you bind a payload to the browser that created it — a copy of
the token in another browser refuses to decrypt. The fingerprint is built from an HttpOnly
device-ID cookie, so it survives Wi-Fi ↔ 4G switches, VPN rotations, and IP changes.

[Full guide →](https://alikhalilll.github.io/ali-nuxt-toolkit/crypto)

---

## `@alikhalilll/nuxt-auto-middleware`

Declarative, layout-based route middleware. Map layouts → middlewares once in `nuxt.config.ts`
and the module generates a single global route middleware that dispatches the right chain on
each navigation.

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

Glob patterns (`*`, `**`, `?`) and RegExp are both supported. Per-page overrides via
`definePageMeta({ middlewares: [...] })`. The module emits a **typed registry** so typos are
compile errors.

[Full guide →](https://alikhalilll.github.io/ali-nuxt-toolkit/auto-middleware)

---

## Framework-agnostic cores

Every Nuxt-module package exposes the same functionality without Nuxt, via the `./core` subpath
— usable in Node, Bun, Deno, CLIs, tests.

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
  api-provider/                          # @alikhalilll/nuxt-api-provider
  crypto/                                # @alikhalilll/nuxt-crypto
  auto-middleware/                       # @alikhalilll/nuxt-auto-middleware
  ui-components/
    ATelInput/                           # @alikhalilll/a-tel-input  (the only publishable UI pkg)
    AInput/  APopover/  ADrawer/         # internal — bundled into ATelInput's dist
    AResponsivePopover/  AUiBase/
apps/
  docs/                                  # Nuxt Content docs site (deployed to GitHub Pages)
playgrounds/
  nuxt/                                  # Integration playground
scripts/
  release/  build/  validate/  lib/      # Release tool, build helpers, validators
```

## Development

```bash
pnpm install
pnpm build           # Build all packages
pnpm typecheck       # Type-check all packages
pnpm play            # Run the Nuxt playground
pnpm -C apps/docs dev    # Run the docs site
```

Per-package: `pnpm -C packages/<name> build|typecheck`.

## Releasing

All release / pack flows go through the `tk` CLI:

```bash
pnpm tk release                # Interactive: pick packages, bump, dist-tag
pnpm tk release all            # Drive every publishable package
pnpm tk release a-tel-input    # Target one
pnpm tk release --dry-run      # Preview without writing anything

# Build tarballs without publishing:
pnpm tk pack all               # All publishable packages → ./artifacts/
pnpm tk pack a-tel-input       # One

# Fully non-interactive:
node scripts/release/index.ts --all --bump patch --tag latest
```

You'll need to be logged in (`npm login`) with publish rights to the `@alikhalilll` scope.

## Contributing

PRs welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, Conventional Commits,
Changesets, the PR checklist, how to add a new public export.

- **Architecture overview:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **Code of Conduct:** [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — Contributor Covenant v2.1.
- **Security:** [`SECURITY.md`](./SECURITY.md) — please use GitHub Security Advisories rather than a public issue.
- **Good first issues:** [label filter](https://github.com/alikhalilll/ali-nuxt-toolkit/labels/good%20first%20issue)

## License

[MIT](./LICENSE) © Ali Khalil
