/**
 * Shared `loadingSize` state between `Ghost` and `Memory`.
 *
 * The Ghost records the final skeleton box right before it tears down;
 * the Memory reads it inside its dev-mode `check()` to compare against
 * the loaded content's box (that's the size-mismatch / unsized-image
 * detection). The hand-off is one-shot: `takeLoadingSize` reads AND
 * deletes the entry, so a second read returns `undefined`.
 *
 * Keyed by the reveal root (`[data-a-skel-reveal]`), not the Ghost's own
 * root, so different panes under one wrapper share the same slot.
 */

export interface LoadingSize {
  width: number;
  height: number;
  /** True when the ghost drew from a sample / fallback, not real data. */
  guessed: boolean;
  /** Each `<img>`'s rendered height inside the skeleton, in document order. */
  images: number[];
}

const sizes = new WeakMap<Element, LoadingSize>();

export function setLoadingSize(reveal: Element | null, size: LoadingSize): void {
  if (!reveal) return;
  sizes.set(reveal, size);
}

/**
 * Read and clear the recorded size for a reveal. The one-shot semantic
 * matches the upstream library's `takeLoadingSize` (`the upstream library/ghost.ts:60-65`):
 * only the first `Memory` after the Ghost tears down gets the comparison.
 */
export function takeLoadingSize(reveal: Element | null): LoadingSize | undefined {
  if (!reveal) return undefined;
  const value = sizes.get(reveal);
  sizes.delete(reveal);
  return value;
}
