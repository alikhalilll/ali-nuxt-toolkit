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

// Protect `body` from third-party scroll locks (reka-ui's `useBodyScrollLock`,
// vaul-vue's Safari lock, …) while our own event lock is active. The legacy
// approach was for the popover to set `body { overflow: hidden; pointer-events:
// none }` itself; multiple modal libraries still do the same on every mount,
// and any one of them silently breaks `position: sticky` on the host page.
//
// We deliberately don't snapshot the host's prior values — those locks usually
// fire *during* setup (synchronously, in the same tick our lock activates), so
// by the time our `flush: 'post'` watch runs the snapshot would already capture
// the broken state. Instead we treat the four "lock-disabling" values as
// blacklisted while our lock is engaged: any time they appear we clear them
// back to empty. The host's *legitimate* values are typically the empty string
// anyway, since hosts that rely on body overflow set it via CSS, not inline
// style. The blacklist matches exactly what each upstream lock writes.
const PROTECTED_PROPS = ['overflow', 'overflowY', 'overflowX', 'pointerEvents'] as const;
let bodyStyleObserver: MutationObserver | null = null;
let bodyStyleHtmlObserver: MutationObserver | null = null;
let bodyClassObserver: MutationObserver | null = null;

const BAD_OVERFLOW_VALUES = new Set(['hidden', 'clip']);

function clearBadBodyStyles() {
  if (typeof document === 'undefined') return;
  const s = document.body.style;
  if (BAD_OVERFLOW_VALUES.has(s.overflow)) s.overflow = '';
  if (BAD_OVERFLOW_VALUES.has(s.overflowY)) s.overflowY = '';
  if (BAD_OVERFLOW_VALUES.has(s.overflowX)) s.overflowX = '';
  if (s.pointerEvents === 'none') s.pointerEvents = '';
  // vaul-vue / reka-ui both also try `position: fixed` + `top: -{n}px` on
  // Safari to lock scroll. Same sticky-breaking story — neutralise.
  if (s.position === 'fixed') s.position = '';
  if (s.top.startsWith('-')) s.top = '';
  if (s.left.startsWith('-')) s.left = '';
  if (s.right === '0px') s.right = '';
  if (s.height === 'auto' || s.height === '100%') s.height = '';
  // reka-ui adds margin-right + padding-right compensation when the scrollbar
  // disappears. Without an actual lock those create visible reflow.
  if (s.marginRight && s.marginRight !== '0px') s.marginRight = '';
  if (s.paddingRight && s.paddingRight !== '0px') s.paddingRight = '';
}

function clearBadHtmlStyles() {
  if (typeof document === 'undefined') return;
  const s = document.documentElement.style;
  if (BAD_OVERFLOW_VALUES.has(s.overflow)) s.overflow = '';
  if (BAD_OVERFLOW_VALUES.has(s.overflowY)) s.overflowY = '';
  if (BAD_OVERFLOW_VALUES.has(s.overflowX)) s.overflowX = '';
  // vaul's shouldScaleBackground path writes a `--scrollbar-width` custom
  // property to the documentElement when locking; harmless but removed for
  // cleanliness so the host doesn't see ghost vars after close.
}

function startBodyStyleProtection() {
  if (typeof document === 'undefined') return;
  // 1) Sweep the current state immediately — covers the case where reka-ui or
  //    vaul already locked the body BEFORE our `flush: 'post'` watch fired.
  clearBadBodyStyles();
  clearBadHtmlStyles();

  if (!bodyStyleObserver) {
    bodyStyleObserver = new MutationObserver(() => clearBadBodyStyles());
    bodyStyleObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  }
  if (!bodyStyleHtmlObserver) {
    bodyStyleHtmlObserver = new MutationObserver(() => clearBadHtmlStyles());
    bodyStyleHtmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }
  // Also watch for class additions (some libs add a `scroll-lock` class that
  // pairs with a global CSS rule); re-sweep on every body class change.
  if (!bodyClassObserver) {
    bodyClassObserver = new MutationObserver(() => clearBadBodyStyles());
    bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
}

function stopBodyStyleProtection() {
  bodyStyleObserver?.disconnect();
  bodyStyleObserver = null;
  bodyStyleHtmlObserver?.disconnect();
  bodyStyleHtmlObserver = null;
  bodyClassObserver?.disconnect();
  bodyClassObserver = null;
}

function activate() {
  if (refCount === 0) {
    startBodyStyleProtection();
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
    stopBodyStyleProtection();
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
