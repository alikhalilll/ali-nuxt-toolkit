/**
 * `Ghost` — the loading-pane lifecycle, as a framework-agnostic class.
 *
 * Faithful port of `/ghost.ts`. The Vue adapter
 * (`ASkeletonBones.vue`) instantiates one Ghost per `<ASkeleton>` while
 * loading; the Ghost owns:
 *
 *   - The three internal regions: `[data-a-skel-ghost]`,
 *     `[data-a-skel-snapshot]`, `[data-a-skel-layer]`.
 *   - A MutationObserver + ResizeObserver that re-measures on content
 *     changes (rAF-debounced).
 *   - The shape-source waterfall (`choose()`): current content → recall
 *     from `localStorage` → generic three-bar fallback.
 *   - The `measureSkeleton` + `drawSkeleton` call chain on every tick.
 *   - The hand-off to `Memory` via `setLoadingSize()` so the dev-mode
 *     size-mismatch warning has a baseline to compare against.
 *
 * The class is framework-agnostic by design — the Vue adapter wraps it
 * in a tiny component but could be swapped for a React / Svelte /
 * vanilla adapter without touching the Ghost itself.
 */

import {
  ATTR_COVERED,
  ATTR_EXITING,
  ATTR_GHOST,
  ATTR_LAYER,
  ATTR_LOADING,
  ATTR_REVEAL,
  ATTR_SNAPSHOT,
} from '../utils/attrs';
import { reportLoading, type DebugSource } from '../utils/debug';
import { warnOnce } from '../utils/dev';
import { noteSkeleton } from '../reveal/plan';
import { measureSkeleton } from '../measure/measure';
import { recallShape } from '../utils/shapes';
import { drawSkeleton } from '../measure/shimmer';
import { addStyles, removeStyles } from '../boot/styles';
import { setLoadingSize } from './loadingSize';

export interface GhostOptions {
  /** Stable key used by shape persistence + size-mismatch warnings. */
  id?: string;
  /**
   * The ghost was rendered from real data (not a sample), so a
   * remembered shape should NOT override it.
   */
  exact?: boolean;
  /**
   * The reveal already had data on screen when loading flipped on
   * (a refetch) — plan the reveal animation accordingly.
   */
  refetch?: boolean;
}

type Source = 'ghost' | 'recall' | 'fallback';

/* Three bars with decreasing widths — matches `the upstream library/ghost.ts:34-39`.
 * Used when nothing else is available (no data, no sample, no cached shape). */
const FALLBACK_HTML = [100, 90, 60]
  .map(
    (w) =>
      `<div data-skeleton-block style="width:${w}%;height:0.75em;margin:0.5em 0;border-radius:0.25em"></div>`
  )
  .join('');

const SERVER_RENDERED = new WeakSet<Element>(
  typeof document === 'undefined' ? [] : document.querySelectorAll(`[${ATTR_LOADING}]`)
);

function ensureChild(root: HTMLElement, attr: string): HTMLElement {
  for (const el of Array.from(root.children)) {
    if ((el as HTMLElement).hasAttribute(attr)) return el as HTMLElement;
  }
  const el = document.createElement('div');
  el.setAttribute(attr, '');
  root.append(el);
  return el;
}

function hasContent(el: Element): boolean {
  return !!el.firstElementChild || !!el.textContent?.trim();
}

export class Ghost {
  private ghost: HTMLElement;
  private snapshot: HTMLElement;
  private layer: HTMLElement;
  private source: Source | null = null;
  private hadContent = false;
  private frame = 0;
  private mutations: MutationObserver;
  private resize: ResizeObserver | null;

  constructor(
    private root: HTMLElement,
    private options: GhostOptions = {}
  ) {
    addStyles();
    root.setAttribute(ATTR_LOADING, '');
    root.setAttribute('aria-hidden', 'true');
    (root as unknown as { inert: boolean }).inert = true;

    this.ghost = ensureChild(root, ATTR_GHOST);
    this.snapshot = ensureChild(root, ATTR_SNAPSHOT);
    this.layer = ensureChild(root, ATTR_LAYER);

    this.hadContent = hasContent(this.ghost);

    const reveal = root.closest(`[${ATTR_REVEAL}]`);
    if (reveal) {
      noteSkeleton(reveal, {
        served: SERVER_RENDERED.has(root),
        refetch: !!options.refetch && this.hadContent,
      });
    }

    this.choose();
    this.measure();

    this.mutations = new MutationObserver(this.schedule);
    this.mutations.observe(this.ghost, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    this.resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(this.schedule);
    this.resize?.observe(root);
    root.addEventListener('load', this.schedule, true);
    if (typeof window !== 'undefined') {
      addEventListener('resize', this.schedule);
      (document.fonts as unknown as { ready?: Promise<unknown> })?.ready?.then(this.schedule);
    }
  }

  /**
   * Re-measure on any observed change. rAF-debounced so a drag-resize
   * fires once per frame, not per observer invocation. Short-circuits
   * while the pane is exiting — re-measuring then would redraw what's
   * fading out and the user would see a double-draw.
   */
  private schedule = (): void => {
    if (this.root.closest(`[${ATTR_EXITING}]`)) return;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const has = hasContent(this.ghost);
      if (has !== this.hadContent) {
        this.hadContent = has;
        this.choose();
      }
      this.measure();
    });
  };

  /**
   * The shape-source waterfall:
   *
   *   1. If we have `exact` data OR were server-rendered → use the ghost
   *      (don't re-shape a skeleton that's already paint-correct).
   *   2. Else if the ghost's subtree contains `[data-a-skel-own]` → use the
   *      ghost (that subtree is self-skeletonising; don't descend).
   *   3. Else if we have an `id` AND localStorage has a shape under it →
   *      restore the shape into `[data-a-skel-snapshot]`.
   *   4. Else if the ghost has any content → use the ghost.
   *   5. Else → fall back to three generic bars.
   *
   * Matches `the upstream library/ghost.ts:151-201` modulo our not-yet-ported
   * `autoKey` (so the recall path only fires when `id` is explicit).
   */
  private choose(): void {
    let next: Source = 'fallback';
    let html: string | null = null;

    const settled = this.options.exact || SERVER_RENDERED.has(this.root);
    const own = !!this.ghost.querySelector('[data-skeleton-own], .a-skel-own');

    if ((settled || own) && this.hadContent) {
      next = 'ghost';
    } else {
      if (this.options.id) {
        html = recallShape(this.options.id);
      }
      if (html) next = 'recall';
      else if (this.hadContent) next = 'ghost';
    }

    if (next !== this.source) {
      if (next === 'recall' && html) {
        /* Parse the recalled HTML into the snapshot pane. */
        const template = document.createElement('template');
        template.innerHTML = html;
        this.snapshot.replaceChildren(template.content);
      } else if (next === 'fallback') {
        this.snapshot.innerHTML = FALLBACK_HTML;
        warnOnce(
          `fallback:${this.options.id ?? 'anonymous'}`,
          `Nothing to draw a skeleton from${this.options.id ? ` for "${this.options.id}"` : ''}. Pass \`sample\` data, or an \`id\` so its shape is remembered after the first load.`
        );
      } else {
        this.snapshot.replaceChildren();
      }
    }

    /* Mark the inactive pane so CSS can hide it without extra selectors. */
    this.ghost.toggleAttribute(ATTR_COVERED, next !== 'ghost');
    this.snapshot.toggleAttribute(ATTR_COVERED, next === 'ghost');
    this.source = next;

    const reveal = this.root.closest(`[${ATTR_REVEAL}]`);
    if (reveal) {
      const label: DebugSource =
        next === 'recall'
          ? 'cache'
          : next === 'fallback'
            ? 'fallback'
            : this.options.exact
              ? 'data'
              : SERVER_RENDERED.has(this.root)
                ? 'default'
                : 'sample';
      reportLoading(reveal, label);
    }
  }

  /** Run the measurement + draw pass. */
  private measure(): void {
    const active = this.source === 'ghost' ? this.ghost : this.snapshot;
    const rects = measureSkeleton(active, this.layer);
    drawSkeleton(this.layer, rects);

    const reveal = this.root.closest(`[${ATTR_REVEAL}]`);
    if (reveal) {
      setLoadingSize(reveal, {
        width: this.root.offsetWidth,
        height: this.root.offsetHeight,
        guessed: !(this.options.exact && this.source === 'ghost'),
        images: Array.from(active.querySelectorAll('img')).map(
          (img) => (img as HTMLImageElement).getBoundingClientRect().height
        ),
      });
    }
  }

  /** Tear down observers + style ref count. Bones keep painting until Vue removes the layer. */
  destroy(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.mutations.disconnect();
    this.resize?.disconnect();
    this.root.removeEventListener('load', this.schedule, true);
    if (typeof window !== 'undefined') removeEventListener('resize', this.schedule);
    removeStyles();
  }
}
