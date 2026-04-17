/**
 * Resolve a SubtleCrypto implementation across environments:
 *
 * - Browser / Deno / Bun / Node 20+: `globalThis.crypto.subtle` is available.
 * - Older Node: fall back to `node:crypto`'s `webcrypto`.
 */
export async function getSubtle(): Promise<SubtleCrypto> {
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  const { webcrypto } = await import('node:crypto');
  return webcrypto.subtle as unknown as SubtleCrypto;
}

/** Fill the given buffer with cryptographically strong random bytes. */
export function getRandomBytes(length: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(length);
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    c.getRandomValues(out);
    return out;
  }
  throw new Error(
    '[nuxt-crypto] globalThis.crypto.getRandomValues is not available. Upgrade your runtime.'
  );
}
