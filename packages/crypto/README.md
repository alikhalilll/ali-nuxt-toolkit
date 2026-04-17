# @alikhalilll/nuxt-crypto

Symmetric encryption for Nuxt 3 / 4, built on the native **Web Crypto API**. Defaults to **AES-256-GCM** with **PBKDF2-SHA256** key derivation.

- **Framework-agnostic core** — `createCryptoService()` works anywhere `SubtleCrypto` exists (browser, Deno, Bun, Node 20+).
- **Key caching** — derived keys are cached per salt, so bulk decrypt stays fast even at 100k+ PBKDF2 iterations.
- **Pluggable algorithms** — swap the default AES-GCM implementation for your own `CryptoAlgorithm` without touching the payload envelope.
- **Versioned payload format** — `v1.{salt}.{iv}.{cipher}` with clean forward compatibility.
- **Server-only mode** — opt into registering the plugin only on the server so the passphrase never ships to the browser bundle.
- **Device fingerprint** _(new)_ — bind a payload to the browser that created it via an HttpOnly cookie. Survives IP changes (Wi-Fi ↔ 4G, VPN rotation) while still blocking copy-paste to another browser or device.
- **Strong types** — `CryptoService`, `CryptoServiceConfig`, and `CryptoAlgorithm` all exported.

---

## Table of contents

1. [Install](#install)
2. [Register the module](#register-the-module)
3. [Usage](#usage)
   - [Basic round-trip](#basic-round-trip)
   - [Encrypt / decrypt a JSON object](#encrypt--decrypt-a-json-object)
   - [Encrypt / decrypt an arbitrary value](#encrypt--decrypt-an-arbitrary-value)
   - [Persist a ciphertext in a cookie](#persist-a-ciphertext-in-a-cookie)
   - [Bulk encrypt / decrypt (key cache benefits)](#bulk-encrypt--decrypt-key-cache-benefits)
   - [Clear the key cache](#clear-the-key-cache)
   - [Error handling](#error-handling)
4. [Server-only mode](#server-only-mode)
5. [Nitro / API routes](#nitro--api-routes)
6. [Device fingerprint](#device-fingerprint)
7. [Framework-agnostic core](#framework-agnostic-core)
8. [Custom algorithm](#custom-algorithm)
9. [Rotating the passphrase (re-encryption)](#rotating-the-passphrase-re-encryption)
10. [Payload format](#payload-format)
11. [Module options reference](#module-options-reference)
12. [Exported types](#exported-types)

---

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
    // Always wire this from an env var. Never commit the passphrase.
    passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
    provideName: '$crypto', // leading "$" optional
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

## Usage

### Basic round-trip

```vue
<script setup lang="ts">
const { $crypto } = useNuxtApp();

const payload = await $crypto.encrypt('super-secret');
// payload: "v1.<saltB64>.<ivB64>.<cipherB64>"

const plain = await $crypto.decrypt(payload);
</script>
```

`$crypto` is typed as `CryptoService` via auto-generated module augmentation.

### Encrypt / decrypt a JSON object

`encrypt` takes a string, so stringify structured data first:

```ts
const session = { userId: 42, roles: ['admin'], issuedAt: Date.now() };

const payload = await $crypto.encrypt(JSON.stringify(session));

const restored = JSON.parse(await $crypto.decrypt(payload)) as typeof session;
```

A tiny helper makes this ergonomic:

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

### Encrypt / decrypt an arbitrary value

```ts
const { encode, decode } = useEncrypted();

const token = await encode({ refresh: 'abc123', exp: Date.now() + 3_600_000 });
const { refresh, exp } = await decode<{ refresh: string; exp: number }>(token);
```

### Persist a ciphertext in a cookie

```ts
const cookie = useCookie<string | null>('session');

// Write
cookie.value = await $crypto.encrypt(JSON.stringify({ userId: 42 }));

// Read
if (cookie.value) {
  const { userId } = JSON.parse(await $crypto.decrypt(cookie.value));
}
```

### Bulk encrypt / decrypt (key cache benefits)

PBKDF2 is deliberately slow. The built-in key cache (default size 64) keys derived material by salt, so a second decrypt of any payload you've already touched is essentially free:

```ts
const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);

const payloads = await Promise.all(items.map((i) => $crypto.encrypt(i)));

// Fast — each salt was just derived during encrypt, so decrypt hits the cache.
const plain = await Promise.all(payloads.map((p) => $crypto.decrypt(p)));
```

### Clear the key cache

```ts
$crypto.clearKeyCache();
```

Useful when:

- You rotate the passphrase (the cache would still hold old keys).
- You want to force re-derivation in a security-audit test.

### Error handling

```ts
try {
  await $crypto.decrypt('not-a-real-payload');
} catch (e) {
  // '[nuxt-crypto] Invalid payload format — expected 4 dot-separated segments.'
  console.error((e as Error).message);
}
```

Errors you can see:

| Scenario                               | Message                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| Payload isn't `a.b.c.d`                | `Invalid payload format — expected 4 dot-separated segments.` |
| A segment is empty                     | `Invalid payload format — one or more segments were empty.`   |
| Algorithm version mismatch             | `Unsupported payload version: v2 (algorithm expects v1).`     |
| Wrong passphrase / tampered ciphertext | Native `OperationError` from Web Crypto.                      |
| Passphrase not set in module config    | `[nuxt-crypto] passphrase is required.`                       |

## Server-only mode

Set `serverOnly: true` in module options to skip the client plugin entirely — the passphrase never ends up in the browser bundle.

```ts
crypto: {
  passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE ?? '',
  serverOnly: true,
}
```

With this enabled, `$crypto` is `undefined` on the client. Use it only in:

- Nitro server routes (`server/api/*.ts`)
- Server-only plugins
- `<script setup>` blocks guarded by `import.meta.server`

## Nitro / API routes

Encrypt data before sending it to the browser, decrypt it when it comes back:

```ts
// server/api/session/encode.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { $crypto } = useNuxtApp();
  return { token: await $crypto.encrypt(JSON.stringify(body)) };
});

// server/api/session/decode.post.ts
export default defineEventHandler(async (event) => {
  const { token } = await readBody(event);
  const { $crypto } = useNuxtApp();
  return JSON.parse(await $crypto.decrypt(token));
});
```

## Device fingerprint

Bind a payload to the browser that created it, so a copy of the ciphertext in another browser or on another device won't decrypt. Useful for short-lived CSRF tokens, magic links, and anti-replay nonces.

The fingerprint is built from an **HttpOnly device-ID cookie** — not the client IP — so it survives Wi-Fi → 4G switches, cell handoffs, VPN rotations, and residential IP rotation while still blocking copy-paste to another origin.

### Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-side pepper. Keep this secret; never expose to the client.
    cryptoFingerprintSalt: process.env.NUXT_CRYPTO_FINGERPRINT_SALT ?? '',
  },
});
```

```
# .env
NUXT_CRYPTO_FINGERPRINT_SALT=<64 random hex chars>
```

### Encrypt / decrypt with a fingerprint

```ts
// server/api/session.post.ts
import { getClientFingerprint } from '@alikhalilll/nuxt-crypto/server';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { $crypto } = useNuxtApp();

  const fingerprint = await getClientFingerprint(event, {
    salt: useRuntimeConfig().cryptoFingerprintSalt,
  });

  return {
    token: await $crypto.encrypt(JSON.stringify(body), { fingerprint }),
  };
});
```

The first call sets an HttpOnly cookie (`__nuxt_crypto_device`) with a random 32-byte ID; subsequent calls reuse it. Pass the same `{ fingerprint }` to `$crypto.decrypt` on the server to round-trip.

### What this protects against

| Scenario                                  | Decrypts?                            |
| ----------------------------------------- | ------------------------------------ |
| Wi-Fi → 4G on the same device             | ✅ yes — cookie travels with browser |
| VPN exit node or ISP IP rotation          | ✅ yes                               |
| Copy token to another browser on same box | ❌ no — no cookie in that browser    |
| XSS-exfiltrated token to an attacker      | ❌ no — HttpOnly cookie unreachable  |
| User clears cookies                       | ❌ no — permanently unrecoverable    |

### `deriveFingerprint` — bring your own device ID

If you already manage per-device identity (session table, signed JWT, etc.), skip the cookie helper:

```ts
import { deriveFingerprint } from '@alikhalilll/nuxt-crypto/server';

const fingerprint = await deriveFingerprint({
  deviceId: session.id,
  salt: useRuntimeConfig().cryptoFingerprintSalt,
});
```

> **Warning** — a fingerprinted payload becomes undecryptable if the device cookie is cleared or the session rotates. Use only for tokens the user can afford to lose (short sessions, magic links, one-shot nonces), never for long-lived data.

## Framework-agnostic core

Everything the Nuxt plugin wraps is available as a plain factory:

```ts
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';

const service = await createCryptoService({
  passphrase: process.env.ENC_PASS!,
  iterations: 100_000,
  keyCacheSize: 64,
});

const payload = await service.encrypt('hi');
const clear = await service.decrypt(payload);
service.clearKeyCache();
```

Works in Node 20+, Bun, Deno, or any browser. Passing a custom `subtle: SubtleCrypto` is supported for testing.

## Custom algorithm

Replace AES-GCM with any cipher by implementing `CryptoAlgorithm`. The payload envelope (`{version}.{salt}.{iv}.{cipher}`) is preserved, and the version tag routes decrypt to the right algorithm.

```ts
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';
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

Old v1 payloads will cleanly fail decrypt under a v2 service (the version check throws). Build a version router yourself if you need mixed-version reads during a rotation.

## Rotating the passphrase (re-encryption)

```ts
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';

const oldService = await createCryptoService({ passphrase: OLD_PASS });
const newService = await createCryptoService({ passphrase: NEW_PASS });

async function rotate(payload: string): Promise<string> {
  const plain = await oldService.decrypt(payload);
  return newService.encrypt(plain);
}
```

Run `rotate` over your stored ciphertexts during a background migration. Clear the key cache on whichever service goes out of use.

## Payload format

`v1.{saltB64}.{ivB64}.{cipherB64}` — four dot-separated segments, each standard base64:

| Segment | Bytes | Notes                              |
| ------- | ----- | ---------------------------------- |
| `v1`    | —     | Algorithm / version tag.           |
| salt    | 16    | Per-encryption PBKDF2 salt.        |
| iv      | 12    | AES-GCM initialization vector.     |
| cipher  | N     | Ciphertext + 16-byte GCM auth tag. |

## Module options reference

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
  CryptoOperationOptions,
  CryptoAlgorithm,
  CryptoModuleOptions,
  Bytes,
  ParsedPayload,
} from '@alikhalilll/nuxt-crypto/types';

// Server subpath (Nitro / H3 only)
import type { ClientFingerprintOptions, FingerprintParts } from '@alikhalilll/nuxt-crypto/server';
import { getClientFingerprint, deriveFingerprint } from '@alikhalilll/nuxt-crypto/server';
```

## License

MIT
