/**
 * Catalog of install-and-use prompts, one per published package.
 *
 * The "Copy prompt" button in `DocInstall.vue` reads from this map and
 * writes a self-contained brief to the clipboard — docs URL, repo URL,
 * install command for the user's currently-selected package manager,
 * setup steps, rules, a minimal example, and the caveats that would
 * otherwise bite a first-time user. The prompt is written for any AI
 * coding assistant — no mention of a specific tool.
 *
 * The install section explicitly tells the assistant to use the shown
 * package manager (the one the user selected on the docs page), and to
 * stop and ask the user if this project uses a different manager — so
 * `pnpm add ...` never gets run inside an `npm`-managed repo.
 *
 * Why inline here rather than fetched from the published README:
 *  - The prompt is a *subset* of the README — the facts an AI needs,
 *    with the narrative trimmed. Keeping it alongside the component
 *    lets us tune it independently.
 *  - No runtime fetch, no CORS, no cache invalidation.
 *
 * To add a new package: add an entry below and the button appears
 * automatically on every `::doc-install{pkg="..."}` block that uses
 * the matching name.
 */

export const DOCS_BASE = 'https://alikhalilll.github.io/ali-nuxt-toolkit';
export const REPO_BASE = 'https://github.com/alikhalilll/ali-nuxt-toolkit';

export type Manager = 'pnpm' | 'npm' | 'yarn' | 'bun';

const MANAGER_CMD: Record<Manager, string> = {
  pnpm: 'pnpm add',
  npm: 'npm install',
  yarn: 'yarn add',
  bun: 'bun add',
};

interface PromptEntry {
  /** Docs page path, e.g. `/ui/ghost-skeleton` */
  docs: string;
  /** Repo path to the package source, relative to REPO_BASE/tree/master */
  repo: string;
  /** Repo path to the README, relative to REPO_BASE/blob/master */
  readme: string;
  /**
   * The body of the prompt. `{{INSTALL}}` is replaced with the install
   * command (e.g. `pnpm add @alikhalilll/a-ghost-skeleton`) at copy-time.
   * `{{DOCS}}`, `{{REPO}}`, `{{README}}` are also interpolated for brevity.
   */
  body: string;
}

const PACKAGE_PROMPTS: Record<string, PromptEntry> = {
  '@alikhalilll/a-ghost-skeleton': {
    docs: '/ui/ghost-skeleton',
    repo: 'packages/ui-components/AGhostSkeleton',
    readme: 'packages/ui-components/AGhostSkeleton/README.md',
    body: `Install and set up **@alikhalilll/a-ghost-skeleton** in this Vue 3 / Nuxt 3+ project.

What it is: a measured skeleton loader. It lays the real component out unseen, reads its DOM with \`getBoundingClientRect()\` and Canvas 2D font metrics, and replays it as a placeholder — one template, no second DOM tree to maintain. Zero layout shift. Chrome capture (backgrounds/borders/radii/shadows copied verbatim). Direction-aware (RTL supported natively).

Docs:    {{DOCS}}
README:  {{README}}
Source:  {{REPO}}

## Install

Run the install command below **using this project's package manager**. If this project doesn't use the manager shown, stop and ask the user which one to use before running anything.

\`\`\`sh
{{INSTALL}}
\`\`\`

## Setup (Nuxt 3 / 4)

Add the module to \`nuxt.config.ts\`:

\`\`\`ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-ghost-skeleton/nuxt'],
});
\`\`\`

The four components (\`AGhostSkeleton\`, \`AGhostSkeletonBox\`, \`AGhostSkeletonSuspense\`, \`AGhostSkeletonProvider\`) auto-import. Stylesheet injects itself. Pre-paint boot script is wired for you.

## Setup (Vue 3 + Vite)

Import the stylesheet in your entry:

\`\`\`ts
// main.ts
import '@alikhalilll/a-ghost-skeleton/styles.css';
\`\`\`

For \`unplugin-vue-components\`, use the shipped resolver:

\`\`\`ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import AGhostSkeletonResolver from '@alikhalilll/a-ghost-skeleton/resolver';

export default {
  plugins: [Components({ resolvers: [AGhostSkeletonResolver()] })],
};
\`\`\`

## Five rules (MUST follow)

1. **Always pass \`:sample\`** — its shape must mirror the real response (same text lines, same avatar size, same list length). Skip it and there's nothing to measure.
2. **Give the skeleton a stable \`:id\`** — shape memory is keyed by \`id\` across visits; returning users see last session's shape immediately.
3. **Destructure \`{ data }\` in \`#default\`** — the plugin invokes the slot with \`{ data: SAMPLE }\` during measurement. If the slot ignores the argument and reads an outer ref instead, that ref is still \`null\` during measurement, children receive empty data, and the cold-load skeleton is wrong (warm visits hide the bug because they hit cached shape).
4. **Give \`<img>\` explicit \`width\`/\`height\` or \`aspect-ratio\`** — an image without dimensions reports zero height until load, and the skeleton reserves no space for it.
5. **Theme via \`<AGhostSkeletonProvider>\`** — the raw fallback greys are translucent placeholders, not a production look. Wrap your app once to set \`base\`/\`highlight\` against your real surface; \`mode="system"\` tracks \`prefers-color-scheme\`.

## Minimal example

\`\`\`vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const user = ref<User | null>(null);
const SAMPLE_USER = {
  name: 'Sarah Connor',
  role: 'Chief Mitigation Officer',
  avatar: 'https://example.com/avatar.jpg',
};

onMounted(async () => {
  user.value = await $fetch('/api/me');
});
</script>

<template>
  <AGhostSkeletonProvider
    mode="system"
    :theme="{
      light: { base: '#d1d4dc', highlight: '#ffffff' },
      dark:  { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
      radius: '6px',
    }"
  >
    <AGhostSkeleton id="user-card" :data="user" :sample="SAMPLE_USER">
      <template #default="{ data }">
        <UserCard :user="data" />
      </template>
    </AGhostSkeleton>
  </AGhostSkeletonProvider>
</template>
\`\`\`

## Caveats

- **Teleported modals**: dialogs with \`<Teleport to="body">\` or \`<ClientOnly>\` render inline until hydration. Wrap them in \`v-if="open"\` so the walker doesn't emit ghost bones for the inline shell.
- **\`url(...)\` backgrounds are stripped** from chrome bones so hero bitmaps don't re-download. Gradient layers come through as normal.
- **\`prefers-reduced-motion: reduce\`** forces reveal to \`instant\` and freezes the shimmer, regardless of what you pass to \`reveal\`.
- **RTL**: set \`<html dir="rtl">\` or \`style="direction: rtl"\` on any ancestor; shimmer, sweep reveal, and \`byPosition\` sequence cascade flip automatically. No prop.`,
  },

  '@alikhalilll/a-tel-input': {
    docs: '/ui/tel-input',
    repo: 'packages/ui-components/ATelInput',
    readme: 'packages/ui-components/ATelInput/README.md',
    body: `Install and set up **@alikhalilll/a-tel-input** in this Vue 3 / Nuxt 3+ project.

What it is: an international telephone input built on \`libphonenumber-js\`. The field starts as a single clean input — no picker shoved in front of the user — and the country flag reveals the moment a dial code is recognised. Responsive picker (popover on desktop, bottom-sheet drawer on mobile). First-class VeeValidate + Zod integration with async server-side validation hooks.

Docs:    {{DOCS}}
README:  {{README}}
Source:  {{REPO}}

## Install

Run the install command below **using this project's package manager**. If this project doesn't use the manager shown, stop and ask the user which one to use before running anything.

\`\`\`sh
{{INSTALL}}
\`\`\`

## Setup (Nuxt 3 / 4)

\`\`\`ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/a-tel-input/nuxt'],
  css: ['@alikhalilll/a-tel-input/styles.css'],
});
\`\`\`

\`ATelInput\`, \`ACountrySelect\`, and \`ACountryFlag\` auto-import.

## Setup (Vue + Vite)

\`\`\`ts
// main.ts
import '@alikhalilll/a-tel-input/styles.css';
\`\`\`

Resolver for \`unplugin-vue-components\`:

\`\`\`ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import UiResolver from '@alikhalilll/a-tel-input/resolver';

export default { plugins: [Components({ resolvers: [UiResolver()] })] };
\`\`\`

## Minimal example (E.164 string via v-model)

\`\`\`vue
<script setup lang="ts">
import { ref } from 'vue';
const phone = ref(''); // E.164, e.g. "+201066105963"
</script>

<template>
  <ATelInput v-model="phone" default-country="EG" />
</template>
\`\`\`

## Split model (phone + country)

\`\`\`vue
<ATelInput v-model:phone="phone" v-model:country="country" />
\`\`\`

## Form integration (VeeValidate + Zod)

Use \`useTelField\` for VeeValidate integration — it exposes \`fieldProps\` that already include \`validateOn="blur"\`:

\`\`\`vue
<script setup lang="ts">
import { useTelField, zPhone } from '@alikhalilll/a-tel-input';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: zPhone() })),
});
const { fieldProps } = useTelField('phone');
</script>

<template>
  <ATelInput v-bind="fieldProps" />
</template>
\`\`\`

## Caveats

- **Zod country scoping**: \`zPhone({ country: 'EG' })\` expects **national** digits (\`'1066105963'\`). \`zPhone()\` with no country expects **E.164** form (\`'+201066105963'\`). Mismatch = silent validation failure.
- **Default country detection** uses \`ipapi.co\` free-tier (rate-limited). For production, pass \`ip-endpoint="/api/geo"\` returning \`{ country_code }\`, or \`detect-country="locale"\` to skip IP and fall through to \`navigator.language\`.
- **VeeValidate + \`useForm\` with a validation schema**: field-level \`rules\` are ignored; put phone rules in the schema itself (\`zPhone\`).
- **Sticky scroll-lock**: fixed in 1.1.3. If you see a vanishing sticky header when the picker opens, upgrade.
- **REST Countries v5 (optional)**: synchronous country list works out of the box. Pass \`restCountriesApiKey\` only if you want the v5 fetch (one request per browser, cached 30 days in \`localStorage\`).`,
  },

  '@alikhalilll/nuxt-crypto': {
    docs: '/crypto',
    repo: 'packages/crypto',
    readme: 'packages/crypto/README.md',
    body: `Install and set up **@alikhalilll/nuxt-crypto** in this Nuxt 3+ project.

What it is: an AES-GCM encryption plugin injected as \`$crypto\`. PBKDF2 key derivation from a passphrase, salted per-payload, with a bounded key cache for bulk work. Framework-agnostic core also exported for Nitro / API routes / scripts. Optional device-fingerprint binding for short-lived tokens.

Docs:    {{DOCS}}
README:  {{README}}
Source:  {{REPO}}

## Install

Run the install command below **using this project's package manager**. If this project doesn't use the manager shown, stop and ask the user which one to use before running anything.

\`\`\`sh
{{INSTALL}}
\`\`\`

## Setup

\`\`\`ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-crypto'],
  crypto: {
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
    provideName: '$crypto',
    iterations: 100_000,
    keyCacheSize: 64,
    serverOnly: false, // true removes $crypto from the client runtime
  },
});
\`\`\`

\`.env\` (never commit):

\`\`\`
NUXT_ENCRYPTION_PASSPHRASE=replace-me-with-a-long-random-secret
\`\`\`

## Basic round-trip

\`\`\`vue
<script setup lang="ts">
const { $crypto } = useNuxtApp();
const payload = await $crypto.encrypt('super-secret');
// payload: "v1.<saltB64>.<ivB64>.<cipherB64>"
const plain = await $crypto.decrypt(payload);
</script>
\`\`\`

## Rules / caveats

1. **Never commit the passphrase.** Set it via env var; rotating it invalidates every ciphertext that was encrypted with the previous value (see "Rotating the passphrase" in the docs for the re-encrypt procedure).
2. **Fingerprint-bound ciphertext is lossy by design.** Payloads bound to a device fingerprint become undecryptable if the device cookie is cleared or the session rotates — permanently. Use only for tokens the user can afford to lose (short sessions, magic links, one-shot nonces). **Never** for password resets, 2FA secrets, encrypted backups, or anything else a user would reasonably expect to survive clearing cookies.
3. **\`serverOnly: true\` is a hard switch, not a scope.** It removes \`$crypto\` from the client runtime entirely. Any component referencing \`useNuxtApp().$crypto\` on the client will throw at runtime, not at build.
4. **Prefer the framework-agnostic core** (\`createCryptoService\` from \`@alikhalilll/nuxt-crypto/core\`) in Nitro routes / API handlers / scripts so the service is explicit about its passphrase source.

## Bulk encrypt / decrypt (key-cache win)

\`\`\`ts
const results = await Promise.all(
  payloads.map((p) => $crypto.encrypt(p)),
);
\`\`\`

The key cache dedupes PBKDF2 across same-salt payloads. Size via \`keyCacheSize\` (default 64).`,
  },

  '@alikhalilll/nuxt-auto-middleware': {
    docs: '/auto-middleware',
    repo: 'packages/auto-middleware',
    readme: 'packages/auto-middleware/README.md',
    body: `Install and set up **@alikhalilll/nuxt-auto-middleware** in this Nuxt 3+ project.

What it is: layout-based middleware routing. Instead of tagging every page with \`middleware: [...]\`, declare a layout → middlewares map once in \`nuxt.config.ts\`. Supports named groups, glob patterns, RegExp, per-page extras, and a typed registry.

Docs:    {{DOCS}}
README:  {{README}}
Source:  {{REPO}}

## Install

Run the install command below **using this project's package manager**. If this project doesn't use the manager shown, stop and ask the user which one to use before running anything.

\`\`\`sh
{{INSTALL}}
\`\`\`

## Setup

\`\`\`ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-auto-middleware'],
  autoMiddleware: {
    groups: {
      auth:      ['auth', 'verify-role'],
      adminOnly: ['auth', 'verify-role', 'require-admin'],
    },
    rules: [
      { layouts: ['default'],                    middlewares: ['track-pageview'] },
      { layouts: ['dashboard', 'dashboard/*'],   middlewares: ['@auth'] },
      { layouts: ['admin', 'admin/*'],           middlewares: ['@adminOnly'] },
    ],
  },
});
\`\`\`

Middleware files live in the standard Nuxt location (\`~/middleware/auth.ts\`, etc.). Group names are referenced as \`@name\` inside \`middlewares\`.

## Per-page extras

\`\`\`vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middlewares: ['force-2fa'], // appended after the @auth group
});
</script>
\`\`\`

## Rules / caveats

1. **Anchored matches only.** \`layouts: ['dashboard']\` does **not** match \`dashboard/overview\`. Use \`['dashboard', 'dashboard/*']\` or \`['dashboard/**']\` for descendants.
2. **\`layout: false\` skips the module entirely** — even catch-all \`['**']\` rules won't run. Public landing pages with \`layout: false\` get no auto-middleware.
3. **\`skipAutoMiddleware: true\` opts out of everything, not per-middleware.** If you want to skip only one chain (e.g. skip \`@auth\` but keep \`track-pageview\`), rework the groups — there is no per-middleware opt-out.
4. **Dedup is first-wins.** If \`@auth\` includes \`verify-role\` and your per-page \`middlewares\` also lists \`verify-role\`, the page-level entry is **dropped**. Rely on groups as the single source of truth.
5. **Validated at \`nuxt prepare\`.** Reference a group that isn't declared and the build fails before you hit a navigation.

## Glob + RegExp

\`\`\`ts
rules: [
  { layouts: ['dashboard/*'],              middlewares: ['@auth'] },      // non-slash wildcard
  { layouts: ['admin/**'],                 middlewares: ['@adminOnly'] }, // any descendant
  { layouts: [/^(dashboard|portal)$/],     middlewares: ['@auth'] },      // regex
],
\`\`\`

## Catch-all

\`\`\`ts
rules: [
  { layouts: ['**'],                       middlewares: ['track-pageview'] },
  { layouts: ['dashboard', 'admin'],       middlewares: ['@auth'] },
],
\`\`\``,
  },

  '@alikhalilll/nuxt-api-provider': {
    docs: '/api-provider',
    repo: 'packages/api-provider',
    readme: 'packages/api-provider/README.md',
    body: `Install and set up **@alikhalilll/nuxt-api-provider** in this Nuxt 3+ project.

What it is: a typed HTTP client injected as \`$apiProvider\`. Built on native \`fetch\`, with interceptors, retry + backoff, timeouts, \`AbortSignal\`, upload/download progress (XHR fallback), a built-in cache with SSR hydration, and a structured \`ApiError\` type. Framework-agnostic core (\`createApiClient\`) also exported for Nitro / scripts.

Docs:    {{DOCS}}
README:  {{README}}
Source:  {{REPO}}

## Install

Run the install command below **using this project's package manager**. If this project doesn't use the manager shown, stop and ask the user which one to use before running anything.

\`\`\`sh
{{INSTALL}}
\`\`\`

## Setup

\`\`\`ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-api-provider'],
  apiProvider: {
    baseURL: 'https://api.example.com',
    provideName: '$apiProvider',
    defaultTimeoutMs: 20_000,
    server: true,
    retry: { attempts: 2, delayMs: 500, backoff: 2 },
    onRequestPath: '~/api/on-request',
    onSuccessPath: '~/api/on-success',
    onErrorPath: '~/api/on-error',
  },
});
\`\`\`

## Composable wrapper

\`\`\`ts
// composables/useApi.ts
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/types';
export const useApi = (): ApiProviderClient => useNuxtApp().$apiProvider;
\`\`\`

## Minimal example

\`\`\`vue
<script setup lang="ts">
interface Post { id: number; title: string; }
const post = await useApi()<Post>('/posts/1');
</script>
\`\`\`

## Error handling

\`\`\`ts
import { isApiError } from '@alikhalilll/nuxt-api-provider/types';

try {
  await useApi()('/posts/1');
} catch (err) {
  if (isApiError(err) && err.status === 404) { /* ... */ }
}
\`\`\`

## Rules / caveats

1. **Hydration serialises the cache into HTML.** Setting \`cache.hydrate: true\` adds the SSR cache to the Nuxt payload — large responses or user-specific data end up in every visitor's initial HTML, view-source visible and CDN-cacheable. Leave hydration off for anything PII-adjacent; let \`useAsyncData\` do per-key SSR hand-off instead.
2. **Progress callbacks switch transport to XHR.** Setting \`onRequestProgress\` on a call changes the transport from \`fetch\` to \`XMLHttpRequest\` (the only way to observe upload progress in a browser). Interceptors, retry, timeout, \`AbortSignal\`, and \`ApiError\` all still work.
3. **Interceptor modules run at build time.** \`onRequestPath\` / \`onSuccessPath\` / \`onErrorPath\` resolve a module at build and import its default export; keep the module pure (any per-request setup belongs inside the exported function).
4. **Retry policy is method-agnostic** by default — if you set \`retry\` globally, non-idempotent mutations (\`POST\`, \`PATCH\`) will replay on 5xx / network errors. Override per-call with \`retry: { attempts: 0 }\` for mutations, or send an idempotency-key header.`,
  },
};

/**
 * Builds the install command text for a package, for a given manager.
 */
export function installCommand(pkg: string, manager: Manager): string {
  return `${MANAGER_CMD[manager]} ${pkg}`;
}

/**
 * Looks up the prompt for `pkg` and interpolates the manager-specific install
 * command. Returns `null` when the package isn't in the catalog — callers
 * should hide the Copy-prompt button in that case.
 */
export function promptFor(pkg: string, manager: Manager): string | null {
  const entry = PACKAGE_PROMPTS[pkg];
  if (!entry) return null;
  const docs = `${DOCS_BASE}${entry.docs}`;
  const readme = `${REPO_BASE}/blob/master/${entry.readme}`;
  const repo = `${REPO_BASE}/tree/master/${entry.repo}`;
  return entry.body
    .replaceAll('{{INSTALL}}', installCommand(pkg, manager))
    .replaceAll('{{DOCS}}', docs)
    .replaceAll('{{README}}', readme)
    .replaceAll('{{REPO}}', repo);
}

/** Whether the catalog has an entry for a package. */
export function hasPrompt(pkg: string): boolean {
  return pkg in PACKAGE_PROMPTS;
}
