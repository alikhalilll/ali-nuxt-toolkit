/* Components */
export { default as ASkeleton } from './components/ASkeleton.vue';
export { default as ASkeletonLayer } from './components/ASkeletonLayer.vue';
export { default as ASkeletonBlock } from './components/ASkeletonBlock.vue';
export { StructuralSkeleton } from './components/StructuralSkeleton';

/* Composables */
export { useSkeleton } from './composables/useSkeleton';
export { useShapeProbe } from './composables/useShapeProbe';
export { getCached, setCached, clearCached } from './composables/useSkeletonCache';

/* Pure utilities — for direct measurement, vnode-walking, default key derivation. */
export { walkDom } from './utils/walkDom';
export { buildStructuralSkeleton } from './utils/buildStructuralSkeleton';
export { fingerprintSlot } from './utils/fingerprint';

/* Types */
export type {
  ASkeletonProps,
  ASkeletonSlots,
  ASkeletonLayerProps,
  ASkeletonBlockProps,
  CachedShape,
  ShapeNode,
  ShapeNodeType,
  SkeletonAnimation,
  SkeletonFallback,
} from './types';
export type { UseSkeletonOptions, UseSkeletonReturn } from './composables/useSkeleton';
export type { ShapeProbeOptions } from './composables/useShapeProbe';
export type { WalkOptions } from './utils/walkDom';
export type { BuildOptions } from './utils/buildStructuralSkeleton';
