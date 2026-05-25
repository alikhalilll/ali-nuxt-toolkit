export { default as ADrawer } from './components/ADrawer.vue';
export { default as ADrawerTrigger } from './components/ADrawerTrigger.vue';
export { default as ADrawerContent } from './components/ADrawerContent.vue';
export { default as ADrawerOverlay } from './components/ADrawerOverlay.vue';

// Vaul-vue / reka-ui passes-through. The toolkit's `A*` wrappers forward these
// unchanged, so consumers get the same prop/emit surface re-exported under our
// naming convention.
export type { DrawerRootProps as ADrawerProps, DrawerRootEmits as ADrawerEmits } from 'vaul-vue';
export type {
  DialogContentProps as ADrawerContentProps,
  DialogContentEmits as ADrawerContentEmits,
} from 'reka-ui';
