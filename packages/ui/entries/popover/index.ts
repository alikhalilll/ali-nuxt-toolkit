export { default as APopover } from './components/APopover.vue';
export { default as APopoverTrigger } from './components/APopoverTrigger.vue';
export { default as APopoverContent } from './components/APopoverContent.vue';
export { default as APopoverOverlay } from './components/APopoverOverlay.vue';
export {
  useEventScrollLock,
  type UseEventScrollLockOptions,
} from './composables/useEventScrollLock';

// Reka-ui passes-through. The toolkit's `A*` wrappers forward these unchanged,
// so consumers get the same prop/emit surface re-exported under our naming
// convention without the extra `reka-ui` import.
export type {
  PopoverRootProps as APopoverProps,
  PopoverRootEmits as APopoverEmits,
  PopoverContentProps as APopoverContentProps,
  PopoverContentEmits as APopoverContentEmits,
  PopoverTriggerProps as APopoverTriggerProps,
} from 'reka-ui';
