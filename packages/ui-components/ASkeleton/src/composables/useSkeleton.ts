import { shallowRef, type Ref } from 'vue';
import type { CachedShape } from '../types';
import { useShapeProbe } from './useShapeProbe';
import { clearCached, getCached, setCached } from './useSkeletonCache';
import { walkDom } from '../utils/walkDom';

export interface UseSkeletonOptions {
  /**
   * Identifier for the shape cache. Pass the same key wherever the same visual
   * structure appears so the captured shape replays everywhere.
   */
  cacheKey: string;
  /**
   * Getter for the element to measure. When it returns `null` (e.g. during the
   * loading state), no measurement happens. The probe re-arms automatically
   * once the getter returns an element again.
   *
   * Typical pattern: return `null` while loading so the real content is the
   * only thing ever measured, then the cache feeds the skeleton on the next
   * load.
   */
  target?: () => HTMLElement | null;
  /** Persist to `localStorage` so first-paint after reload skips the cold start. Default false. */
  persist?: boolean;
  /** Forwarded to `walkDom`. Default 6. */
  maxDepth?: number;
  /** Forwarded to `walkDom`. Default 500. */
  maxNodes?: number;
  /** Forwarded to `walkDom`. Default 4. */
  minSize?: number;
  /** Forwarded to `useShapeProbe`. Default 150 ms. */
  resizeDebounceMs?: number;
}

export interface UseSkeletonReturn {
  /** Reactive captured shape — `undefined` on cache miss. Replace your skeleton render path. */
  shape: Readonly<Ref<CachedShape | undefined>>;
  /**
   * Synchronously measure the current target and write to cache. Returns the
   * captured shape, or `undefined` if the target wasn't available / nothing
   * worth measuring was rendered. Use when you want to force a capture outside
   * the automatic `ResizeObserver` flow (e.g. after an animation settles).
   */
  captureNow: () => CachedShape | undefined;
  /** Drop the cache entry for this `cacheKey`. The reactive `shape` flips to `undefined`. */
  clear: () => void;
}

/**
 * High-level building block for custom skeleton UIs. Wires up the probe + cache
 * + reactivity so the consumer just renders something using the reactive shape:
 *
 * ```ts
 * const containerRef = ref<HTMLElement | null>(null);
 * const { shape } = useSkeleton({
 *   cacheKey: 'user-card',
 *   target: () => (loading.value ? null : containerRef.value),
 * });
 * ```
 *
 * ```vue
 * <div ref="containerRef">
 *   <ASkeletonLayer v-if="loading && shape" :shape="shape" />
 *   <UserCard v-else :data="user" />
 * </div>
 * ```
 *
 * For more control, drop down to `useShapeProbe` + `getCached`/`setCached` and
 * compose your own.
 */
export function useSkeleton(options: UseSkeletonOptions): UseSkeletonReturn {
  const persist = options.persist ?? false;
  const maxDepth = options.maxDepth ?? 6;

  const shape = shallowRef<CachedShape | undefined>(getCached(options.cacheKey, persist));

  if (options.target) {
    const getTarget = options.target;
    useShapeProbe(getTarget, {
      maxDepth,
      maxNodes: options.maxNodes,
      minSize: options.minSize,
      resizeDebounceMs: options.resizeDebounceMs,
      onCapture: (captured) => {
        setCached(options.cacheKey, captured, persist);
        shape.value = captured;
      },
    });
  }

  function captureNow(): CachedShape | undefined {
    const el = options.target?.();
    if (!el || typeof window === 'undefined') return undefined;
    const captured = walkDom(el, {
      maxDepth,
      maxNodes: options.maxNodes,
      minSize: options.minSize,
    });
    if (captured.width <= 0 || captured.height <= 0 || captured.nodes.length === 0)
      return undefined;
    setCached(options.cacheKey, captured, persist);
    shape.value = captured;
    return captured;
  }

  function clear(): void {
    clearCached(options.cacheKey);
    shape.value = undefined;
  }

  return { shape, captureNow, clear };
}
