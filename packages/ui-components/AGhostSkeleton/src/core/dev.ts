import { fill } from './snapshot';

declare const process: { env: { NODE_ENV?: string } };

let dev = false;
try {
  // Bundlers replace the whole expression; with none, `process` doesn't exist
  dev = process.env.NODE_ENV !== 'production';
} catch {
  dev = false;
}

export const isDev = dev;

const warned = new Set<string>();

export function warnOnce(id: string, message: string) {
  if (!isDev || warned.has(id)) return;
  warned.add(id);
  // eslint-disable-next-line no-console
  console.warn(`[a-ghost-skeleton] ${message}`);
}

const URL_LIKE = /^(https?:|\/|data:|blob:)/;

/**
 * Warns once per app if the page has a meta CSP that restricts inline scripts and
 * the consumer did not pass a nonce through the provider. Silent when CSP is absent
 * or when the loading pane isn't on the client yet — we can't read CSP headers from
 * script, so the meta-tag check is a best-effort signal to developers.
 */
export function checkNonce(nonce: string | undefined): void {
  if (!isDev || typeof document === 'undefined' || nonce) return;
  const meta = document.querySelector('meta[http-equiv="Content-Security-Policy" i]');
  const content = meta?.getAttribute('content') ?? '';
  if (!/script-src/i.test(content)) return;
  if (/'unsafe-inline'/.test(content) || /\*/.test(content)) return;
  warnOnce(
    'csp:missing-nonce',
    'AGhostSkeleton ships an inline boot script that measures the server-rendered skeleton before first paint. Your page has a Content-Security-Policy with script-src but no nonce was passed to <AGhostSkeletonProvider :nonce="…">, so the browser will block it and first paint will be blank. Pass the same nonce you used for the response header.'
  );
}

/** Same keys and lengths as `data`, with every string replaced by filler. */
export function sampleFrom(data: unknown): unknown {
  if (typeof data === 'string') return URL_LIKE.test(data) ? '' : fill(data);
  if (Array.isArray(data)) return data.map(sampleFrom);
  if (data instanceof Date) return data;
  if (data && typeof data === 'object') {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, sampleFrom(value)]));
  }
  return data;
}
