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
   * How page scroll is blocked while the popover (desktop) or drawer (mobile) is open.
   * Both modes that *do* lock are sticky-safe — page-level `position: sticky` elements
   * (headers, TOC bars, in-page rails) keep working in either:
   *
   * - `'events'` (default) — wheel / touch / keyboard intercepted at document capture.
   *   Page scrollbar stays visible, the picker's own inner list still scrolls, and
   *   `vaul-vue`'s pointer-based drag-to-dismiss is unaffected.
   * - `'body'` — also event-based now (the legacy `body { overflow: hidden }` mutation
   *   was retired because it killed sticky positioning on the host page). Kept as a
   *   distinct value for back-compat; behaviour matches `'events'`. Prefer `'events'`
   *   in new code.
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
