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

export interface ADrawerProps extends DrawerRootProps {}
export interface ADrawerEmits extends DrawerRootEmits {}

export interface ADrawerTriggerProps extends DrawerTriggerProps {}

export interface ADrawerContentProps extends DialogContentProps {
  class?: HTMLAttributes['class'];
}
export interface ADrawerContentEmits extends DialogContentEmits {}

export interface ADrawerOverlayProps extends DialogOverlayProps {
  class?: HTMLAttributes['class'];
}
