/** Shorthand for the `Uint8Array` we use everywhere in the crypto package. */
export type Bytes = Uint8Array<ArrayBuffer>;

/**
 * Options accepted by `encrypt` / `decrypt`. Both calls must receive the
 * same `fingerprint` value to round-trip; passing different fingerprints
 * produces undecryptable ciphertext.
 */
export interface CryptoOperationOptions {
  /**
   * Optional extra key material mixed into the PBKDF2 input. Typically a
   * device fingerprint produced server-side from the client IP + User-Agent
   * via `getClientFingerprint()` from `@alikhalilll/nuxt-crypto/server`.
   *
   * ⚠️ Binding ciphertext to a fingerprint means the payload becomes
   * undecryptable the moment any input to the fingerprint changes
   * (IP rotation, UA update, browser switch). Use only for ephemeral
   * tokens (short-lived session cookies, one-time links), never for
   * long-lived user data.
   */
  fingerprint?: string;
}

/**
 * A CryptoService encrypts plaintext to a serialisable string payload and
 * decrypts it back. Every operation is async because it hits the Web Crypto
 * subtle API.
 */
export interface CryptoService {
  /** Encrypt a UTF-8 string to a versioned, base64-encoded payload. */
  encrypt(plainText: string, options?: CryptoOperationOptions): Promise<string>;
  /** Decrypt a payload produced by `encrypt`. Pass the same `fingerprint` used at encrypt time, if any. */
  decrypt(payload: string, options?: CryptoOperationOptions): Promise<string>;
  /** Clear any cached derived keys. Safe to call at any time. */
  clearKeyCache(): void;
}

/** Config for `createCryptoService`. */
export interface CryptoServiceConfig {
  /** Passphrase used to derive the symmetric key. */
  passphrase: string;
  /** PBKDF2 iteration count. Default 100_000. */
  iterations?: number;
  /**
   * Algorithm implementation. Defaults to AES-256-GCM with PBKDF2-SHA256 key
   * derivation. Replace to plug in a different cipher.
   */
  algorithm?: CryptoAlgorithm;
  /**
   * Max number of derived keys held in memory. Derived keys are expensive —
   * caching them by salt dramatically speeds up bulk decrypt. Default 64.
   * Set to 0 to disable caching.
   */
  keyCacheSize?: number;
  /** Override the SubtleCrypto implementation. Useful for testing. */
  subtle?: SubtleCrypto;
}

/**
 * A pluggable symmetric-encryption algorithm. Each implementation owns the
 * payload format (via its version tag), key derivation, and the actual
 * encrypt/decrypt work.
 */
export interface CryptoAlgorithm {
  /** Short identifier stored as the first segment of every payload (e.g. `'v1'`). */
  readonly version: string;
  /**
   * Derive a CryptoKey from a passphrase + salt pair. Expected to be idempotent.
   * When `fingerprint` is provided it is mixed into the key-derivation input
   * (alongside the passphrase) so ciphertext becomes bound to that fingerprint.
   */
  deriveKey(args: {
    subtle: SubtleCrypto;
    passphrase: string;
    fingerprint?: string;
    salt: Bytes;
    iterations: number;
  }): Promise<CryptoKey>;
  /** Encrypt plaintext bytes using a pre-derived key. Returns cipher bytes + any per-call params (e.g. IV). */
  encrypt(args: {
    subtle: SubtleCrypto;
    key: CryptoKey;
    plainText: Bytes;
  }): Promise<{ cipher: Bytes; iv: Bytes }>;
  /** Decrypt cipher bytes using a pre-derived key and the IV produced during encrypt. */
  decrypt(args: { subtle: SubtleCrypto; key: CryptoKey; cipher: Bytes; iv: Bytes }): Promise<Bytes>;
}
