---
title: crypto
description: AES-256-GCM + PBKDF2 encryption for Nuxt 3/4 using the Web Crypto API, with key caching and pluggable algorithms.
package: '@alikhalilll/nuxt-crypto'
order: 2
---

# @alikhalilll/nuxt-crypto

Symmetric encryption for Nuxt 3 / 4 built on the native **Web Crypto API**. Defaults to **AES-256-GCM** with **PBKDF2-SHA256** key derivation.

- **Framework-agnostic core** — `createCryptoService()` works anywhere `SubtleCrypto` exists (browser, Deno, Bun, Node 20+).
- **Key caching** — derived keys are cached per salt, so bulk decrypt stays fast even at 100k+ PBKDF2 iterations.
- **Pluggable algorithms** — swap the default AES-GCM implementation for your own `CryptoAlgorithm` without touching the payload envelope.
- **Versioned payload format** — `v1.{salt}.{iv}.{cipher}` with clean forward compatibility.
- **Server-only mode** — opt into registering the plugin only on the server so the passphrase never ships to the browser bundle.

## Install

```bash
pnpm add @alikhalilll/nuxt-crypto
```

## Register the module

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/nuxt-crypto'],
  crypto: {
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
    provideName: '$crypto',
    iterations: 100_000,
    keyCacheSize: 64,
    serverOnly: false,
  },
});
```

`.env` (not committed):

```
NUXT_ENCRYPTION_PASSPHRASE=replace-me-with-a-long-random-secret
```

## Basic round-trip

```vue
<script setup lang="ts">
const { $crypto } = useNuxtApp();

const payload = await $crypto.encrypt('super-secret');
// payload: "v1.<saltB64>.<ivB64>.<cipherB64>"

const plain = await $crypto.decrypt(payload);
</script>
```

`$crypto` is typed as `CryptoService` via auto-generated module augmentation.

::DemoCrypto
::

## Encrypt a JSON object

`encrypt` takes a string — stringify structured data first.

```ts
const session = { userId: 42, roles: ['admin'], issuedAt: Date.now() };
const payload = await $crypto.encrypt(JSON.stringify(session));
const restored = JSON.parse(await $crypto.decrypt(payload)) as typeof session;
```

A tiny composable keeps this ergonomic:

```ts
// composables/useEncrypted.ts
export function useEncrypted() {
  const { $crypto } = useNuxtApp();
  return {
    encode: async <T>(value: T) => $crypto.encrypt(JSON.stringify(value)),
    decode: async <T>(payload: string) => JSON.parse(await $crypto.decrypt(payload)) as T,
  };
}
```

## Persist to a cookie

```ts
const cookie = useCookie<string | null>('session');

// Write
cookie.value = await $crypto.encrypt(JSON.stringify({ userId: 42 }));

// Read
if (cookie.value) {
  const { userId } = JSON.parse(await $crypto.decrypt(cookie.value));
}
```

## Key cache

PBKDF2 is deliberately slow. The built-in cache (default size 64) keys derived material by salt, so a second decrypt of any payload you've already touched is essentially free.

```ts
const payloads = await Promise.all(items.map((i) => $crypto.encrypt(i)));
// Fast — each salt was just derived during encrypt.
const plain = await Promise.all(payloads.map((p) => $crypto.decrypt(p)));

// Force re-derivation (e.g. during a passphrase rotation audit):
$crypto.clearKeyCache();
```

## Error handling

| Scenario                               | Message                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| Payload isn't `a.b.c.d`                | `Invalid payload format — expected 4 dot-separated segments.` |
| A segment is empty                     | `Invalid payload format — one or more segments were empty.`   |
| Algorithm version mismatch             | `Unsupported payload version: v2 (algorithm expects v1).`     |
| Wrong passphrase / tampered ciphertext | Native `OperationError` from Web Crypto.                      |
| Passphrase not set in module config    | `[nuxt-crypto] passphrase is required.`                       |

## Server-only mode

Set `serverOnly: true` to skip the client plugin and keep the passphrase out of the browser bundle.

```ts
crypto: {
  passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
  serverOnly: true,
}
```

With this enabled, `$crypto` is `undefined` on the client. Use it in Nitro routes, server-only plugins, or `<script setup>` blocks guarded by `import.meta.server`.

## Nitro routes

```ts
// server/api/session/encode.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { $crypto } = useNuxtApp();
  return { token: await $crypto.encrypt(JSON.stringify(body)) };
});
```

## Framework-agnostic core

```ts
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';

const service = await createCryptoService({
  passphrase: process.env.ENC_PASS!,
  iterations: 100_000,
  keyCacheSize: 64,
});

const payload = await service.encrypt('hi');
const clear = await service.decrypt(payload);
```

## Custom algorithm

Replace AES-GCM with any cipher by implementing `CryptoAlgorithm`. The payload envelope is preserved; the `version` tag routes decrypt to the right implementation.

```ts
import type { CryptoAlgorithm } from '@alikhalilll/nuxt-crypto/types';

const myAlgo: CryptoAlgorithm = {
  version: 'v2',
  async deriveKey({ subtle, passphrase, salt, iterations }) {
    /* ... */
  },
  async encrypt({ subtle, key, plainText }) {
    /* ... */
  },
  async decrypt({ subtle, key, cipher, iv }) {
    /* ... */
  },
};

const service = await createCryptoService({
  passphrase: 'p4ss',
  algorithm: myAlgo,
});
```

## Rotating the passphrase

```ts
const oldService = await createCryptoService({ passphrase: OLD_PASS });
const newService = await createCryptoService({ passphrase: NEW_PASS });

async function rotate(payload: string): Promise<string> {
  const plain = await oldService.decrypt(payload);
  return newService.encrypt(plain);
}
```

## Payload format

`v1.{saltB64}.{ivB64}.{cipherB64}` — four dot-separated segments, each standard base64.

| Segment | Bytes | Notes                              |
| ------- | ----- | ---------------------------------- |
| `v1`    | —     | Algorithm / version tag.           |
| salt    | 16    | Per-encryption PBKDF2 salt.        |
| iv      | 12    | AES-GCM initialization vector.     |
| cipher  | N     | Ciphertext + 16-byte GCM auth tag. |

## Module options

| Option         | Type      | Default     | Purpose                                                        |
| -------------- | --------- | ----------- | -------------------------------------------------------------- |
| `passphrase`   | `string`  | `''`        | Passphrase to derive the AES key from. Throws at use if empty. |
| `provideName`  | `string`  | `'$crypto'` | Injected under `$<name>`. Leading `$` is stripped.             |
| `iterations`   | `number`  | `100_000`   | PBKDF2 iteration count.                                        |
| `keyCacheSize` | `number`  | `64`        | Max derived keys kept in memory. Set to 0 to disable caching.  |
| `serverOnly`   | `boolean` | `false`     | When true, plugin runs only on the server.                     |

## Exported types

```ts
import type {
  CryptoService,
  CryptoServiceConfig,
  CryptoAlgorithm,
  CryptoModuleOptions,
  Bytes,
  ParsedPayload,
} from '@alikhalilll/nuxt-crypto/types';
```
