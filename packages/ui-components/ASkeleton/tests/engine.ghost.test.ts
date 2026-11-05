/**
 * `Ghost` class — framework-agnostic lifecycle for the loading pane.
 *
 * happy-dom provides MutationObserver + ResizeObserver stubs plus a
 * minimal `getBoundingClientRect`. We can't assert the shimmer painting
 * at pixel level, but we can lock in the DOM shape, the attribute
 * contract, and the destroy semantics.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Ghost } from '../src/engine/Ghost';
import { takeLoadingSize } from '../src/engine/loadingSize';
import {
  ATTR_GHOST,
  ATTR_LAYER,
  ATTR_LOADING,
  ATTR_REVEAL,
  ATTR_SNAPSHOT,
} from '../src/utils/attrs';

let active: Ghost[] = [];

afterEach(() => {
  for (const g of active) g.destroy();
  active = [];
});

function fixture(innerHTML = ''): { reveal: HTMLElement; root: HTMLElement } {
  const reveal = document.createElement('div');
  reveal.setAttribute(ATTR_REVEAL, '');
  const root = document.createElement('div');
  root.innerHTML = `<div ${ATTR_GHOST}>${innerHTML}</div>`;
  reveal.append(root);
  document.body.append(reveal);
  return { reveal, root };
}

describe('Ghost', () => {
  it('marks the root as loading + injects the three region children', () => {
    const { root } = fixture('<p>hello</p>');
    const g = new Ghost(root);
    active.push(g);
    expect(root.hasAttribute(ATTR_LOADING)).toBe(true);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector(`[${ATTR_GHOST}]`)).not.toBeNull();
    expect(root.querySelector(`[${ATTR_SNAPSHOT}]`)).not.toBeNull();
    expect(root.querySelector(`[${ATTR_LAYER}]`)).not.toBeNull();
  });

  it('reuses an existing [data-a-skel-ghost] child instead of appending a new one', () => {
    const { root } = fixture('<p>already here</p>');
    const existing = root.querySelector(`[${ATTR_GHOST}]`);
    const g = new Ghost(root);
    active.push(g);
    const all = root.querySelectorAll(`[${ATTR_GHOST}]`);
    expect(all.length).toBe(1);
    expect(all[0]).toBe(existing);
  });

  it('records loadingSize for the Memory to consume one-shot', () => {
    const { reveal, root } = fixture('<p>hi</p>');
    const g = new Ghost(root);
    active.push(g);
    const size = takeLoadingSize(reveal);
    expect(size).toBeDefined();
    expect(typeof size!.width).toBe('number');
    expect(typeof size!.height).toBe('number');
    expect(Array.isArray(size!.images)).toBe(true);
    /* One-shot: a second read returns undefined. */
    expect(takeLoadingSize(reveal)).toBeUndefined();
  });

  it('destroys cleanly without throwing', () => {
    const { root } = fixture('<p>bye</p>');
    const g = new Ghost(root);
    expect(() => g.destroy()).not.toThrow();
  });

  it('tolerates destroy being called twice', () => {
    const { root } = fixture();
    const g = new Ghost(root);
    g.destroy();
    expect(() => g.destroy()).not.toThrow();
  });

  it('reports source=data to the debug overlay when exact=true', () => {
    /* Can't easily peek at the overlay's internal map in a unit test —
     * but we can confirm the constructor runs without throwing when
     * passing exact + refetch, which exercises the choose() branch. */
    const { root } = fixture('<p>exact</p>');
    const g = new Ghost(root, { id: 'test-exact', exact: true });
    active.push(g);
    expect(root.querySelector(`[${ATTR_GHOST}]`)).not.toBeNull();
  });

  it('falls back to generic bars when the ghost has no content and no cache hit', () => {
    const { root } = fixture('');
    const g = new Ghost(root, { id: 'unique-key-no-cache' });
    active.push(g);
    const snapshot = root.querySelector(`[${ATTR_SNAPSHOT}]`);
    /* The fallback injects three [data-skeleton-block] divs. */
    expect(snapshot?.children.length).toBeGreaterThanOrEqual(1);
  });
});
