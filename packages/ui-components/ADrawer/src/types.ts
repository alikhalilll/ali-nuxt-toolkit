import type { HTMLAttributes } from 'vue';
import type { DrawerRootProps, DrawerRootEmits, DrawerTriggerProps } from 'vaul-vue';
import type { DialogContentProps, DialogContentEmits, DialogOverlayProps } from 'reka-ui';

/**
 * Wrapper interfaces for the toolkit's drawer components. Each `A*` component
 * forwards props to its `vaul-vue` / `reka-ui` parent unchanged, so each
 * interface extends the upstream shape 1:1. The `interface … extends` form
 * (instead of a `type` alias) lets consumers declaration-merge to add custom
 * props later without a breaking export rename.
 */

export interface ADrawerProps extends DrawerRootProps {
  /**
   * Render this drawer as a vaul `DrawerRootNested` child of a surrounding vaul
   * drawer. Required when a drawer is opened *inside* another drawer (e.g., a
   * country picker rendered on top of an already-open dialog-as-drawer). Without
   * this flag the two drawers become independent `DrawerRoot`s, so the outer
   * one's DismissableLayer + focus trap race the inner drawer: clicks on the
   * inner overlay close both drawers, and typed keys in the inner drawer never
   * reach the input because the outer focus scope yanks focus back.
   *
   * The parent `DrawerRoot` must be a `vaul-vue` root (the same one this toolkit
   * uses everywhere) — the nested wrapper injects its context via reka-ui's
   * `createContext`. Default `false`.
   */
  nested?: boolean;
}
export interface ADrawerEmits extends DrawerRootEmits {}

export interface ADrawerTriggerProps extends DrawerTriggerProps {}

export interface ADrawerContentProps extends DialogContentProps {
  class?: HTMLAttributes['class'];
}
export interface ADrawerContentEmits extends DialogContentEmits {}

export interface ADrawerOverlayProps extends DialogOverlayProps {
  class?: HTMLAttributes['class'];
}
