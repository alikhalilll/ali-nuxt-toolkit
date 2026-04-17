import type { RetryOptions } from './types';

export const DEFAULT_RETRY: RetryOptions = {
  attempts: 0,
  delayMs: 300,
  backoff: 2,
  statusCodes: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
};

export function resolveRetry(
  clientDefaults: Partial<RetryOptions> | undefined,
  perCall: Partial<RetryOptions> | undefined
): RetryOptions {
  return { ...DEFAULT_RETRY, ...clientDefaults, ...perCall };
}

/** Should a response with this status trigger a retry? */
export function shouldRetryStatus(status: number, options: RetryOptions): boolean {
  return options.statusCodes.includes(status);
}

/** Compute the delay before the Nth retry (0-indexed). */
export function computeDelay(attempt: number, options: RetryOptions): number {
  return options.delayMs * Math.pow(options.backoff, attempt);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}
