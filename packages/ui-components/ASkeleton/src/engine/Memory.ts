/**
 * `Memory` — the content-pane lifecycle, as a framework-agnostic class.
 *
 * Faithful port of `/memory.ts`. The Vue adapter instantiates
 * one Memory per `<ASkeleton>` once content arrives; the Memory:
 *
 *   - Serialises the content's HTML into the shape store on mount (and
 *     on observed changes, 250 ms debounced).
 *   - Runs the dev-mode `check()` pass that compares the loaded content's
 *     final rect against the Ghost's `loadingSize`. Emits one-time
 *     `warnOnce` reports for:
 *       - `missing-sample:<key>` — rendered content with no `:sample`.
 *       - `unsized-image:<src>` — images that jumped after decode.
 *       - `size-mismatch:<key>` — overall layout jump on reveal.
 *   - Fires `reportReveal` into the debug overlay so the user sees the
 *     delta annotation on the moved outline.
 *
 * Framework-agnostic: a React / Svelte adapter wires the same class
 * into its content pane without reimplementing the dev checks.
 */

import { ATTR_REVEAL } from '../utils/attrs';
import { debugging, reportReveal } from '../utils/debug';
import { isDev, warnOnce } from '../utils/dev';
import { sampleFrom } from '../utils/sample';
import { rememberShape, trackShape } from '../utils/shapes';
import { takeLoadingSize } from './loadingSize';

export interface MemoryOptions {
  /** Stable key for the shape store. */
  id?: string;
  /** The data that produced the content — only used for the `sample` dev hint. */
  data?: unknown;
  /**
   * The content is rendered from `data` by a slot scope. When true AND
   * `sample` is false, dev mode logs a pastable `sample={…}` suggestion.
   */
  rendered?: boolean;
  /** True when the consumer passed a `:sample` prop. Silences the hint. */
  sample?: boolean;
}

const SAVE_DELAY = 250;

export class Memory {
  private key: string | null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private mutations: MutationObserver;
  private resize: ResizeObserver | null;
  private untrack: () => void;

  constructor(
    private element: HTMLElement,
    private options: MemoryOptions = {}
  ) {
    this.key = options.id ?? null;
    this.untrack = this.key ? trackShape(this.key, () => this.save()) : () => {};

    if (isDev || debugging(element)) this.check();
    this.save();

    this.mutations = new MutationObserver(this.schedule);
    this.mutations.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(this.schedule);
    this.resize?.observe(element);
    element.addEventListener('load', this.schedule, true);
  }

  /** rAF-debounced re-save on observed changes. */
  private schedule = (): void => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.save(), SAVE_DELAY);
  };

  /** Serialise the current content and write it into the shape store. */
  save(): void {
    if (this.timer) clearTimeout(this.timer);
    if (!this.key) return;
    if (!this.element.isConnected || !this.element.offsetHeight) return;
    /* No `snapshot/serialize.ts` yet (Phase R11) — store the raw outerHTML
     * for now. Phase R11's `serialize(root, true)` will slot in here. */
    rememberShape(this.key, this.element.outerHTML);
  }

  /** Dev-mode: compare the content's final rect against the Ghost's loadingSize. */
  private check(): void {
    const { data, id, rendered, sample } = this.options;
    const name = id ? `<ASkeleton id="${id}">` : '<ASkeleton>';

    const reveal = this.element.closest(`[${ATTR_REVEAL}]`);
    const before = takeLoadingSize(reveal);
    if (!before) return; /* No skeleton was shown, so nothing jumped. */

    /* Missing-sample hint — fires once per key. */
    if (before.guessed && rendered && !sample && data != null) {
      try {
        warnOnce(
          `missing-sample:${this.key ?? 'anonymous'}`,
          `${name} has no \`sample\`, so a first load guesses its shape${id ? '' : " and it can't be remembered"}. Pass this to make it exact:\n  :sample="${JSON.stringify(sampleFrom(data))}"`
        );
      } catch {
        /* JSON.stringify can throw on circular refs — not actionable here. */
      }
    }

    /* Wait for any still-loading images to settle before comparing boxes.
     * Images with `complete === false` would otherwise register as 0×0 and
     * the mismatch warning would always fire. */
    const pending = Array.from(this.element.querySelectorAll('img')).filter(
      (img) => !(img as HTMLImageElement).complete
    );
    const settled: Promise<void> = Promise.all(
      pending.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
      )
    ).then(() => undefined);

    void settled.then(() => {
      if (!this.element.isConnected) return;
      const width = this.element.offsetWidth;
      const height = this.element.offsetHeight;
      reportReveal(reveal, {
        width: width - before.width,
        height: height - before.height,
      });
      /* ≤1 px delta reads as "no jump" — floating point rounding noise. */
      if (Math.abs(width - before.width) <= 1 && Math.abs(height - before.height) <= 1) {
        return;
      }
      /* Unsized-image check — the layout jump might be entirely explained
       * by an `<img>` that had zero height in the skeleton. */
      const unsized = Array.from(this.element.querySelectorAll('img'))
        .filter(
          (img, i) =>
            (before.images[i] ?? 0) < 1 &&
            (img as HTMLImageElement).getBoundingClientRect().height >= 1
        )
        .map((img) => {
          const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src;
          return src.split('/').pop() || 'an image';
        });
      if (unsized.length) {
        warnOnce(
          `unsized-image:${this.key ?? 'anonymous'}`,
          `${name}'s skeleton had no room for ${unsized.length === 1 ? 'an image' : `${unsized.length} images`} (${unsized.slice(0, 3).join(', ')}${unsized.length > 3 ? ', …' : ''}), so the layout jumped when they loaded. Give each \`width\` and \`height\` attributes, or an \`aspect-ratio\`, so its space is known before it loads.`
        );
        return;
      }
      /* General size-mismatch warning. */
      warnOnce(
        `size-mismatch:${this.key ?? 'anonymous'}`,
        before.guessed
          ? `${name}'s skeleton was ${before.width}×${before.height}px but its content is ${width}×${height}px, so the layout jumped on reveal. ${rendered ? 'Pass `:sample` data shaped like the real thing' : 'Pass an `id` so its shape is remembered'}, and give images a size.`
          : `${name}'s skeleton was drawn from the data on screen (${before.width}×${before.height}px), but the new data is ${width}×${height}px.`
      );
    });
  }

  destroy(): void {
    this.save();
    if (this.timer) clearTimeout(this.timer);
    this.mutations.disconnect();
    this.resize?.disconnect();
    this.element.removeEventListener('load', this.schedule, true);
    this.untrack();
  }
}
