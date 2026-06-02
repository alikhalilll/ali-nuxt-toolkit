import type { HTMLAttributes } from 'vue';
import type {
  PopoverRootProps,
  PopoverRootEmits,
  PopoverContentProps,
  PopoverContentEmits,
  PopoverTriggerProps,
} from 'reka-ui';

/**
 * Props for the {@link APopover} root. Wraps `reka-ui`'s `PopoverRootProps`
 * unchanged. Declared as an `interface … extends` (instead of a `type` alias)
 * so consumers can declaration-merge to layer custom props later without a
 * breaking export rename.
 */
export interface APopoverProps extends PopoverRootProps {}
export interface APopoverEmits extends PopoverRootEmits {}

export interface APopoverTriggerProps extends PopoverTriggerProps {}

export interface APopoverContentProps extends PopoverContentProps {
  class?: HTMLAttributes['class'];
  /**
   * Dim the entire viewport behind the popover and block all interaction with the
   * page (clicks are captured by the overlay). Pair with `<APopover :modal="true">`
   * (the default) for the full modal behaviour.
   */
  overlay?: boolean;
  overlayClass?: HTMLAttributes['class'];
  /**
   * When true, the overlay also locks page scroll while open.
   *
   * Sticky-safe: implemented via document-level event capture (`useEventScrollLock`),
   * not `body { overflow: hidden }`. The host page's `position: sticky` elements stay
   * in place and the page scrollbar stays visible (no width shift). The popover's own
   * inner content can still scroll because it's allowed through the lock.
   */
  overlayLockScroll?: boolean;
}
export interface APopoverContentEmits extends PopoverContentEmits {}

/**
 * Props for {@link APopoverOverlay} — the optional dim layer behind a popover.
 * Wrapper-only (no reka-ui parent), so the shape is defined entirely here.
 */
export interface APopoverOverlayProps {
  class?: HTMLAttributes['class'];
  /**
   * When true, block page scroll while the overlay is mounted.
   *
   * Implemented with the event-based `useEventScrollLock` (wheel / touchmove /
   * scroll-keys intercepted at document capture). Unlike the legacy
   * `body { overflow: hidden }` approach this:
   *
   * - Keeps `position: sticky` working on the host page (headers, sticky TOC bars,
   *   in-page indicators all stay put).
   * - Leaves the page scrollbar visible — no width compensation, no layout jump.
   * - Lets the popover content's own inner list still scroll.
   */
  lockScroll?: boolean;
}
