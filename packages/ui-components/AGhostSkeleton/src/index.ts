/* Vue components */
export { default as AGhostSkeleton } from './components/AGhostSkeleton.vue';
export { default as AGhostSkeletonBox } from './components/AGhostSkeletonBox.vue';
export { default as AGhostSkeletonSuspense } from './components/AGhostSkeletonSuspense.vue';
export { default as AGhostSkeletonProvider } from './components/AGhostSkeletonProvider.vue';

/* Composables */
export { useGhostSkeleton } from './composables/useGhostSkeleton';
export { useStyles } from './composables/useStyles';

/* Component prop / slot / event contracts — also consumed by the web-types generator. */
export type {
  AGhostSkeletonBoxProps,
  AGhostSkeletonEmits,
  AGhostSkeletonProps,
  AGhostSkeletonProviderProps,
  AGhostSkeletonProviderSlots,
  AGhostSkeletonSlots,
  AGhostSkeletonSuspenseEmits,
  AGhostSkeletonSuspenseProps,
  AGhostSkeletonSuspenseSlots,
  GhostSkeletonConfig,
} from './types';

/* Framework-agnostic engine. Everything below is usable without Vue — the
 * `Reveal` class drives the same ghost / measure / reveal lifecycle by hand. */
export * from './core';
