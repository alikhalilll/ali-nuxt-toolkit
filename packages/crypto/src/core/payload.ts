import { fromBase64, toBase64 } from './base64';
import type { Bytes } from './types';

/**
 * Payload serialisation format (v1): `${version}.${saltB64}.${ivB64}.${cipherB64}`.
 *
 * Each part is URL-safe base64, all joined with `.`. The version tag is
 * always the first segment so consumers can route to the correct algorithm
 * during decrypt.
 */
export interface ParsedPayload {
  version: string;
  salt: Bytes;
  iv: Bytes;
  cipher: Bytes;
}

export function encodePayload(parts: ParsedPayload): string {
  return [parts.version, toBase64(parts.salt), toBase64(parts.iv), toBase64(parts.cipher)].join(
    '.'
  );
}

export function parsePayload(payload: string): ParsedPayload {
  const segments = payload.split('.');
  if (segments.length !== 4) {
    throw new Error('[nuxt-crypto] Invalid payload format — expected 4 dot-separated segments.');
  }
  const [version, saltB64, ivB64, cipherB64] = segments;
  if (!version || !saltB64 || !ivB64 || !cipherB64) {
    throw new Error('[nuxt-crypto] Invalid payload format — one or more segments were empty.');
  }
  return {
    version,
    salt: fromBase64(saltB64),
    iv: fromBase64(ivB64),
    cipher: fromBase64(cipherB64),
  };
}
