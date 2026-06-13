/* Components */
export { default as ASkeleton } from './components/ASkeleton.vue';
export { default as ASkeletonLayer } from './components/ASkeletonLayer.vue';
export { default as ASkeletonBlock } from './components/ASkeletonBlock.vue';
export { default as ASkeletonClone } from './components/ASkeletonClone.vue';
export { StructuralSkeleton } from './components/StructuralSkeleton';

/* Style-capture engine — public surface for advanced consumers who want to
 * roll their own capture/replay flow. */
export { captureSnapshot } from './utils/captureStyles';
export type {
  CaptureSnapshot,
  CapturedNode,
  TextLineRect,
  CaptureOptions,
} from './utils/captureStyles';

/* Variant primitives — Vuetify/shadcn/Flowbite-style preset skeletons.
 * Use these when auto-detect from a slot isn't right (or when you want a
 * standalone skeleton without wrapping real content). Each is a thin SFC
 * on top of `.a-skel` + variant CSS classes. */
export { default as ASkeletonText } from './components/variants/ASkeletonText.vue';
export { default as ASkeletonHeading } from './components/variants/ASkeletonHeading.vue';
export { default as ASkeletonAvatar } from './components/variants/ASkeletonAvatar.vue';
export { default as ASkeletonImage } from './components/variants/ASkeletonImage.vue';
export { default as ASkeletonVideo } from './components/variants/ASkeletonVideo.vue';
export { default as ASkeletonButton } from './components/variants/ASkeletonButton.vue';
export { default as ASkeletonInput } from './components/variants/ASkeletonInput.vue';
export { default as ASkeletonListItem } from './components/variants/ASkeletonListItem.vue';
export { default as ASkeletonCard } from './components/variants/ASkeletonCard.vue';
export { default as ASkeletonTable } from './components/variants/ASkeletonTable.vue';
export { default as ASkeletonChart } from './components/variants/ASkeletonChart.vue';
export { default as ASkeletonForm } from './components/variants/ASkeletonForm.vue';
export { default as ASkeletonArticle } from './components/variants/ASkeletonArticle.vue';
export { default as ASkeletonDivider } from './components/variants/ASkeletonDivider.vue';
export { default as ASkeletonChip } from './components/variants/ASkeletonChip.vue';

/* Composables */
export { useSkeleton } from './composables/useSkeleton';
export { useShapeProbe } from './composables/useShapeProbe';
export {
  getCached,
  setCached,
  clearCached,
  getCachedStructural,
  setCachedStructural,
  clearCachedStructural,
} from './composables/useSkeletonCache';

/* Pure utilities — for direct measurement, vnode-walking, default key derivation. */
export { walkDom } from './utils/walkDom';
export { walkStructural } from './utils/walkStructural';
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
  StructuralShape,
  StructuralNode,
  ContainerNode,
  LeafNode,
  LeafKind,
  StructuralTextLineRect,
} from './types';
export type { UseSkeletonOptions, UseSkeletonReturn } from './composables/useSkeleton';
export type { ShapeProbeOptions, CaptureStrategy, ProbeShape } from './composables/useShapeProbe';
export type { WalkOptions } from './utils/walkDom';
export type { WalkStructuralOptions } from './utils/walkStructural';
export type { BuildOptions } from './utils/buildStructuralSkeleton';
