/* Deprecation notice — this package is superseded by @alikhalilll/a-smart-skeleton.
 * The warning fires once per process in development; production builds strip the
 * `process.env.NODE_ENV` branch via bundler dead-code elimination, so the only cost
 * is a single property read. Kept outside component setup so it fires on `import`
 * even when the components are tree-shaken or never mounted. */
declare const process: { env: { NODE_ENV?: string } };
try {
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV !== 'production' &&
    typeof console !== 'undefined'
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '[a-skeleton] @alikhalilll/a-skeleton is deprecated — migrate to @alikhalilll/a-smart-skeleton. See https://alikhalilll.github.io/ali-nuxt-toolkit/ui/smart-skeleton for the migration guide.'
    );
  }
} catch {
  /* No `process` outside bundling; stay silent. */
}

/* Components */
export { default as ASkeleton } from './components/ASkeleton.vue';
export { default as ASkeletonLayer } from './components/ASkeletonLayer.vue';
export { default as ASkeletonBlock } from './components/ASkeletonBlock.vue';
export { default as ASkeletonClone } from './components/ASkeletonClone.vue';
export { default as ASkeletonGhost } from './components/ASkeletonGhost.vue';
export { default as ASkeletonBones } from './components/ASkeletonBones.vue';
export { default as ASkeletonProvider } from './components/ASkeletonProvider.vue';

/* SSR + theme surface. */
export {
  addStyles,
  applyTheme,
  DEFAULT_COLORS,
  DEFAULT_THEME,
  removeStyles,
  resetStylesForTest,
  skeletonCSS,
  stylesHtml,
  themeStyleTag,
  themeVariables,
} from './boot';
export type {
  SkeletonAnimation as ThemeSkeletonAnimation,
  SkeletonColors,
  SkeletonCSSOptions,
  SkeletonMode,
  SkeletonSpeed,
  SkeletonText,
  SkeletonTextBottom,
  SkeletonTextTop,
  SkeletonTheme,
} from './boot';

/* Framework-agnostic engine classes — the measure/ghost/reveal core
 * loading + content lifecycles. Consumers writing a non-Vue adapter use
 * these directly; the Vue adapter wraps them in `<ASkeletonBones>` and
 * `useSkeletonLifecycle`. */
export { Ghost, Memory, setLoadingSize, takeLoadingSize } from './engine';
export type { GhostOptions, LoadingSize, MemoryOptions } from './engine';
export { SKELETON_CONFIG_KEY, useSkeletonConfig } from './composables/useSkeletonConfig';
export type { SkeletonConfig } from './composables/useSkeletonConfig';
export { StructuralSkeleton } from './components/StructuralSkeleton';

/* Measure engine — public surface for consumers who want to drive it
 * manually (e.g. a Suspense wrapper that measures outside Vue's render loop). */
export {
  barOf,
  clipWithin,
  clipped as clippedRect,
  cornersOf,
  drawSkeleton,
  intersect as intersectRects,
  measureSkeleton,
  metricsOf,
  radiiOf,
  textContext,
} from './measure';
export type {
  Clip,
  Corners,
  DrawOptions,
  MeasureOptions,
  ShimmerAnimation,
  SkeletonRect,
  TextBottom,
  TextTop,
} from './measure';

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

/* v3 shared infra — hints, dev warnings, reveal planner, motion. */
export {
  HINT_ATTRS,
  HINT_CLASSES,
  isForcedBlock,
  isIgnored,
  isSelfSkeletonising,
  isStopped,
} from './utils/hints';
export { isDev, warnOnce } from './utils/dev';
export { warnMissingSample, warnSizeMismatch, warnUnsizedImage } from './utils/warnings';
export {
  clearReveal,
  debugging,
  everywhere as debugEverywhere,
  reportLoading,
  reportReveal,
  setDebug,
} from './utils/debug';
export type { DebugSource } from './utils/debug';
export { flushShapes, forgetShapes, recallShape, rememberShape, trackShape } from './utils/shapes';
export { canAnimate, prefersReducedMotion, prefersReducedTransparency } from './utils/motion';
export { fill, sampleFrom } from './utils/sample';
export { imageReady, pendingImages, IMAGE_TIMEOUT } from './utils/images';
export { resolveState } from './utils/resolveState';
export type { ASkeletonState, ResolveStateInput } from './utils/resolveState';

/* Reveal planner + applier — public so consumers can roll their own
 * animation flows (e.g. SkeletonSuspense-style wrappers). */
export {
  byPosition,
  byRow,
  byContent,
  exitDuration,
  fadeIn,
  fadeOut,
  noteSkeleton,
  pieces as revealPieces,
  planReveal,
  quickly,
  revealContext,
  unitOf,
  ACTIVE_WINDOW,
  BATCH_WINDOW,
  CASCADE_SPREAD,
  FADE_DURATION,
  MAX_DELAY,
  MAX_DURATION,
  QUICK_FADE,
  SECONDARY_DELAY,
  SKELETON_DELAY,
  SMALL_HEIGHT,
  SMALL_PIECES,
} from './reveal';
export type { Piece, Plan, RevealContext, RevealMode } from './reveal';

/* v3 DOM attribute names — scoped CSS selectors + test fixtures reach for
 * these so there's one source of truth. */
export {
  ATTR_COVERED,
  ATTR_DEBUG,
  ATTR_EXITING,
  ATTR_GHOST,
  ATTR_LAYER,
  ATTR_LOADING,
  ATTR_PANE,
  ATTR_RECT,
  ATTR_REVEAL,
  ATTR_SNAPSHOT,
  ATTR_STATUS,
  ATTR_XRAY,
  ATTR_BAR,
} from './utils/attrs';

/* Types */
export type {
  ASkeletonEmits,
  ASkeletonProps,
  ASkeletonMode,
  ASkeletonReveal,
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
