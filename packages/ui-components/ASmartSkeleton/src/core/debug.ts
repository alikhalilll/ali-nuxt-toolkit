import { ATTR_DEBUG, ATTR_XRAY } from './constants';

type Entry = {
  state: 'loading' | 'shown';
  source?: string;
  moved?: { width: number; height: number };
};

const entries = new Map<Element, Entry>();
let enabled: boolean | undefined;
let host: HTMLElement | null = null;
let frame = 0;

function fromPage() {
  try {
    return (
      new URLSearchParams(location.search).has('ask-debug') ||
      localStorage.getItem('a-smart-skeleton:debug') === '1'
    );
  } catch {
    return false;
  }
}

// Detection uses `globalThis.window` (a property access) rather than
// `typeof window !== 'undefined'`. The `typeof` form minifies to
// `typeof window<"u"`, which Nitro's SSR pipeline then constant-folds to
// `"undefined"<"u"` inside the embedded `INLINE_SCRIPT` string literal —
// producing an unescaped `"undefined"` that breaks the outer double-quoted
// string when consumers re-bundle for the server. `globalThis.window` has
// identical semantics (truthy in a browser, undefined in Node / SSR) but
// Nitro's typeof-fold doesn't match the pattern, so the string survives.
const everywhere = () => (enabled ??= globalThis.window !== undefined && fromPage());

/** On with `?ask-debug`, `a-smart-skeleton:debug` = "1" in localStorage or `setDebug(true)`; for `element`, also inside `[ask-debug]`. */
export const debugging = (element?: Element | null) =>
  everywhere() || !!element?.closest(`[${ATTR_DEBUG}]`);

export function setDebug(on: boolean) {
  enabled = on;
  if (on) start();
  else stop();
}

/**
 * Logs each element the measure walker visits with its DOM path, class list,
 * computed padding/border, and bounding rect. Useful for diagnosing cases
 * where a parent passed presumed-padding classes to a Vue component but the
 * child's measured box doesn't show them — the trace reveals whether the
 * class is on the DOM at all (fallthrough worked, UnoCSS didn't emit, etc.)
 * or whether the DOM really is padded and something else is wrong.
 *
 * Enable by passing `?ask-debug` in the URL, `setDebug(true)`, or wrapping
 * any ancestor in `[ask-debug]` — same gates as the visual debug overlay.
 */
const EMPTY_PADDING = /^(0px|0)(\s+(0px|0)){0,3}$/;
export function traceMeasurement(
  element: Element,
  style: CSSStyleDeclaration,
  rect: { width: number; height: number }
) {
  if (!debugging(element)) return;
  const tag = element.tagName.toLowerCase();
  const className = (element.getAttribute('class') ?? '').trim();
  const padding = [
    style.paddingTop,
    style.paddingRight,
    style.paddingBottom,
    style.paddingLeft,
  ].join(' ');
  const warn =
    EMPTY_PADDING.test(padding) && hasChildrenWithContent(element) ? ' · ⚠ 0-padding' : '';
  // eslint-disable-next-line no-console
  console.debug(
    `[a-smart-skeleton] <${tag}> ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}  padding:${padding}${warn}`,
    { class: className || '(none)', element }
  );
}

function hasChildrenWithContent(element: Element): boolean {
  for (const child of element.children) {
    if (child.textContent?.trim() || child.children.length > 0) return true;
  }
  return false;
}

export function reportLoading(reveal: Element | null, source: string) {
  if (!reveal || !debugging(reveal)) return;
  entries.set(reveal, { state: 'loading', source });
  show();
}

export function reportReveal(reveal: Element | null, moved: { width: number; height: number }) {
  if (!reveal || !debugging(reveal)) return;
  entries.set(reveal, { ...entries.get(reveal), state: 'shown', moved });
  show();
}

// Drawn at once, not on the next frame: a throttled page, like a test's iframe, may wait long for one
function show() {
  start();
  cancelAnimationFrame(frame);
  draw();
}

const PANEL_CSS = `
:host { all: initial; }
.box { position: fixed; box-sizing: border-box; border: 1px dashed; border-radius: 4px; }
.label {
  position: absolute; left: -1px; bottom: 100%; margin-bottom: 2px;
  padding: 1px 6px; border-radius: 4px; white-space: nowrap;
  font: 500 11px/16px ui-monospace, SFMono-Regular, Menlo, monospace; color: #fff;
}
.loading { border-color: #3b82f6; } .loading .label { background: #3b82f6; }
.still { border-color: #22c55e; } .still .label { background: #16a34a; }
.moved { border-color: #ef4444; border-style: solid; } .moved .label { background: #dc2626; }
.panel {
  position: fixed; right: 12px; bottom: 12px; display: flex; gap: 8px; align-items: center;
  padding: 6px 10px; border-radius: 8px; background: #111; color: #fff; pointer-events: auto;
  font: 500 12px/16px ui-sans-serif, system-ui, sans-serif; box-shadow: 0 4px 16px rgb(0 0 0 / 0.3);
}
.panel label { display: flex; gap: 4px; align-items: center; cursor: pointer; }
`;

function start() {
  if (typeof document === 'undefined') return;
  if (!host?.isConnected) {
    host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${PANEL_CSS}</style><div class="boxes"></div>`;
    document.body.append(host);
  }
  // The panel, and its x-ray toggle, are for the whole page only
  const shadow = host.shadowRoot!;
  if (enabled && !shadow.querySelector('.panel')) {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `a-smart-skeleton debug <label><input type="checkbox" class="xray"> x-ray</label>`;
    panel.querySelector('.xray')!.addEventListener('change', (event) => {
      document.documentElement.toggleAttribute(
        ATTR_XRAY,
        (event.target as HTMLInputElement).checked
      );
    });
    shadow.append(panel);
  }
  if (!frame) frame = requestAnimationFrame(draw);
}

function stop() {
  host?.shadowRoot?.querySelector('.panel')?.remove();
  document.documentElement.removeAttribute(ATTR_XRAY);
  if ([...entries.keys()].some((reveal) => debugging(reveal))) return;
  cancelAnimationFrame(frame);
  frame = 0;
  host?.remove();
  host = null;
}

const describe = ({ state, source, moved }: Entry) => {
  const from = source ? ` · ${source}` : '';
  if (state === 'loading') return { kind: 'loading', text: `skeleton${from}` };
  if (!moved || (moved.width === 0 && moved.height === 0)) {
    return { kind: 'still', text: `✓ no movement${from}` };
  }
  return {
    kind: 'moved',
    text: `✗ moved ${moved.width}×${moved.height}px${from}`,
  };
};

// Follows every tracked reveal each frame, so scrolling and layout never leave a box behind
function draw() {
  frame = 0;
  if (!host?.shadowRoot) return;
  const boxes = host.shadowRoot.querySelector('.boxes')!;

  for (const reveal of entries.keys()) {
    if (!reveal.isConnected || !debugging(reveal)) entries.delete(reveal);
  }

  const items = [...entries];
  while (boxes.children.length > items.length) boxes.lastElementChild!.remove();
  items.forEach(([reveal, entry], index) => {
    let box = boxes.children[index] as HTMLElement | undefined;
    if (!box) {
      box = boxes.appendChild(document.createElement('div'));
      box.innerHTML = `<span class="label"></span>`;
    }
    const rect = reveal.getBoundingClientRect();
    const { kind, text } = describe(entry);
    box.className = `box ${kind}`;
    Object.assign(box.style, {
      left: `${rect.left - 2}px`,
      top: `${rect.top - 2}px`,
      width: `${rect.width + 4}px`,
      height: `${rect.height + 4}px`,
    });
    box.firstElementChild!.textContent = text;
  });

  if (enabled || entries.size) frame = requestAnimationFrame(draw);
}
