export const ATTR_REVEAL = 'ask-reveal';
export const ATTR_PANE = 'ask-pane';
export const ATTR_LOADING = 'ask-loading';
export const ATTR_GHOST = 'ask-ghost'; // The framework's render of the content, laid out but never seen
export const ATTR_SNAPSHOT = 'ask-snapshot'; // A remembered or fallback shape, standing in for the ghost
export const ATTR_LAYER = 'ask-layer';
export const ATTR_RECT = 'ask-rect';
export const ATTR_BAR = 'ask-bar';
export const ATTR_INACTIVE = 'ask-inactive';
export const ATTR_EXITING = 'ask-exiting'; // On a pane fading out — its skeleton holds still
export const ATTR_COVERED = 'ask-covered'; // Drawn as one block by a bone, so its own paint is hidden
export const ATTR_OWN = 'ask-own'; // A subtree that draws its own skeleton — measuring stops at it
export const ATTR_IGNORE = 'ask-ignore';
export const ATTR_BLOCK = 'ask-block';

export const GHOSTED = Symbol.for('a-ghost-skeleton.ghost'); // On a loading root once its Ghost runs: the inline script stands down
export const UNCOVER = Symbol.for('a-ghost-skeleton.uncover'); // On a served loading root: drops the inline script's sheet hiding covered paint, once Ghost marks it
export const BOOT = 'a-ghost-skeleton.boot'; // Symbol.for key on window: the inline script's measuring, sent once a page — later skeletons' stubs call it, or queue for it
export const ATTR_STATUS = 'ask-status'; // Read to screen readers in place of the skeleton
export const ATTR_XRAY = 'ask-xray'; // Debug, on any ancestor: shows the ghost through its bones
export const ATTR_DEBUG = 'ask-debug'; // Debug outlines for this subtree alone

// Themed by AGhostSkeletonProvider; the fallbacks are translucent so one grey reads on light and dark pages alike
export const BASE = 'var(--ask-base, rgb(128 128 128 / 0.2))';
export const HIGHLIGHT = 'var(--ask-highlight, rgb(255 255 255 / 0.12))';
// Content fade and the parent's height ease run for the same duration and
// end on the same frame so the swap reads as one continuous motion. The
// skeleton's own fade (`SKELETON_FADE_DURATION`) is deliberately shorter
// so the bones clear out of the way while the frame is still settling —
// the viewer's eye isn't fighting a fading skeleton on top of content
// that's already settled. 260 ms is the sweet spot: long enough that the
// frame feels deliberate, short enough that the UI never reads as sluggish.
export const FADE_DURATION = 260;
export const SKELETON_FADE_DURATION = 160;
// Set to 0 so a `sequence` reveal's total (`CASCADE_SPREAD + FADE_DURATION`)
// also equals `RESIZE_DURATION`; sequence still arrives top-to-bottom via the
// per-piece `boneDelay`, but no row lingers past the frame settle.
export const CASCADE_SPREAD = 0; // From the first piece of a sequenced reveal to the last
export const RESIZE_DURATION = 260; // A reveal easing to its new height, when its skeleton guessed the content wrong
/**
 * Shared cubic-bezier curve used by every reveal animation so every fade
 * and height ease decelerates on the same rhythm. `(0.32, 0.72, 0, 1)` is
 * Apple's SF Pro / iOS standard — a strong front-loaded takeoff and a
 * long smooth landing that never overshoots. Pound-for-pound the most
 * "professional" curve for UI motion, used across iOS, macOS, and
 * SwiftUI's default implicit animations.
 */
export const REVEAL_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const IMAGE_TIMEOUT = 10000; // Longest a reveal holds for an image — a stalled request mustn't keep a skeleton up for good
// One loop of each animation, by `speed`; a shimmer's is across a 1280px-wide screen
export const DURATIONS = {
  shimmer: { slow: 4000, fast: 2000 },
  pulse: { slow: 2400, fast: 1200 },
} as const;

// Leaves that hold text, so an empty one still stands for a line of it
export const TEXT_TAGS = [
  'a',
  'b',
  'code',
  'dd',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'label',
  'li',
  'p',
  'small',
  'span',
  'strong',
  'td',
  'th',
  'time',
];

// Drawn as one block at their box — there is no text inside to measure
export const MEDIA_TAGS = [
  'audio',
  'canvas',
  'embed',
  'iframe',
  'img',
  'input',
  'object',
  'picture',
  'select',
  'svg',
  'textarea',
  'video',
];
