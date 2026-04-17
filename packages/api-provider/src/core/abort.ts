/**
 * Combine the client-internal timeout signal with an optional user-supplied
 * signal. Falls back to returning the internal signal when `AbortSignal.any`
 * is unavailable (older runtimes).
 */
export function combineSignals(internal: AbortSignal, external?: AbortSignal | null): AbortSignal {
  if (!external) return internal;
  if (typeof AbortSignal?.any === 'function') {
    return AbortSignal.any([internal, external]);
  }
  // Fallback: propagate abort from external to a new controller.
  const controller = new AbortController();
  const abortAll = () => controller.abort();
  if (internal.aborted || external.aborted) controller.abort();
  else {
    internal.addEventListener('abort', abortAll, { once: true });
    external.addEventListener('abort', abortAll, { once: true });
  }
  return controller.signal;
}
