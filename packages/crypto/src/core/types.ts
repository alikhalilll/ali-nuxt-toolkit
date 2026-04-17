/** Shorthand for the `Uint8Array` we use everywhere in the crypto package. */
export type Bytes = Uint8Array<ArrayBuffer>;

/**
 * A CryptoService encrypts plaintext to a serialisable string payload and
 * decrypts it back. Every operation is async because it hits the Web Crypto
 * subtle API.
 */
export interface CryptoService {
  /** Encrypt a UTF-8 string to a versioned, base64-encoded payload. */
  encrypt(plainText: string): Promise<string>;
  /** Decrypt a payload produced by `encrypt`. */
  decrypt(payload: string): Promise<string>;
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
  /** Derive a CryptoKey from a passphrase + salt pair. Expected to be idempotent. */
  deriveKey(args: {
    subtle: SubtleCrypto;
    passphrase: string;
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
