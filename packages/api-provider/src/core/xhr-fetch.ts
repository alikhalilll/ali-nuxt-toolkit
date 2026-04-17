import type { RequestProgress } from './types';

/**
 * Build a `fetch`-compatible function backed by `XMLHttpRequest`.
 *
 * Used internally when a caller provides `onRequestProgress` — `fetch` has no
 * way to observe upload progress, whereas XHR exposes both `xhr.upload.onprogress`
 * and `xhr.onprogress`. The return shape mirrors native `fetch` so the rest of
 * the client (interceptors, retry, JSON parsing, error mapping) stays
 * transport-agnostic.
 *
 * Browser-only. `XMLHttpRequest` doesn't exist in Node/Nitro server contexts;
 * that's fine because progress callbacks only make sense in a browser.
 */
export function createXhrFetch(
  onProgress: (progress: RequestProgress) => void
): (input: string, init: RequestInit) => Promise<Response> {
  return function xhrFetch(input, init) {
    const method = (init.method ?? 'GET').toUpperCase();
    const body = (init.body ?? null) as XMLHttpRequestBodyInit | null;
    const headers = init.headers as Record<string, string> | undefined;
    const signal = init.signal as AbortSignal | null | undefined;

    return new Promise<Response>((resolve, reject) => {
      if (typeof XMLHttpRequest === 'undefined') {
        reject(
          new Error(
            '[@alikhalilll/nuxt-api-provider] onRequestProgress is not supported in this runtime (no XMLHttpRequest).'
          )
        );
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open(method, input, true);
      xhr.responseType = 'blob';
      if (init.credentials === 'include') xhr.withCredentials = true;

      if (headers) {
        for (const [name, value] of Object.entries(headers)) {
          try {
            xhr.setRequestHeader(name, value);
          } catch {
            // Some headers (e.g. `User-Agent`) are forbidden; skip silently.
          }
        }
      }

      xhr.upload.onprogress = (e) => onProgress(normaliseProgress('upload', e));
      xhr.onprogress = (e) => onProgress(normaliseProgress('download', e));

      const onAbort = () => xhr.abort();
      if (signal) {
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }

      xhr.onload = () => {
        if (signal) signal.removeEventListener('abort', onAbort);
        const responseHeaders = parseHeaders(xhr.getAllResponseHeaders());
        resolve(
          new Response(xhr.response as BodyInit | null, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: responseHeaders,
          })
        );
      };

      xhr.onerror = () => {
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(new TypeError('Network error'));
      };

      xhr.onabort = () => {
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(new DOMException('Aborted', 'AbortError'));
      };

      xhr.ontimeout = () => {
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(new DOMException('Request timeout', 'TimeoutError'));
      };

      xhr.send(body);
    });
  };
}

function normaliseProgress(
  phase: 'upload' | 'download',
  e: ProgressEvent
): RequestProgress {
  const total = e.lengthComputable ? e.total : null;
  const ratio = total && total > 0 ? e.loaded / total : null;
  return { phase, loaded: e.loaded, total, ratio };
}

function parseHeaders(raw: string): Headers {
  const out = new Headers();
  if (!raw) return out;
  for (const line of raw.trim().split(/[\r\n]+/)) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (name) out.append(name, value);
  }
  return out;
}
