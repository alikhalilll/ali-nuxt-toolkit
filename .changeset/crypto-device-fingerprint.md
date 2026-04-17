---
'@alikhalilll/nuxt-crypto': minor
---

**Device-fingerprint binding for ciphertext.**

`encrypt(text, { fingerprint })` and `decrypt(payload, { fingerprint })` now accept an optional `fingerprint` string that is mixed into the PBKDF2 input. Ciphertext produced with a fingerprint is undecryptable unless the same fingerprint is supplied at decrypt time.

New server subpath `@alikhalilll/nuxt-crypto/server` exports:

- `getClientFingerprint(event, { salt })` — sets/reads an HttpOnly device-ID cookie (`__nuxt_crypto_device`, 1-year max-age) and returns a stable fingerprint string. Survives network changes (Wi-Fi ↔ 4G, VPN rotations) but blocks copy-paste to another browser or device.
- `deriveFingerprint({ deviceId, salt })` — pure helper when you manage device identity yourself (existing session table, signed JWT, etc.).
- `ClientFingerprintOptions`, `FingerprintParts` types.

API is additive: existing `encrypt(text)` / `decrypt(payload)` calls without options keep working, and old payloads encrypted without a fingerprint keep decrypting the same way.

`h3` is now an optional peer dep, only needed if you consume `/server`.
