/* Vue components */
export { default as ASmartSkeleton } from './components/ASmartSkeleton.vue';
export { default as ASmartSkeletonBox } from './components/ASmartSkeletonBox.vue';
export { default as ASmartSkeletonSuspense } from './components/ASmartSkeletonSuspense.vue';
export { default as ASmartSkeletonProvider } from './components/ASmartSkeletonProvider.vue';

/* Composables */
export { useSmartSkeleton } from './composables/useSmartSkeleton';
export { useStyles } from './composables/useStyles';

/* Component prop / slot / event contracts — also consumed by the web-types generator. */
export type {
  ASmartSkeletonBoxProps,
  ASmartSkeletonEmits,
  ASmartSkeletonProps,
  ASmartSkeletonProviderProps,
  ASmartSkeletonProviderSlots,
  ASmartSkeletonSlots,
  ASmartSkeletonSuspenseEmits,
  ASmartSkeletonSuspenseProps,
  ASmartSkeletonSuspenseSlots,
  SmartSkeletonConfig,
} from './types';

/* Framework-agnostic engine. Everything below is usable without Vue — the
 * `Reveal` class drives the same ghost / measure / reveal lifecycle by hand. */
export * from './core';
