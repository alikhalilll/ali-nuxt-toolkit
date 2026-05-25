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
   * How desktop page scroll is blocked while the popover is open:
   * - `'events'` (default) — wheel/touch/keyboard intercepted at document level.
   *   Page scrollbar stays visible; `position: sticky` keeps working.
   * - `'body'` — legacy `document.body.style.overflow='hidden'` lock. Use when the
   *   page must reflow as the scrollbar goes away.
   * - `'none'` — no page-scroll lock at all.
   *
   * Drawer (mobile) branch is unaffected — vaul-vue owns its own lock.
   */
  scrollLock?: ScrollLockMode;
}

/**
 * Emit map for {@link AResponsivePopover}. `update:open` is the `v-model:open`.
 */
export type AResponsivePopoverEmits = {
  'update:open': [value: boolean | undefined];
};
