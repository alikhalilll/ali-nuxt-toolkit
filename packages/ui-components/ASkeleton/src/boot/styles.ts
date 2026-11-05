/**
 * Stylesheet injection with ref counting — port of `/styles.ts`.
 *
 * Each `<ASkeleton>` increments the ref count on mount; the stylesheet is
 * injected on the first mount and removed when the last unmounts. The
 * `--ak-skel: 1` detection check short-circuits the inject when a
 * stylesheet is already on the page (via a bundler import of
 * `@alikhalilll/a-skeleton/styles.css`, or a prior SSR render).
 *
 * The stylesheet itself is minimal — just the scoped-selector rules that
 * hide the ghost's paint while keeping its layout. The decorative tokens
 * (`--ak-skel-base`, etc.) live in `styles.src.css` and are included by
 * the package's bundled stylesheet.
 */

const STYLE_ATTR = 'data-a-skel-styles';

/* The scoped CSS that hides the ghost's paint. Applied in both JS-only
 * and server-rendered contexts. See the the upstream library reference at
 * `the upstream library/styles.ts:23-138` for the complete selector logic. */
const SCOPED_CSS = `
[data-a-skel-loading] { position: relative; pointer-events: none; user-select: none; }
[data-a-skel-loading] [data-a-skel-ghost] { visibility: hidden; }
[data-a-skel-loading] [data-a-skel-ghost] * { color: transparent !important; text-shadow: none !important; }
[data-a-skel-loading] [data-a-skel-ghost] *::placeholder { color: transparent !important; }
[data-a-skel-loading] [data-a-skel-layer] {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
}
[data-a-skel-exiting] { position: absolute; pointer-events: none; }
/* X-ray mode — reveals the ghost through the bones in magenta. */
[data-a-skel-xray] [data-a-skel-ghost] { visibility: visible !important; }
[data-a-skel-xray] [data-a-skel-ghost] * { color: rgb(255 0 80 / 0.7) !important; }
/* --ak-skel detection flag for ref-counted injection short-circuit. */
:root { --ak-skel: 1; }
`;

let refCount = 0;
let injected: HTMLStyleElement | null = null;

function alreadyPresent(): boolean {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return false;
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--ak-skel').trim();
    return value === '1';
  } catch {
    return false;
  }
}

/** Increment the ref count; inject the sheet on the first mount. */
export function addStyles(): void {
  refCount++;
  if (injected || typeof document === 'undefined') return;
  if (alreadyPresent()) return;
  const style = document.createElement('style');
  style.setAttribute(STYLE_ATTR, '');
  style.textContent = SCOPED_CSS;
  document.head.append(style);
  injected = style;
}

/** Decrement the ref count; remove the sheet when the last mount unmounts. */
export function removeStyles(): void {
  if (refCount > 0) refCount--;
  if (refCount > 0) return;
  if (injected) {
    injected.remove();
    injected = null;
  }
}

/** Return the SSR-safe HTML for the stylesheet. Server-render helper. */
export function stylesHtml(nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<style ${STYLE_ATTR}${nonceAttr}>${SCOPED_CSS}</style>`;
}

/** Test-only. */
export function resetStylesForTest(): void {
  refCount = 0;
  injected?.remove();
  injected = null;
}
