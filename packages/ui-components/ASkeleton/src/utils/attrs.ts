/**
 * Centralised attribute names used across the v3 pipeline.
 *
 * Modelled on the upstream library's `constants.ts` — one import, every DOM selector
 * ever used by the engine. If a new attribute is added, this is the only
 * place its name is defined; CSS selectors in `styles.src.css`, test
 * fixtures, and runtime checks all reach for the constant.
 *
 * The `data-` prefix is intentional: unprefixed attribute names read like
 * a custom-element name to browsers and lints; `data-a-skel-foo` is a
 * legitimate HTML author attribute everywhere.
 */

/** Root wrapper of a reveal (one `<ASkeleton>` instance). */
export const ATTR_REVEAL = 'data-a-skel-reveal';
/** A single pane within a reveal (`skeleton` | `content` | `error` | `empty`). */
export const ATTR_PANE = 'data-a-skel-pane';
/** Set on the reveal root while the skeleton pane is up. */
export const ATTR_LOADING = 'data-a-skel-loading';
/** The invisible "ghost" element holding the real content for measurement. */
export const ATTR_GHOST = 'data-a-skel-ghost';
/** A pre-measured shape injected while the ghost hasn't settled. */
export const ATTR_SNAPSHOT = 'data-a-skel-snapshot';
/** The shadow-DOM host that paints the skeleton bones. */
export const ATTR_LAYER = 'data-a-skel-layer';
/** A single opaque block bone (positioned absolute inside the layer). */
export const ATTR_RECT = 'data-a-skel-rect';
/** A single text-bar bone. */
export const ATTR_BAR = 'data-a-skel-bar';
/** An element the walker drew over as a single block — its paint is hidden by CSS. */
export const ATTR_COVERED = 'data-a-skel-covered';
/** On a pane fading out: its layout is pinned so the exit animation can play safely. */
export const ATTR_EXITING = 'data-a-skel-exiting';
/** The screen-reader status element rendered next to a loading pane. */
export const ATTR_STATUS = 'data-a-skel-status';
/** Debug overlay inheritance root — any descendant inherits debug mode. */
export const ATTR_DEBUG = 'data-a-skel-debug';
/** Toggles the x-ray view: shows the ghost through the bones in debug mode. */
export const ATTR_XRAY = 'data-a-skel-xray';
