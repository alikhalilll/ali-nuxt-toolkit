export { default as APopover } from './components/popover/index.vue';
export { default as APopoverTrigger } from './components/popoverTrigger/index.vue';
export { default as APopoverContent } from './components/popoverContent/index.vue';
export { default as APopoverOverlay } from './components/popoverOverlay/index.vue';
export {
  useEventScrollLock,
  type UseEventScrollLockOptions,
} from './composables/useEventScrollLock';

export type {
  APopoverProps,
  APopoverEmits,
  APopoverTriggerProps,
  APopoverContentProps,
  APopoverContentEmits,
  APopoverOverlayProps,
} from './types';
