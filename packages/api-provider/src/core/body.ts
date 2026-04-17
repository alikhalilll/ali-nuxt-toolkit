import { dropContentType } from './headers';
import type { RequestBody } from './types';

/** Methods for which a request body is meaningless and should be dropped. */
export function shouldOmitBody(method?: string): boolean {
  const m = (method || 'GET').toUpperCase();
  return m === 'GET' || m === 'HEAD';
}

/**
 * Encode a user-supplied body into something `fetch` understands, and set
 * the correct Content-Type header on the way out.
 *
 * - `FormData` / `URLSearchParams` / `Blob` / `ArrayBuffer` / `string` → passed through.
 * - Plain objects and arrays → JSON-encoded, Content-Type set to `application/json`.
 * - `FormData` → Content-Type header is dropped so the browser can set the boundary.
 * - `URLSearchParams` → Content-Type set to `application/x-www-form-urlencoded` if not set.
 */
export function encodeBody(
  headers: Record<string, string>,
  body: RequestBody
): { headers: Record<string, string>; body: BodyInit | undefined } {
  if (body === undefined || body === null) {
    return { headers, body: undefined };
  }

  if (body instanceof FormData) {
    return { headers: dropContentType(headers), body };
  }

  if (body instanceof URLSearchParams) {
    const hasCT = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
    const next = hasCT
      ? headers
      : { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' };
    return { headers: next, body };
  }

  if (typeof body === 'string' || body instanceof Blob || body instanceof ArrayBuffer) {
    return { headers, body: body as BodyInit };
  }

  // Plain object / array → JSON
  const hasCT = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
  const next = hasCT ? headers : { ...headers, 'Content-Type': 'application/json' };
  return { headers: next, body: JSON.stringify(body) };
}
