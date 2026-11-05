/**
 * Shared classification for every DOM walker. One source of truth for:
 *
 *   - What tags count as atomic / media / text-owner / list / table.
 *   - How author hints resolve to a kind (ignore / stop / own / block).
 *   - What minimum size a node has to clear to be worth emitting.
 *
 * Before this module each of `walkDom`, `walkStructural`, `captureStyles`,
 * and the vnode walker in `buildStructuralSkeleton` kept its own copies of
 * the tag tables + hint checks. Diverging naturally over time created the
 * exact kind of "same bug fixed in three places" problem the SOLID /
 * DRY posture is meant to prevent.
 *
 * Every walker now routes its "what is this element?" question through
 * `classify(el, cs)` and reads the returned `Kind` + optional metadata.
 */

import { isForcedBlock, isIgnored, isSelfSkeletonising, isStopped } from '../utils/hints';

/** The kind of treatment a walker should give an element. */
export type Kind =
  | 'ignore' // emit nothing; skip subtree
  | 'own' // self-skeletonising subtree; emit a passthrough wrapper
  | 'stop' // single block carrying outer class/style; no recursion
  | 'block' // forced atomic shimmer block (painted container, media, hint)
  | 'text' // text-owner leaf — emit per-line bars
  | 'media' // atomic media (img/video/svg/canvas/…)
  | 'container' // walk children
  | 'empty-text'; // text-owner with no text — synthesize a placeholder bar

/** Tags whose contents are typographic — handled as text leaves. */
export const TEXT_TAGS: ReadonlySet<string> = new Set([
  'a',
  'b',
  'blockquote',
  'caption',
  'cite',
  'code',
  'dd',
  'dt',
  'em',
  'figcaption',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'label',
  'li',
  'mark',
  'p',
  'q',
  'small',
  'span',
  'strong',
  'td',
  'th',
  'time',
]);

/** Tags treated as atomic media leaves. */
export const MEDIA_TAGS: ReadonlySet<string> = new Set([
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
]);

/** List-structural tags — preserved as containers (semantics matter for a11y). */
export const LIST_TAGS: ReadonlySet<string> = new Set(['ul', 'ol', 'li', 'dl', 'dt', 'dd']);

/** Table-structural tags — preserved as containers; `display: table-*` can't be `<div>`-ified. */
export const TABLE_TAGS: ReadonlySet<string> = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'colgroup',
  'col',
]);

/** Universal defaults — walkers can override but this is the shared starting point. */
export const DEFAULTS = Object.freeze({
  maxDepth: 16,
  maxNodes: 600,
  minSize: 4,
});

export interface ClassifyInput {
  /** The element being classified. */
  el: Element;
  /** Pre-read computed style; walkers pass theirs in so we don't double-read. */
  cs?: CSSStyleDeclaration;
  /** Does this element have any direct text content (non-whitespace)? */
  hasOwnText?: boolean;
  /** Does this element have element children? */
  hasChildren?: boolean;
}

export interface ClassifyResult {
  kind: Kind;
  tag: string;
}

/**
 * Decide the kind of treatment for an element.
 *
 * The ordering matters:
 *   1. Hint attributes always win (ignore > own > stop > block).
 *   2. Then tag-based (media before text-owner).
 *   3. Then content-based (empty text-owner → empty-text; else container
 *      vs text based on children).
 *
 * Walkers can take the returned kind at face value or layer additional
 * decisions on top (e.g. clone-mode checks painted-ness for container
 * elements, which this classifier doesn't do — it's not a painted/plain
 * decision at this level).
 */
export function classify(input: ClassifyInput): ClassifyResult {
  const { el } = input;
  const tag = el.tagName.toLowerCase();

  if (isIgnored(el)) return { kind: 'ignore', tag };
  if (isSelfSkeletonising(el)) return { kind: 'own', tag };
  if (isStopped(el)) return { kind: 'stop', tag };
  if (isForcedBlock(el)) return { kind: 'block', tag };

  if (MEDIA_TAGS.has(tag)) return { kind: 'media', tag };

  const textOwner = TEXT_TAGS.has(tag);
  const hasChildren = input.hasChildren ?? el.children.length > 0;
  const hasOwnText = input.hasOwnText ?? elementHasOwnText(el);

  if (textOwner && !hasChildren) {
    return { kind: hasOwnText ? 'text' : 'empty-text', tag };
  }
  if (!hasChildren && hasOwnText) {
    /* Non-text-owner leaf with its own text (e.g. a `<div>` with inline
     * text). Treat as text so the walker emits a line bar instead of a
     * generic block — matches how the real paint reads. */
    return { kind: 'text', tag };
  }
  if (!hasChildren) return { kind: 'block', tag };
  return { kind: 'container', tag };
}

/** True when the element's own child nodes include non-whitespace text. */
export function elementHasOwnText(el: Element): boolean {
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0) {
      return true;
    }
  }
  return false;
}

/** Check if `rect`'s shorter side crosses the minimum emit size. Walker guard. */
export function belowMinSize(rect: DOMRect, minSize: number): boolean {
  return rect.width < minSize || rect.height < minSize;
}
