import { onBeforeUnmount, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

export interface UseEventScrollLockOptions {
  /**
   * Element(s) inside the popover whose internal scroll should be preserved.
   * Events whose target is inside one of these are allowed to scroll the
   * element (subject to boundary clamping); everything else is preventDefault'd.
   */
  allowedScrollContainer: MaybeRefOrGetter<HTMLElement | HTMLElement[] | null | undefined>;
  /** Lock activates when this becomes true and tears down when false. */
  active: Ref<boolean> | (() => boolean);
}

// Module-level so multiple popovers stacking share one listener set.
let refCount = 0;
const allowedContainers = new Set<HTMLElement>();

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  'Space',
  ' ',
]);

function insideAllowed(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false;
  for (const el of allowedContainers) if (el.contains(target)) return true;
  return false;
}

// Walk up from the event target; if any ancestor (up to and including the
// allowed container) is a scroller that can absorb the delta in this direction
// without overshooting its boundary, allow the event.
function canConsume(el: HTMLElement, dx: number, dy: number): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    const s = getComputedStyle(node);
    const scrollsY =
      (s.overflowY === 'auto' || s.overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
    if (scrollsY && dy !== 0) {
      const atTop = node.scrollTop <= 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      if (!(dy < 0 && atTop) && !(dy > 0 && atBottom)) return true;
    }
    const scrollsX =
      (s.overflowX === 'auto' || s.overflowX === 'scroll') && node.scrollWidth > node.clientWidth;
    if (scrollsX && dx !== 0) {
      const atLeft = node.scrollLeft <= 0;
      const atRight = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
      if (!(dx < 0 && atLeft) && !(dx > 0 && atRight)) return true;
    }
    if (allowedContainers.has(node)) break;
    node = node.parentElement;
  }
  return false;
}

function onWheel(e: WheelEvent) {
  const t = (e.composedPath()[0] ?? e.target) as HTMLElement | null;
  if (!t || !insideAllowed(t)) {
    e.preventDefault();
    return;
  }
  if (!canConsume(t, e.deltaX, e.deltaY)) e.preventDefault();
}

let touchStartY = 0;
let touchStartX = 0;
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0]!.clientY;
    touchStartX = e.touches[0]!.clientX;
  }
}
function onTouchMove(e: TouchEvent) {
  const t = (e.composedPath()[0] ?? e.target) as HTMLElement | null;
  if (!t || !insideAllowed(t)) {
    e.preventDefault();
    return;
  }
  if (e.touches.length !== 1) {
    e.preventDefault();
    return;
  }
  const dy = touchStartY - e.touches[0]!.clientY;
  const dx = touchStartX - e.touches[0]!.clientX;
  if (!canConsume(t, dx, dy)) e.preventDefault();
}

function onKeyDown(e: KeyboardEvent) {
  if (!SCROLL_KEYS.has(e.key)) return;
  // Popover owns its own keyboard model (search input, list navigation).
  if (insideAllowed(e.target)) return;
  e.preventDefault();
}

function activate() {
  if (refCount === 0) {
    document.addEventListener('wheel', onWheel, {
      passive: false,
      capture: true,
    });
    document.addEventListener('touchstart', onTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener('touchmove', onTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener('keydown', onKeyDown, { capture: true });
  }
  refCount++;
}

function deactivate() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    document.removeEventListener('wheel', onWheel, { capture: true });
    document.removeEventListener('touchstart', onTouchStart, { capture: true });
    document.removeEventListener('touchmove', onTouchMove, { capture: true });
    document.removeEventListener('keydown', onKeyDown, { capture: true });
  }
}

/**
 * Sticky-safe scroll lock: prevents page scroll by intercepting wheel/touch/key
 * events at `document` capture phase, instead of mutating `body { overflow }`.
 * The page scrollbar stays visible and `position: sticky` keeps working.
 *
 * Pass the element(s) whose own scroll should still work (e.g. a popover's
 * inner search list) as `allowedScrollContainer`.
 */
export function useEventScrollLock(opts: UseEventScrollLockOptions): void {
  if (typeof document === 'undefined') return;

  let registered: HTMLElement[] = [];
  let activeNow = false;

  const register = () => {
    const raw = toValue(opts.allowedScrollContainer);
    const list = Array.isArray(raw) ? (raw.filter(Boolean) as HTMLElement[]) : raw ? [raw] : [];
    for (const el of list) allowedContainers.add(el);
    registered = list;
  };
  const unregister = () => {
    for (const el of registered) allowedContainers.delete(el);
    registered = [];
  };

  const stopActive = watch(
    () => (typeof opts.active === 'function' ? opts.active() : opts.active.value),
    (v) => {
      if (v && !activeNow) {
        register();
        activate();
        activeNow = true;
      } else if (!v && activeNow) {
        deactivate();
        unregister();
        activeNow = false;
      }
    },
    { immediate: true, flush: 'post' }
  );

  const stopContainer = watch(
    () => toValue(opts.allowedScrollContainer),
    () => {
      if (activeNow) {
        unregister();
        register();
      }
    },
    { flush: 'post' }
  );

  onBeforeUnmount(() => {
    stopActive();
    stopContainer();
    if (activeNow) {
      deactivate();
      unregister();
      activeNow = false;
    }
  });
}
