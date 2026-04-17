import { aesGcmPbkdf2 } from './algorithms/aes-gcm';
import { KeyCache } from './key-cache';
import { encodePayload, parsePayload } from './payload';
import { getRandomBytes, getSubtle } from './subtle';
import type { CryptoAlgorithm, CryptoService, CryptoServiceConfig } from './types';

const DEFAULT_ITERATIONS = 100_000;
const DEFAULT_CACHE = 64;
const SALT_BYTES = 16;

/**
 * Create a framework-agnostic `CryptoService` from a passphrase.
 *
 * Uses AES-256-GCM with PBKDF2-SHA256 (100k iterations by default). Pass a
 * different `algorithm` to plug in another cipher while preserving the same
 * versioned payload envelope.
 */
export async function createCryptoService(config: CryptoServiceConfig): Promise<CryptoService> {
  if (!config.passphrase) {
    throw new Error('[nuxt-crypto] passphrase is required.');
  }

  const iterations = config.iterations ?? DEFAULT_ITERATIONS;
  const algorithm: CryptoAlgorithm = config.algorithm ?? aesGcmPbkdf2;
  const subtle = config.subtle ?? (await getSubtle());
  const cache = new KeyCache(config.keyCacheSize ?? DEFAULT_CACHE);
  const passphrase = String(config.passphrase).trim();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function getDerivedKey(
    salt: Uint8Array<ArrayBuffer>,
    fingerprint?: string
  ): Promise<CryptoKey> {
    const key = KeyCache.key(salt, iterations, fingerprint);
    const cached = cache.get(key);
    if (cached) return cached;
    const pending = algorithm.deriveKey({ subtle, passphrase, fingerprint, salt, iterations });
    cache.set(key, pending);
    return pending;
  }

  return {
    async encrypt(plainText, options) {
      const salt = getRandomBytes(SALT_BYTES);
      const key = await getDerivedKey(salt, options?.fingerprint);
      const encoded = encoder.encode(plainText);
      const plainBytes = new Uint8Array(new ArrayBuffer(encoded.byteLength));
      plainBytes.set(encoded);
      const { cipher, iv } = await algorithm.encrypt({ subtle, key, plainText: plainBytes });
      return encodePayload({ version: algorithm.version, salt, iv, cipher });
    },

    async decrypt(payload, options) {
      const parsed = parsePayload(payload);
      if (parsed.version !== algorithm.version) {
        throw new Error(
          `[nuxt-crypto] Unsupported payload version: ${parsed.version} (algorithm expects ${algorithm.version}).`
        );
      }
      const key = await getDerivedKey(parsed.salt, options?.fingerprint);
      const plainBytes = await algorithm.decrypt({
        subtle,
        key,
        cipher: parsed.cipher,
        iv: parsed.iv,
      });
      return decoder.decode(plainBytes);
    },

    clearKeyCache(): void {
      cache.clear();
    },
  };
}
