import type { CryptoAlgorithm } from '../types';

/**
 * AES-256-GCM with PBKDF2-SHA256 key derivation. This is the default and
 * currently the only built-in algorithm; pluggable via `CryptoServiceConfig.algorithm`.
 */
export const aesGcmPbkdf2: CryptoAlgorithm = {
  version: 'v1',

  async deriveKey({ subtle, passphrase, salt, iterations }) {
    const keyMaterial = await subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  async encrypt({ subtle, key, plainText }) {
    const iv = new Uint8Array(new ArrayBuffer(12));
    globalThis.crypto.getRandomValues(iv);
    const buf = await subtle.encrypt({ name: 'AES-GCM', iv }, key, plainText);
    const cipher = new Uint8Array(new ArrayBuffer(buf.byteLength));
    cipher.set(new Uint8Array(buf));
    return { cipher, iv };
  },

  async decrypt({ subtle, key, cipher, iv }) {
    const buf = await subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    const out = new Uint8Array(new ArrayBuffer(buf.byteLength));
    out.set(new Uint8Array(buf));
    return out;
  },
};
