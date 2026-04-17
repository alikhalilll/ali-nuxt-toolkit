import type { Bytes } from './types';
import { toBase64 } from './base64';

/**
 * A tiny LRU-ish cache for derived `CryptoKey` values, keyed on the salt.
 * When capacity is exceeded the oldest entry is evicted. Derived key
 * material is expensive (PBKDF2 is designed to be slow), so caching has
 * a big impact when decrypting many payloads in a row.
 */
export class KeyCache {
  private readonly map = new Map<string, Promise<CryptoKey>>();
  constructor(private readonly capacity: number) {}

  static key(salt: Bytes, iterations: number, fingerprint?: string): string {
    // `.` separates the fields; iterations and base64 can't contain one,
    // and fingerprint is sanitised via toBase64-ish hex via consumer, so
    // the joined key is unambiguous.
    return `${iterations}.${fingerprint ?? ''}.${toBase64(salt)}`;
  }

  get(key: string): Promise<CryptoKey> | undefined {
    const value = this.map.get(key);
    if (!value) return undefined;
    // Refresh recency by re-inserting.
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: string, value: Promise<CryptoKey>): void {
    if (this.capacity <= 0) return;
    this.map.set(key, value);
    while (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  clear(): void {
    this.map.clear();
  }
}
