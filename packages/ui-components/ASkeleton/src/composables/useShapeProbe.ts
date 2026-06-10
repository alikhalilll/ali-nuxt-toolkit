import { onBeforeUnmount, watch } from 'vue';
import type { CachedShape } from '../types';
import { walkDom } from '../utils/walkDom';

export interface ShapeProbeOptions {
  maxDepth: number;
  /** Forwarded to `walkDom`. Default 500. */
  maxNodes?: number;
  /** Forwarded to `walkDom`. Default 4. */
  minSize?: number;
  /**
   * Debounce window for `ResizeObserver`-triggered re-captures, in ms.
   * Default 150. Prevents a re-walk every animation frame while the user is
   * actively dragging the viewport edge. The first capture (initial mount) is
   * always immediate via `requestAnimationFrame`.
   */
  resizeDebounceMs?: number;
  onCapture: (shape: CachedShape) => void;
}

const DEFAULT_RESIZE_DEBOUNCE_MS = 150;

/**
 * Observe `getTarget()` and capture its rendered shape whenever the element
 * appears or resizes.
 *
 * Performance:
 *   - Initial capture runs via `requestAnimationFrame` so it sneaks into the
 *     first idle window after mount — no synchronous layout from inside the
 *     render queue.
 *   - Subsequent `ResizeObserver` callbacks are debounced (default 150 ms) so a
 *     drag-resize doesn't trigger a fresh DOM walk per frame.
 *   - `walkDom` itself enforces `maxNodes` so even a worst-case capture (10k
 *     descendants) returns in bounded time.
 */
export function useShapeProbe(getTarget: () => HTMLElement | null, options: ShapeProbeOptions) {
  let observer: ResizeObserver | undefined;
  let frame: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let hasCaptured = false;

  const debounceMs = options.resizeDebounceMs ?? DEFAULT_RESIZE_DEBOUNCE_MS;

  function cleanup() {
    if (observer) {
      observer.disconnect();
      observer = undefined;
    }
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function capture(el: HTMLElement) {
    const result = walkDom(el, {
      maxDepth: options.maxDepth,
      maxNodes: options.maxNodes,
      minSize: options.minSize,
    });
    if (result.width > 0 && result.height > 0 && result.nodes.length > 0) {
      hasCaptured = true;
      options.onCapture(result);
    }
  }

  function scheduleImmediate(el: HTMLElement) {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = undefined;
      capture(el);
    });
  }

  function scheduleDebounced(el: HTMLElement) {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      capture(el);
    }, debounceMs);
  }

  watch(
    getTarget,
    (el) => {
      cleanup();
      hasCaptured = false;
      if (!el || typeof window === 'undefined') return;
      scheduleImmediate(el);
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          /* ResizeObserver fires once on observe() — let the rAF capture above
           * handle the initial measurement, then debounce everything that
           * follows so a drag-resize doesn't trigger a re-walk per frame. */
          if (hasCaptured) scheduleDebounced(el);
        });
        observer.observe(el);
      }
    },
    { immediate: true, flush: 'post' }
  );

  onBeforeUnmount(cleanup);
}
