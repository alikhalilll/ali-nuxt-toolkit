export type ScrollLockMode = 'events' | 'body' | 'none';

export interface AResponsivePopoverProps {
  /** CSS media query for the desktop break. Below this width we render a vaul drawer. */
  breakpoint?: string;
  /**
   * @deprecated prefer `scrollLock`. Kept for back-compat: `modal=false` is a shorthand
   * for `scrollLock="none"` (tooltip-style popover). `modal=true` (default) defers to
   * `scrollLock`, which controls how page scroll is blocked.
   */
  modal?: boolean;
  /**
   * How page scroll is blocked while the popover (desktop) or drawer (mobile) is open:
   * - `'events'` (default) — wheel / touch / keyboard intercepted at document level.
   *   Page scrollbar stays visible, `position: sticky` keeps working, the picker's own
   *   inner list still scrolls, and `vaul-vue`'s pointer-based drag-to-dismiss is unaffected.
   * - `'body'` — legacy `document.body.style.overflow='hidden'` lock. Use when the page
   *   must reflow as the scrollbar goes away.
   * - `'none'` — no page-scroll lock at all.
   *
   * The same mode applies to both the desktop popover and the mobile drawer.
   */
  scrollLock?: ScrollLockMode;
}

/**
 * Emit map for {@link AResponsivePopover}. `update:open` is the `v-model:open`.
 */
export type AResponsivePopoverEmits = {
  'update:open': [value: boolean | undefined];
};

/**
 * Slot prop shape for {@link AResponsivePopover}. The default slot receives
 * `isDesktop` so consumers can branch content on the active breakpoint without
 * a separate `useMediaQuery` call.
 */
export interface AResponsivePopoverSlots {
  default?: (props: { isDesktop: boolean }) => unknown;
}
