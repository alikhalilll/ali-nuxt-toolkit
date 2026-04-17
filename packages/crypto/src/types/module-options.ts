export interface CryptoModuleOptions {
  /**
   * Passphrase used to derive the AES key. Prefer wiring this from a
   * runtime config env var (e.g. `NUXT_ENCRYPTION_PASSPHRASE`) rather than
   * committing it.
   */
  passphrase: string;
  /**
   * Name under which the service is provided. Accepts `$crypto` or `crypto`
   * — the leading `$` is stripped. Default: `$crypto`.
   */
  provideName?: string;
  /** PBKDF2 iterations. Default 100_000. */
  iterations?: number;
  /**
   * Max number of derived keys held in memory. Default 64. Set to 0 to
   * disable caching.
   */
  keyCacheSize?: number;
  /**
   * When `true`, the runtime plugin is only registered on the server. Useful
   * when you do not want the plaintext passphrase shipped to the browser.
   * Default: `false`.
   */
  serverOnly?: boolean;
}
