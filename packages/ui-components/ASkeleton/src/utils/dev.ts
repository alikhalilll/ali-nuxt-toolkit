/**
 * Dev-mode diagnostics. One warn per `id` per session so repeated renders
 * don't spam the console; silenced completely in production via the
 * `process.env.NODE_ENV` guard (bundlers tree-shake the whole module when
 * `NODE_ENV === 'production'` is substituted).
 *
 * Boundary purity: the only side effect anywhere in this module is
 * `console.warn`. No DOM reads, no network, no module-level state beyond
 * the dedup `Set`. Safe to import from the pure-function walkers.
 */

declare const process: { env: { NODE_ENV?: string } };

let devMode = false;
try {
  /* Bundlers (Vite, esbuild, Rollup) substitute `process.env.NODE_ENV` at
   * build time, so this expression is constant-folded. In runtimes where
   * `process` isn't defined (vanilla browser ESM, Deno), we fall back to
   * `false` — no accidental dev warnings in production. */
  devMode = process.env.NODE_ENV !== 'production';
} catch {
  devMode = false;
}

export const isDev = devMode;

const warned = new Set<string>();

/**
 * Emit a one-time console warning. Later calls with the same `id` are
 * silently dropped — a long-lived app that re-renders a component 1000×
 * sees the message exactly once.
 *
 * The `id` namespace matters: pick something stable per *message*, not per
 * *call site*, so related issues (e.g. "wrapper X has an unsized image")
 * dedup across renders of the same wrapper. Compose it from the message
 * category + the identifying key: `size-mismatch:${cacheKey}`.
 */
export function warnOnce(id: string, message: string, ...rest: unknown[]): void {
  if (!isDev || warned.has(id)) return;
  warned.add(id);
  // eslint-disable-next-line no-console
  console.warn(`[a-skeleton] ${message}`, ...rest);
}

/** Test-only: forget all dedup state so one test's warning doesn't gag the next. */
export function resetWarnedForTest(): void {
  warned.clear();
}
