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
   * When true, the overlay also locks page scroll via `body { overflow: hidden }`.
   * Off by default — `AResponsivePopover` opts in to this when `scrollLock="body"`.
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
   * When true, set `body { overflow: hidden; touchAction: none }` for the lifetime of
   * the overlay. Off by default because it breaks `position: sticky` on the host page.
   * Prefer the event-based lock (see `AResponsivePopover`'s `scrollLock` prop) which
   * keeps the page scrollbar in place.
   */
  lockScroll?: boolean;
}
