import type { H3Event } from 'h3';
import { getCookie, getRequestProtocol, setCookie } from 'h3';

import { toBase64 } from '../core/base64';
import { getRandomBytes, getSubtle } from '../core/subtle';

// h3 doesn't re-export its cookie-options type, so derive it from setCookie.
type CookieSerializeOptions = NonNullable<Parameters<typeof setCookie>[3]>;

const DEFAULT_COOKIE_NAME = '__nuxt_crypto_device';
const DEFAULT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year
const DEVICE_ID_BYTES = 32;

/**
 * Options for {@link getClientFingerprint}.
 */
export interface ClientFingerprintOptions {
  /**
   * Per-app pepper. Stored in a runtime-config secret (e.g.
   * `NUXT_CRYPTO_FINGERPRINT_SALT`) — keeping it off the client means the
   * fingerprint can't be reproduced from a leaked device cookie alone.
   */
  salt: string;
  /** Cookie name holding the device ID. Default `__nuxt_crypto_device`. */
  cookieName?: string;
  /** Cookie lifetime in seconds. Default 1 year. */
  cookieMaxAge?: number;
  /**
   * Override individual cookie flags. Sensible defaults apply (`httpOnly: true`,
   * `sameSite: 'lax'`, `path: '/'`, and `secure` auto-detected from the request
   * protocol).
   */
  cookieOptions?: Partial<CookieSerializeOptions>;
}

/**
 * Pure inputs accepted by {@link deriveFingerprint}. Use this if you already
 * manage the device identity yourself (e.g. an existing session-cookie system
 * or a signed JWT) and want to plug a fingerprint into `crypto.encrypt`.
 */
export interface FingerprintParts {
  /** Opaque, stable per-device identifier. 16+ random bytes recommended. */
  deviceId: string;
  /** Per-app pepper. Required. */
  salt: string;
}

/**
 * Compute a fingerprint string from explicit parts. SHA-256 → base64.
 *
 * The fingerprint is deterministic — call it twice with the same inputs and
 * you get the same output. That's what lets `crypto.decrypt` succeed on a
 * payload encrypted earlier with the same device ID.
 */
export async function deriveFingerprint(parts: FingerprintParts): Promise<string> {
  // NUL separator prevents `"abc" + "d"` vs `"ab" + "cd"` collisions.
  const material = `${parts.deviceId}\x00${parts.salt}`;
  const subtle = await getSubtle();
  const hash = await subtle.digest('SHA-256', new TextEncoder().encode(material));
  return toBase64(new Uint8Array(hash));
}

/**
 * Ensure the client has a persistent HttpOnly device-ID cookie, then derive a
 * fingerprint from it. Call this from Nitro route handlers or server
 * middleware before encrypting / decrypting.
 *
 * Why an HttpOnly cookie (and not the client IP)?
 *   - **Survives network changes.** The cookie travels with the browser, so
 *     Wi-Fi ↔ 4G handoffs, cell-tower roaming, VPN rotations, and residential
 *     IP rotation don't invalidate the fingerprint.
 *   - **Anti-theft.** The cookie is HttpOnly, so XSS-exfiltrated ciphertext
 *     stored in localStorage can't be decrypted — the attacker can't read the
 *     cookie.
 *   - **Per-device / per-browser.** A token copied to another browser or
 *     device finds no device cookie there, so it won't decrypt.
 *
 * @example
 * ```ts
 * // server/api/session.post.ts
 * import { getClientFingerprint } from '@alikhalilll/nuxt-crypto/server';
 *
 * export default defineEventHandler(async (event) => {
 *   const body = await readBody(event);
 *   const { $crypto } = useNuxtApp();
 *   const fingerprint = await getClientFingerprint(event, {
 *     salt: useRuntimeConfig().cryptoFingerprintSalt,
 *   });
 *   return { token: await $crypto.encrypt(JSON.stringify(body), { fingerprint }) };
 * });
 * ```
 */
export async function getClientFingerprint(
  event: H3Event,
  options: ClientFingerprintOptions
): Promise<string> {
  if (!options.salt) {
    throw new Error('[nuxt-crypto] getClientFingerprint: `salt` is required.');
  }

  const cookieName = options.cookieName ?? DEFAULT_COOKIE_NAME;
  let deviceId = getCookie(event, cookieName);

  if (!deviceId) {
    deviceId = toBase64(getRandomBytes(DEVICE_ID_BYTES));
    const isSecure =
      options.cookieOptions?.secure ??
      getRequestProtocol(event, { xForwardedProto: true }) === 'https';
    setCookie(event, cookieName, deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: options.cookieMaxAge ?? DEFAULT_COOKIE_MAX_AGE,
      ...options.cookieOptions,
      secure: isSecure,
    });
  }

  return deriveFingerprint({ deviceId, salt: options.salt });
}
