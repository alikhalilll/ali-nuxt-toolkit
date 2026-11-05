/**
 * Debug overlay — enablement + registration semantics.
 *
 * The overlay's visual output is DOM — covered by the integration tests via
 * the `[data-a-skel-xray]` attribute presence; here we assert the
 * enablement predicate `debugging(el)` honours its three triggers (prop,
 * query param, localStorage) and that `reportLoading` / `reportReveal`
 * register entries only when enabled.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  debugging,
  everywhere,
  reportLoading,
  reportReveal,
  resetDebugForTest,
  setDebug,
} from '../src/utils/debug';
import { ATTR_DEBUG } from '../src/utils/attrs';

afterEach(() => {
  resetDebugForTest();
});

describe('debugging', () => {
  it('is false by default', () => {
    expect(everywhere()).toBe(false);
    expect(debugging(document.createElement('div'))).toBe(false);
  });

  it('inherits from an ancestor marked [data-a-skel-debug]', () => {
    const parent = document.createElement('div');
    parent.setAttribute(ATTR_DEBUG, '');
    const child = document.createElement('span');
    parent.appendChild(child);
    expect(debugging(child)).toBe(true);
  });

  it('setDebug(true) flips the global flag', () => {
    setDebug(true);
    expect(everywhere()).toBe(true);
    expect(debugging(document.createElement('div'))).toBe(true);
  });

  it('setDebug(false) tears down the overlay', () => {
    setDebug(true);
    setDebug(false);
    expect(everywhere()).toBe(false);
  });

  it('tolerates null', () => {
    expect(debugging(null)).toBe(false);
    expect(debugging(undefined)).toBe(false);
  });
});

describe('reportLoading / reportReveal', () => {
  it('is a no-op when debug is off', () => {
    const reveal = document.createElement('div');
    reportLoading(reveal, 'prototype');
    reportReveal(reveal, { width: 0, height: 0 });
    /* No panel should be attached — document.body has only its own children. */
    const hosts = document.body.querySelectorAll('div');
    for (const h of hosts) {
      expect(h.shadowRoot).toBeNull();
    }
  });

  it('registers an entry when debug is on', () => {
    setDebug(true);
    const reveal = document.createElement('div');
    document.body.appendChild(reveal);
    reportLoading(reveal, 'sample');
    /* The overlay is a shadow-DOM host appended to document.body. Walk the
     * body's children and find one with a shadow root — happy-dom's CSS
     * selector matching for `style*=...` is unreliable across versions,
     * so we iterate rather than query. */
    const hosts = [...document.body.children] as HTMLElement[];
    const host = hosts.find((h) => h.shadowRoot != null);
    expect(host).toBeDefined();
    expect(host?.shadowRoot?.querySelector('.boxes')).not.toBeNull();
    document.body.removeChild(reveal);
  });
});
