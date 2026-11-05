/**
 * Debug overlay — port of `skullet/lib/debug.ts`.
 *
 * Attached to the page lazily: enabled via `?a-skel-debug=1` in the URL,
 * `localStorage['a-skel:debug'] === '1'`, `setDebug(true)` programmatically,
 * or `debug` prop on a specific `<ASkeleton>` (which sets the
 * `[data-a-skel-debug]` attribute on itself; descendants inherit via
 * `element.closest()`).
 *
 * The overlay renders in a shadow-DOM host attached to `document.body` so
 * it never collides with page CSS. One module-level `host` + rAF loop is
 * shared across every reveal on the page.
 *
 * Per-reveal state:
 *   - `loading` (blue dashed outline): the skeleton pane is up. `source`
 *     tags where the shape came from (prototype slot, default slot,
 *     cache, sample, data, fallback).
 *   - `shown` (green outline when `moved === {0,0}`, red when non-zero):
 *     the content pane mounted. `moved` reports the delta vs the final
 *     skeleton box so size-mismatch bugs are visible at a glance.
 *
 * X-ray toggle on the panel sets `[data-a-skel-xray]` on `<html>`;
 * engine CSS reveals the ghost through the bones so you can see what
 * was measured.
 */

import { ATTR_DEBUG, ATTR_XRAY } from './attrs';

export type DebugSource = 'data' | 'sample' | 'prototype' | 'default' | 'cache' | 'fallback';

interface Entry {
  state: 'loading' | 'shown';
  source?: DebugSource;
  moved?: { width: number; height: number };
}

const entries = new Map<Element, Entry>();
let enabled: boolean | undefined;
let host: HTMLElement | null = null;
let frame = 0;

function fromPage(): boolean {
  try {
    if (
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('a-skel-debug')
    ) {
      return true;
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('a-skel:debug') === '1') {
      return true;
    }
  } catch {
    /* localStorage can throw in sandboxed iframes — treat as "not enabled". */
  }
  return false;
}

/** Memoised: are we in debug mode anywhere on the page? */
export function everywhere(): boolean {
  if (enabled !== undefined) return enabled;
  enabled = typeof window !== 'undefined' && fromPage();
  return enabled;
}

/**
 * True when `el` (or any ancestor) should be in debug mode. The ancestor
 * walk means a `debug` prop on an `<ASkeleton>` turns on the overlay for
 * every descendant `<ASkeleton>` too.
 */
export function debugging(el?: Element | null): boolean {
  if (everywhere()) return true;
  if (!el || typeof el.closest !== 'function') return false;
  return !!el.closest(`[${ATTR_DEBUG}]`);
}

/** Programmatic toggle. Also triggers the panel to render / tear down. */
export function setDebug(on: boolean): void {
  enabled = on;
  if (on) start();
  else stop();
}

/** The reveal picked its shape source — tag it for the overlay. */
export function reportLoading(reveal: Element | null, source: DebugSource): void {
  if (!reveal || !debugging(reveal)) return;
  entries.set(reveal, { state: 'loading', source });
  show();
}

/** The content pane mounted — tag the delta vs the final skeleton box. */
export function reportReveal(
  reveal: Element | null,
  moved: { width: number; height: number }
): void {
  if (!reveal || !debugging(reveal)) return;
  const current = entries.get(reveal) ?? { state: 'loading' };
  entries.set(reveal, { ...current, state: 'shown', moved });
  show();
}

/** The reveal unmounted — drop its entry so the overlay stops tracking it. */
export function clearReveal(reveal: Element | null): void {
  if (!reveal) return;
  entries.delete(reveal);
  if (entries.size === 0 && !enabled) stop();
}

/* ─── Overlay DOM ───────────────────────────────────────────────────────── */

const PANEL_CSS = `
:host { all: initial; }
.box {
  position: fixed; box-sizing: border-box;
  border: 1px dashed; border-radius: 4px; pointer-events: none;
}
.label {
  position: absolute; left: -1px; bottom: 100%; margin-bottom: 2px;
  padding: 1px 6px; border-radius: 4px; white-space: nowrap;
  font: 500 11px/16px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fff;
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

function show(): void {
  start();
  if (frame) cancelAnimationFrame(frame);
  draw();
}

function start(): void {
  if (typeof document === 'undefined' || typeof document.body === 'undefined') return;
  if (!host?.isConnected) {
    host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${PANEL_CSS}</style><div class="boxes"></div>`;
    document.body.append(host);
  }
  const shadow = host.shadowRoot!;
  if (enabled && !shadow.querySelector('.panel')) {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `a-skel debug <label><input type="checkbox" class="xray"> x-ray</label>`;
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

function stop(): void {
  host?.shadowRoot?.querySelector('.panel')?.remove();
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.removeAttribute(ATTR_XRAY);
  }
  if ([...entries.keys()].some((el) => debugging(el))) return;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  host?.remove();
  host = null;
}

function describe({ state, source, moved }: Entry): { kind: string; text: string } {
  const from = source ? ` · ${source}` : '';
  if (state === 'loading') return { kind: 'loading', text: `skeleton${from}` };
  if (!moved || (moved.width === 0 && moved.height === 0)) {
    return { kind: 'still', text: `no movement${from}` };
  }
  return { kind: 'moved', text: `moved ${Math.round(moved.width)}×${Math.round(moved.height)}` };
}

function draw(): void {
  frame = 0;
  if (!host?.isConnected) return;
  const boxes = host.shadowRoot!.querySelector('.boxes')!;
  const children: HTMLElement[] = [];
  for (const [el, entry] of entries) {
    if (!el.isConnected) continue;
    const rect = (el as Element).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const { kind, text } = describe(entry);
    const box = document.createElement('div');
    box.className = `box ${kind}`;
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = text;
    box.append(label);
    children.push(box);
  }
  boxes.replaceChildren(...children);
  /* Follow scroll + layout changes without burning CPU when nothing's up. */
  if (entries.size > 0 || enabled) frame = requestAnimationFrame(draw);
}

/** Test-only: reset module state so each test starts clean. */
export function resetDebugForTest(): void {
  entries.clear();
  enabled = undefined;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  host?.remove();
  host = null;
}
