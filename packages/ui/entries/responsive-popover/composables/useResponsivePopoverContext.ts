import { inject, provide, type ComputedRef, type InjectionKey } from 'vue';
import type { ScrollLockMode } from '../components/AResponsivePopover.vue';

export interface ResponsivePopoverContext {
  open: ComputedRef<boolean>;
  isDesktop: ComputedRef<boolean>;
  scrollLock: ComputedRef<ScrollLockMode>;
}

const RESPONSIVE_POPOVER_CONTEXT: InjectionKey<ResponsivePopoverContext> = Symbol(
  'AResponsivePopoverContext'
);

export function provideResponsivePopoverContext(ctx: ResponsivePopoverContext) {
  provide(RESPONSIVE_POPOVER_CONTEXT, ctx);
}

export function useResponsivePopoverContext(): ResponsivePopoverContext | null {
  return inject(RESPONSIVE_POPOVER_CONTEXT, null);
}
