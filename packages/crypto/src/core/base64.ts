import type { Bytes } from './types';

/** Encode bytes to standard base64. Works in browser and Node. */
export function toBase64(data: Bytes): string {
  if (typeof btoa === 'function') {
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < data.length; i += CHUNK) {
      binary += String.fromCharCode(...data.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }
  // Node fallback — Buffer is globally available in Node.
  return Buffer.from(data).toString('base64');
}

/** Decode a base64 string back to bytes. Works in browser and Node. */
export function fromBase64(input: string): Bytes {
  if (typeof atob === 'function') {
    const binary = atob(input);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  const buf = Buffer.from(input, 'base64');
  const out = new Uint8Array(buf.length);
  out.set(buf);
  return out;
}
