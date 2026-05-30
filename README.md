# ali-nuxt-toolkit

[![CI](https://github.com/alikhalilll/ali-nuxt-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/alikhalilll/ali-nuxt-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-444.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-22c55e.svg)](./CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-444.svg)](https://www.conventionalcommits.org)

Three focused, strongly-typed Nuxt 3 / 4 modules — published under the [`@alikhalilll`](https://www.npmjs.com/~alikhalilll) npm scope. Each package is independently installable, ships a framework-agnostic core, and shares the same ergonomics.

**Docs site:** <https://alikhalilll.github.io/ali-nuxt-toolkit/>

## Quick start

Try it in the browser — fork a ready-made Stackblitz that wires all three modules into a fresh Nuxt app:

<https://stackblitz.com/github/alikhalilll/ali-nuxt-toolkit/tree/master/playgrounds/nuxt>

Or clone locally:

```bash
git clone https://github.com/alikhalilll/ali-nuxt-toolkit.git
cd ali-nuxt-toolkit
pnpm install && pnpm build && pnpm play
```

| Package                                                           | Version                                                                                                                                                 | Downloads                                                                                                                                                      | Size                                                                                                                                                                               | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@alikhalilll/nuxt-api-provider`](./packages/api-provider)       | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-api-provider.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider)       | [![downloads](https://img.shields.io/npm/dm/@alikhalilll/nuxt-api-provider.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider)       | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-api-provider?label=minzip&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-api-provider)       | Typed `fetch` client with interceptors, retry/backoff, timeouts, and a unified upload/download progress hook.                                                                                                                                                                                                                                                                                                                                    |
| [`@alikhalilll/nuxt-crypto`](./packages/crypto)                   | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-crypto.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-crypto)                   | [![downloads](https://img.shields.io/npm/dm/@alikhalilll/nuxt-crypto.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-crypto)                   | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-crypto?label=minzip&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-crypto)                   | AES-256-GCM + PBKDF2 via Web Crypto — key caching, pluggable algorithms, server-only mode, optional device-fingerprint binding.                                                                                                                                                                                                                                                                                                                  |
| [`@alikhalilll/nuxt-auto-middleware`](./packages/auto-middleware) | [![npm](https://img.shields.io/npm/v/@alikhalilll/nuxt-auto-middleware.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware) | [![downloads](https://img.shields.io/npm/dm/@alikhalilll/nuxt-auto-middleware.svg?color=444)](https://www.npmjs.com/package/@alikhalilll/nuxt-auto-middleware) | [![size](https://img.shields.io/bundlephobia/minzip/@alikhalilll/nuxt-auto-middleware?label=minzip&color=444)](https://bundlephobia.com/package/@alikhalilll/nuxt-auto-middleware) | Layout-based route middleware with glob patterns, named groups, and per-page overrides.                                                                                                                                                                                                                                                                                                                                                          |
| [`@alikhalilll/a-*` (UI components)](./packages/ui-components)    | —                                                                                                                                                       | —                                                                                                                                                              | —                                                                                                                                                                                  | Headless, shadcn-vue style Vue 3 components — **one package each**: `a-tel-input`, `a-input`, `a-popover`, `a-drawer`, `a-responsive-popover`. The internal `a-ui-base` (cn helper, size scale, design tokens) is bundled into every component's `dist/` — install only the component(s) you use. Flagship `ATelInput` — IP-detected country, libphonenumber-js validation, responsive popover/drawer picker, RTL + i18n + alternative numerals. |

Every Nuxt-module package (`api-provider`, `crypto`, `auto-middleware`) ships:

- A **Nuxt module** — default export from the package root.
- A **framework-agnostic core** (`./core` subpath) usable in Node, Bun, Deno, CLIs, tests.
- Full **type exports** (`./types` subpath).

The `@alikhalilll/a-*` UI packages are plain **Vue 3 components** — they work in any Vue app, not just Nuxt. Each component is its own package; an internal `a-ui-base` workspace (the `cn` helper, the size scale, the design tokens) is bundled into every component's published `dist/`, so consumers install only the component(s) they use. CSS variables are prefixed `--ak-ui-*` (defined in each component's `styles.css`) and theme is set by overriding them anywhere in the cascade.

---

## Install

Install the packages you need — they have no overlap:

```bash
pnpm add @alikhalilll/nuxt-api-provider
pnpm add @alikhalilll/nuxt-crypto
pnpm add @alikhalilll/nuxt-auto-middleware
# UI: add only the component packages you use (each pulls its own deps)
pnpm add @alikhalilll/a-tel-input   # or a-input / a-popover / a-drawer / a-responsive-popover
```

Register the Nuxt modules in `nuxt.config.ts`. Each UI component package ships its own Nuxt module (`@alikhalilll/a-<name>/nuxt`) that auto-imports its components; register the ones you use alongside the others, and import the shared tokens once plus each component's stylesheet:

```ts
export default defineNuxtConfig({
  modules: [
    '@alikhalilll/nuxt-api-provider',
    '@alikhalilll/nuxt-crypto',
    '@alikhalilll/nuxt-auto-middleware',
    '@alikhalilll/a-tel-input/nuxt', // <ATelInput> auto-imported (add other component modules as needed)
  ],
  css: [
    '@alikhalilll/a-tel-input/styles.css', // design tokens bundled in — just the component's CSS
  ],
});
```

The Nuxt modules read their config keys (`apiProvider`, `crypto`, `autoMiddleware`). For non-Nuxt Vue + Vite consumers, each component package also ships an [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components) resolver at `@alikhalilll/a-<name>/resolver` — same auto-import DX without Nuxt.

---

## `@alikhalilll/nuxt-api-provider`

A strongly-typed `fetch` client. Interceptor chain, retry+backoff, request timeouts, upload + download progress, and a structured `ApiError` with a cross-realm `isApiError()` guard.

### Configure

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-api-provider'],
  apiProvider: {
    baseURL: 'https://api.example.com',
    provideName: '$apiProvider',
    defaultTimeoutMs: 20_000,
    server: true, // set false to skip SSR (client-only)
    retry: { attempts: 2, delayMs: 500, backoff: 2 },
    onRequestPath: '~/api/on-request',
    onSuccessPath: '~/api/on-success',
    onErrorPath: '~/api/on-error',
  },
});
```

### Use

```ts
// composables/useApi.ts
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/types';
export const useApi = (): ApiProviderClient => useNuxtApp().$apiProvider;
```

```ts
interface Post {
  id: number;
  title: string;
}

// GET — third arg is the query object. null/undefined/'' are skipped; arrays repeat.
const posts = await useApi()<Post[]>('/posts', null, {
  userId: 1,
  tag: ['news', 'featured'],
});

// POST — plain objects are JSON-encoded automatically
await useApi()<Post>('/posts', {
  method: 'POST',
  body: { userId: 42, title: 'Hello', body: 'World' },
});

// FormData passes through (Content-Type is dropped so the browser sets the boundary)
await useApi()('/uploads', { method: 'POST', body: new FormData() });
```

### Retry, timeout, abort

```ts
await useApi()('/flaky', {
  timeoutMs: 3_000,
  retry: { attempts: 3, delayMs: 500, backoff: 2, statusCodes: [503] },
});

// External AbortSignal — combined with the internal timeout via AbortSignal.any.
const ctrl = new AbortController();
await useApi()('/stream', { signal: ctrl.signal });
```

### Upload / download progress

Pass `onRequestProgress` and the client transparently swaps to `XMLHttpRequest` (the only way to observe upload progress in a browser). Interceptors, retry, timeout, `AbortSignal`, and `ApiError` still work identically; the fast path stays on native `fetch`.

```ts
await useApi()('/uploads', {
  method: 'POST',
  body: form,
  onRequestProgress: ({ phase, loaded, ratio }) => {
    // phase: 'upload' | 'download'; ratio is null when length is unknown
  },
});
```

### Errors

Every failure throws `ApiError` (HTTP **and** network; `status === 0` means the request never got a response). Discriminate with `isApiError(e)` — it uses a `Symbol.for(...)` brand that survives bundle duplication, cross-realm boundaries, and downleveling (unlike `instanceof`).

```ts
import { isApiError } from '@alikhalilll/nuxt-api-provider/types';

try {
  await useApi()('/users', { method: 'POST', body: { email: 'bad' } });
} catch (e) {
  if (isApiError(e)) {
    console.log(e.status); // 422
    console.log(e.details.errors); // server-provided validation errors
    console.log(e.payload); // raw server payload
    console.log(e.response); // the Response object, if any
  }
}
```

### Interceptors

Three kinds: request, response, error. Registered via module options (file paths with a default export) or at runtime via `$apiProvider.useRequest(...)`, `useResponse(...)`, `useError(...)` — each returns an unregister function.

```ts
// ~/api/on-request.ts
import type { RequestInterceptor } from '@alikhalilll/nuxt-api-provider/types';

const onRequest: RequestInterceptor = (ctx) => {
  const token = useCookie('token').value;
  if (token) ctx.headers.Authorization = `Bearer ${token}`;
};
export default onRequest;
```

```ts
// ~/api/on-error.ts — redirect on 401
import type { ErrorInterceptor } from '@alikhalilll/nuxt-api-provider/types';

const onError: ErrorInterceptor = (err) => {
  if (err.status === 401) return navigateTo('/login');
};
export default onError;
```

### Module options

| Option             | Type                    | Default          | Purpose                                         |
| ------------------ | ----------------------- | ---------------- | ----------------------------------------------- |
| `baseURL`          | `string`                | `''`             | Prepended to every relative endpoint.           |
| `provideName`      | `string`                | `'$apiProvider'` | Injected under `$<name>`. Leading `$` stripped. |
| `defaultTimeoutMs` | `number`                | `20000`          | Client-wide request timeout.                    |
| `retry`            | `Partial<RetryOptions>` | `{}`             | Default retry policy, overridable per call.     |
| `onRequestPath`    | `string`                | —                | Default-exported `RequestInterceptor`.          |
| `onSuccessPath`    | `string`                | —                | Default-exported `ResponseInterceptor`.         |
| `onErrorPath`      | `string`                | —                | Default-exported `ErrorInterceptor`.            |

[Full guide →](https://alikhalilll.github.io/ali-nuxt-toolkit/api-provider)

---

## `@alikhalilll/nuxt-crypto`

Symmetric encryption on the native **Web Crypto API**. AES-256-GCM + PBKDF2-SHA256 by default, with derived-key caching, pluggable algorithms, and server-only mode.

### Configure

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-crypto'],
  crypto: {
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
    provideName: '$crypto',
    iterations: 100_000,
    keyCacheSize: 64,
    serverOnly: false, // true → skip client plugin; keep passphrase off the browser bundle
  },
});
```

`.env` (not committed):

```
NUXT_ENCRYPTION_PASSPHRASE=replace-me-with-a-long-random-secret
```

### Use

```ts
const { $crypto } = useNuxtApp();

const payload = await $crypto.encrypt('super-secret');
// → "v1.<saltB64>.<ivB64>.<cipherB64>"

const plain = await $crypto.decrypt(payload);
```

Structured data: stringify first.

```ts
const session = { userId: 42, roles: ['admin'] };
const token = await $crypto.encrypt(JSON.stringify(session));
const restored = JSON.parse(await $crypto.decrypt(token)) as typeof session;
```

### Key cache

PBKDF2 is deliberately slow. Derived keys are cached per salt (default size 64) — a second decrypt of any payload you've already touched is essentially free. `$crypto.clearKeyCache()` forces re-derivation.

### Server-only mode

`serverOnly: true` skips the client plugin so the passphrase never ships to the browser. `$crypto` becomes `undefined` on the client; use it in Nitro routes, server plugins, or `<script setup>` blocks guarded by `import.meta.server`.

### Device fingerprint

Bind a payload to the browser that created it — a copy of the token in another browser or on another device will refuse to decrypt. The fingerprint is built from an **HttpOnly device-ID cookie**, so it survives Wi-Fi ↔ 4G switches, cell-tower handoffs, VPN rotations, and residential IP rotation while still blocking copy-paste off-origin.

Inside Nitro event handlers, `useNuxtApp()` isn't available — construct the service from the framework-agnostic core instead (the package README shows a cached `useServerCrypto` helper for `server/utils/`).

```ts
// server/api/session.post.ts
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';
import { getClientFingerprint } from '@alikhalilll/nuxt-crypto/server';

export default defineEventHandler(async (event) => {
  const crypto = await createCryptoService({
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE!,
  });
  const fingerprint = await getClientFingerprint(event, {
    salt: useRuntimeConfig().cryptoFingerprintSalt, // server-side secret
  });
  const body = await readBody(event);
  return { token: await crypto.encrypt(JSON.stringify(body), { fingerprint }) };
});
```

Decrypt with the same `{ fingerprint }` on the server. Suitable for short-lived CSRF tokens, magic links, and anti-replay nonces — not long-lived data (clearing cookies makes payloads permanently undecryptable).

### Payload format

`v1.{saltB64}.{ivB64}.{cipherB64}` — four dot-separated segments, each standard base64. Salt 16 bytes, IV 12 bytes, ciphertext + 16-byte GCM auth tag.

### Custom algorithm

Replace AES-GCM with any cipher by implementing `CryptoAlgorithm`. The `version` tag routes decrypt to the right implementation, so payloads stay self-describing.

### Module options

| Option         | Type      | Default     | Purpose                                                    |
| -------------- | --------- | ----------- | ---------------------------------------------------------- |
| `passphrase`   | `string`  | `''`        | Passphrase for AES key derivation. Throws at use if empty. |
| `provideName`  | `string`  | `'$crypto'` | Injected under `$<name>`. Leading `$` stripped.            |
| `iterations`   | `number`  | `100_000`   | PBKDF2 iteration count.                                    |
| `keyCacheSize` | `number`  | `64`        | Max derived keys in memory. `0` disables caching.          |
| `serverOnly`   | `boolean` | `false`     | When true, plugin runs only on the server.                 |

[Full guide →](https://alikhalilll.github.io/ali-nuxt-toolkit/crypto)

---

## `@alikhalilll/nuxt-auto-middleware`

Declarative, layout-based route middleware. Map layouts → middlewares once in `nuxt.config.ts` and the module generates a single global route middleware that dispatches the right chain on each navigation.

### Configure

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
    pageMetaField: 'middlewares',
    debug: false,
  },
});
```

Middleware files stay in the standard Nuxt location (`~/middleware/auth.ts`, etc.).

### Layout patterns

Layouts support glob (`*`, `**`, `?`) **and** RegExp:

```ts
rules: [
  { layouts: ['dashboard/*'], middlewares: ['@auth'] },
  { layouts: ['admin/**'], middlewares: ['@adminOnly'] },
  { layouts: [/^(dashboard|portal)$/], middlewares: ['@auth'] },
  { layouts: ['**'], middlewares: ['track-pageview'] },        // catch-all
],
```

### Per-page overrides

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middlewares: ['force-2fa'], // appended AFTER @auth from the layout rule
});

// Or opt out entirely:
definePageMeta({ layout: 'dashboard', skipAutoMiddleware: true });
</script>
```

The field name (`middlewares`) is configurable via `pageMetaField`.

### Typed registry

The module emits `#build/auto-middleware/types.d.ts`:

```ts
export type AutoMiddlewareName = 'auth' | 'verify-role' | 'require-admin' | 'log-activity';
```

…plus an augmentation that adds `middlewares?: AutoMiddlewareName[]` and `skipAutoMiddleware?: boolean` to `PageMeta`. Typos are compile errors.

### Return values

Middleware receives `(to, from)` exactly like standard Nuxt route middlewares.

| Return          | Behaviour                                     |
| --------------- | --------------------------------------------- |
| `false`         | Stop the chain, allow navigation.             |
| `true` / `void` | Continue to the next middleware.              |
| anything else   | Treated as a navigation result — chain stops. |

Every middleware runs inside `callWithNuxt()`, so `useNuxtApp()` / composables work as usual.

### Module options

| Option          | Type                       | Default         | Purpose                                          |
| --------------- | -------------------------- | --------------- | ------------------------------------------------ |
| `rules`         | `AutoMiddlewareRule[]`     | `[]`            | Layout → middlewares mapping. Required.          |
| `groups`        | `Record<string, string[]>` | `{}`            | Named lists referenced via `@name` inside rules. |
| `pageMetaField` | `string \| false`          | `'middlewares'` | Page-meta key to append extra middlewares.       |
| `debug`         | `boolean`                  | `false`         | Log resolution + execution at runtime.           |

[Full guide →](https://alikhalilll.github.io/ali-nuxt-toolkit/auto-middleware)

---

## `@alikhalilll/a-*` — UI components

Headless, [shadcn-vue](https://www.shadcn-vue.com) style Vue 3 components built on [reka-ui](https://reka-ui.com) + [vaul-vue](https://github.com/unovue/vaul-vue), shipped as **one package per component** (`@alikhalilll/a-tel-input`, `@alikhalilll/a-input`, `@alikhalilll/a-popover`, `@alikhalilll/a-drawer`, `@alikhalilll/a-responsive-popover`). The shared foundation (`a-ui-base`) is an internal workspace bundled into every component's `dist/` — no separate install. Theme via prefixed CSS variables, size via a shared scale (xs/sm/md/lg/xl; md = 43 px), customize via deep slots + override props.

### First component — `ATelInput`

A composite phone-number input that:

- **Default shape**: plain tel input with the country picker hidden. Detection runs against what the user types or pastes (debounced, NANP-aware via libphonenumber-js); on first match a flag-only trigger reveals at the **end** of the field, the dial code shows as an inline prefix, and the dial code + national prefix get stripped from `phone`.
- Other shapes are variants — `default-country="…"`, `v-model:country`, or `:detect-from-input="false"` for the legacy always-visible picker.
- Silent IP → timezone → `navigator.language` lookup runs as a parsing hint so local formats (e.g. Egyptian `01066105963`) resolve even without a `+` prefix.
- Validates + formats numbers via `libphonenumber-js`, exposes a structured `PhoneValidationResult`.
- **International & accessible** — RTL inherits from the page, country names + numerals localise via `locale`, all UI strings localise via a `messages` bag, and digits typed in alternative numeral systems (Arabic-Indic, Persian, Devanagari, Bengali) are accepted and normalised to ASCII.
- Renders a **popover on desktop / vaul-vue drawer on mobile** country picker with a "Suggested" group (current + recents from localStorage) above the full list.
- Is **fully customizable** — every visual region is a slot, every data source is a prop, every region accepts its own class.

### Setup

Each component ships a **prebuilt stylesheet** — no Tailwind `@source`/`@theme` wiring in your app. Design tokens are bundled into every component's `styles.css`, so just import each package's CSS:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: [
    '@alikhalilll/a-popover/styles.css', // ATelInput's picker renders the popover…
    '@alikhalilll/a-drawer/styles.css', // …and drawer
    '@alikhalilll/a-responsive-popover/styles.css',
    '@alikhalilll/a-tel-input/styles.css',
  ],
  app: { head: { htmlAttrs: { class: 'dark' } } }, // or .light
});
```

Override any token (globally on `:root` or scoped to a wrapper) to theme — the component CSS resolves `var(--ak-ui-*)` at runtime, so flipping `.dark` just works.

### Use

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);
</script>

<template>
  <ATelInput v-model:phone="phone" v-model:country="country" default-country="SA" show-validation />
</template>
```

### Customize anything

| Vector            | What you can override                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Slots**         | `prefix`, `suffix`, `trigger`, `chevron`, `flag`, `search`, `loading`, `empty`, `group-header`, `item`, `item-check`, `valid-icon`, `error-icon`, `hint`, `error` |
| **Data props**    | `countries`, `flagUrl`, `searcher`, `detector`, `errorMessages`, `kbdOpen`, `kbdClose`                                                                            |
| **Class props**   | `class`, `fieldClass`, `inputClass`, `contentClass`, `popoverClass`, `drawerClass`, `hintClass`, `errorClass`                                                     |
| **CSS variables** | `--ak-ui-{background,foreground,popover,muted,accent,destructive,border,input,ring,radius,...}`                                                                   |

### Components exported

- **`ATelInput`** · `ACountrySelect` · `ACountryFlag`
- **`AInput`** — base text input with `prefix`/`suffix` slots
- **`APopover`** / `*Trigger` / `*Content` — reka-ui Popover (modal + optional overlay)
- **`ADrawer`** / `*Trigger` / `*Content` / `*Overlay` — vaul-vue Drawer
- **`AResponsivePopover`** — popover on desktop, drawer on mobile

### Composables + helpers

`usePhoneValidation`, `useCountryDetection`, `detectCountry`, `defaultFlagUrl`, `cn`, `SIZES`, `controlHeight`, `controlPaddingX`, `controlTextSize`, `controlHeightPx`.

[Full guide →](https://alikhalilll.github.io/ali-nuxt-toolkit/ui)

---

## Framework-agnostic cores

Every package exposes the same functionality without Nuxt, via the `./core` subpath — usable in Node, Bun, Deno, CLIs, or tests.

```ts
import { createApiClient } from '@alikhalilll/nuxt-api-provider/core';
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';
```

```ts
const api = createApiClient({
  baseURL: 'https://api.github.com',
  retry: { attempts: 2 },
});
api.useRequest((ctx) => {
  ctx.headers['User-Agent'] = 'my-cli/1.0';
});

const repo = await api<{ stargazers_count: number }>('/repos/nuxt/nuxt');
```

```ts
const crypto = await createCryptoService({
  passphrase: process.env.ENC_PASS!,
  iterations: 100_000,
});
const token = await crypto.encrypt('hi');
```

---

## Monorepo layout

```
packages/
  api-provider/       # @alikhalilll/nuxt-api-provider
  crypto/             # @alikhalilll/nuxt-crypto
  auto-middleware/    # @alikhalilll/nuxt-auto-middleware
apps/
  docs/               # Nuxt Content docs site (deployed to GitHub Pages)
playgrounds/
  nuxt/               # Integration playground
scripts/
  release/            # Interactive release tool
```

## Development

```bash
pnpm install
pnpm build          # Build all packages
pnpm typecheck      # Type-check all packages
pnpm play           # Run the Nuxt playground
pnpm -C apps/docs dev   # Run the docs site
```

Per-package: `pnpm -C packages/<name> build|typecheck`.

## Releasing

The release flow bumps the version, builds, publishes to npm, commits `chore(release): <pkg>@<version>`, tags, and pushes.

All release/pack flows go through the `tk` CLI:

```bash
pnpm tk release                # Interactive: pick packages, bump, dist-tag
pnpm tk release all            # Drive every publishable package
pnpm tk release api-provider   # Target one
pnpm tk release --dry-run      # Preview without writing anything

# Build tarballs without publishing:
pnpm tk pack all               # All publishable packages → ./artifacts/
pnpm tk pack a-tel-input       # One

# Fully non-interactive (skips tk's wrapper, calls the release script directly):
node scripts/release/index.ts --all --bump patch --tag latest
node scripts/release/index.ts --pkg api-provider,crypto --bump minor
```

Release-script flags: `--pkg <names>` (comma-separated), `--all`, `--bump <patch|minor|major|prerelease|none>`, `--tag <latest|next|beta|...>`, `--branch <name>`, `--interactive`, `--dry-run`, `--skip-git`, `--skip-publish`.

You'll need to be logged in (`npm login`) with publish rights to the `@alikhalilll` scope.

## Contributing

PRs welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, Conventional Commits, Changesets, the PR checklist, how to add a new public export.

- **Architecture overview:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — map of the monorepo, package anatomy, build and release flow.
- **Code of Conduct:** [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — Contributor Covenant v2.1.
- **Security:** [`SECURITY.md`](./SECURITY.md) — please use GitHub Security Advisories rather than a public issue.
- **Good first issues:** [label filter](https://github.com/alikhalilll/ali-nuxt-toolkit/labels/good%20first%20issue) — ramp-friendly tickets for first-time contributors.

## License

[MIT](./LICENSE) © Ali Khalil
