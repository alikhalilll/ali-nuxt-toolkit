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
- **Device fingerprint** _(new)_ — optional HttpOnly-cookie-based binding so ciphertext becomes undecryptable outside the browser that created it, while still surviving IP changes.

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

Nitro event handlers run outside the Nuxt app context — `useNuxtApp()` (and `$crypto`) is not available there. Use the framework-agnostic core and cache it in `server/utils/`:

```ts
// server/utils/crypto.ts
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';

let servicePromise: ReturnType<typeof createCryptoService> | null = null;

export function useServerCrypto() {
  if (!servicePromise) {
    servicePromise = createCryptoService({
      passphrase: process.env.NUXT_ENCRYPTION_PASSPHRASE!,
      iterations: 100_000,
    });
  }
  return servicePromise;
}
```

```ts
// server/api/session/encode.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const crypto = await useServerCrypto();
  return { token: await crypto.encrypt(JSON.stringify(body)) };
});
```

## Device fingerprint

Bind a payload to the browser that created it — a copy of the ciphertext in another browser or on another device will refuse to decrypt. Useful for short-lived CSRF tokens, one-time magic links, anti-replay nonces, or any flow where a stolen token must be worthless off-origin.

The fingerprint is built from an **HttpOnly device-ID cookie** (not the client IP), so it survives network changes — Wi-Fi → 4G, cell handoffs, VPN rotations, laptop sleeps — while still blocking copy-paste to a different browser or device.

### Setup

Add a fingerprint salt to your runtime config — a long random secret, **server-side only**:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    cryptoFingerprintSalt: process.env.NUXT_CRYPTO_FINGERPRINT_SALT ?? '',
  },
});
```

```bash
# .env
NUXT_CRYPTO_FINGERPRINT_SALT=replace-with-64-random-hex-chars
```

### Encrypt with a fingerprint (server side)

```ts
// server/api/session/encode.post.ts
import { getClientFingerprint } from '@alikhalilll/nuxt-crypto/server';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const crypto = await useServerCrypto(); // from server/utils/crypto.ts — see "Nitro routes" above

  const fingerprint = await getClientFingerprint(event, {
    salt: useRuntimeConfig().cryptoFingerprintSalt,
  });

  return {
    token: await crypto.encrypt(JSON.stringify(body), { fingerprint }),
  };
});
```

On the first request for a browser, `getClientFingerprint` sets an HttpOnly cookie (`__nuxt_crypto_device`) with a random 32-byte device ID. Subsequent calls reuse it, so the returned fingerprint is stable per browser.

### Decrypt with a fingerprint (server side)

```ts
// server/api/session/decode.post.ts
import { getClientFingerprint } from '@alikhalilll/nuxt-crypto/server';

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event);
  const crypto = await useServerCrypto();

  const fingerprint = await getClientFingerprint(event, {
    salt: useRuntimeConfig().cryptoFingerprintSalt,
  });

  // Same cookie → same fingerprint → succeeds.
  // Different browser/device → no cookie → different fingerprint → OperationError.
  return { body: JSON.parse(await crypto.decrypt(token, { fingerprint })) };
});
```

### What survives, what doesn't

| Scenario                                    | Still decrypts?                     |
| ------------------------------------------- | ----------------------------------- |
| Wi-Fi → 4G on the same device               | ✅ yes — cookie travels             |
| Cell tower handoff                          | ✅ yes                              |
| Laptop sleeps, rejoins a new Wi-Fi          | ✅ yes                              |
| VPN exit node changes                       | ✅ yes                              |
| User copies token to another browser        | ❌ no — no cookie there             |
| Token exfiltrated via XSS to attacker's box | ❌ no — HttpOnly cookie unreachable |
| User clears cookies                         | ❌ no — device ID regenerates       |

### `deriveFingerprint` — bring your own device ID

If you already have a stable per-browser identifier (a session cookie, a signed JWT `sub` claim, a row in your `devices` table), skip the helper cookie entirely:

```ts
import { deriveFingerprint } from '@alikhalilll/nuxt-crypto/server';

const fingerprint = await deriveFingerprint({
  deviceId: session.id,
  salt: useRuntimeConfig().cryptoFingerprintSalt,
});
```

::alert{type="warning"}
Binding ciphertext to a fingerprint is **not appropriate for long-lived user data**. If the device cookie is cleared or the session rotates, those payloads become undecryptable — permanently. Use this for tokens the user can afford to lose: short sessions, magic links, one-shot nonces.
::

### Customizing the cookie

```ts
await getClientFingerprint(event, {
  salt: useRuntimeConfig().cryptoFingerprintSalt,
  cookieName: 'my-app-dev-id',
  cookieMaxAge: 60 * 60 * 24 * 30, // 30 days
  cookieOptions: {
    sameSite: 'strict', // defaults to 'lax'
    domain: '.example.com',
  },
});
```

Defaults: `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, `secure` auto-detected from the request protocol, `maxAge` = 1 year.

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
