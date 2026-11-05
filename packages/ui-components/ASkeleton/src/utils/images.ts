/**
 * Per-image load tracking — port of `skullet/lib/images.ts:1-30`.
 *
 * The reveal applier (`src/reveal/apply.ts`) uses these to keep individual
 * `<img>` stand-in bones shimmering until each image's decode settles.
 * Without this, late-decoding images pop into the loaded pane after the
 * skeleton has already faded out — the user sees a flash of the loaded
 * layout with a missing image, then the image slams in.
 *
 * `IMAGE_TIMEOUT` is the ceiling — a stalled image request can't hold the
 * reveal forever. 10 s matches skullet.
 */

export const IMAGE_TIMEOUT = 10_000;

const noop = () => {};

/**
 * Images considered "pending" for the purpose of holding stand-in bones.
 * An image is pending if it hasn't completed AND isn't a lazy-loaded image
 * that's currently off-screen (those won't start loading until the user
 * scrolls, so blocking the reveal on them would stall forever).
 */
export function pendingImages(root: Element): HTMLImageElement[] {
  const result: HTMLImageElement[] = [];
  const list = root.querySelectorAll('img');
  for (let i = 0; i < list.length; i++) {
    const img = list[i] as HTMLImageElement;
    if (img.complete) continue;
    if (isDeferred(img)) continue;
    result.push(img);
  }
  return result;
}

function isDeferred(img: HTMLImageElement): boolean {
  if (img.loading !== 'lazy') return false;
  const rect = img.getBoundingClientRect();
  const vh = typeof window !== 'undefined' ? window.innerHeight || 0 : 0;
  if (vh === 0) return false;
  /* Lazy-load target well above the viewport (never entered yet) OR well
   * below (user would need to scroll to force load) — the browser won't
   * start fetching so we can't wait on it. */
  return rect.bottom < -vh || rect.top > vh * 2;
}

/**
 * Resolves when the image is paint-ready, OR when `IMAGE_TIMEOUT` elapses,
 * whichever comes first. Decode errors + load errors both resolve (not
 * reject): a broken image shouldn't crash the reveal animation.
 */
export function imageReady(img: HTMLImageElement): Promise<void> {
  const loaded: Promise<void> = img.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });

  const decoded: Promise<void> = loaded.then(() => {
    const decode = (img as unknown as { decode?: () => Promise<void> }).decode;
    if (typeof decode === 'function') return decode.call(img).then(noop, noop);
    return undefined;
  }, noop);

  const timed: Promise<void> = new Promise<void>((resolve) => {
    setTimeout(resolve, IMAGE_TIMEOUT);
  });

  return Promise.race([decoded, timed]);
}
