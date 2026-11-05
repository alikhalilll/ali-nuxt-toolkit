/**
 * `Memory` class — framework-agnostic lifecycle for the content pane.
 *
 * Covers the save path + dev-check path. The dev checks rely on
 * `takeLoadingSize` reading from the WeakMap populated by `Ghost`
 * (or `setLoadingSize` directly in tests), so we seed it to simulate
 * a reveal.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Memory } from '../src/engine/Memory';
import { setLoadingSize } from '../src/engine/loadingSize';
import { resetShapesForTest } from '../src/utils/shapes';
import { resetWarnedForTest } from '../src/utils/dev';
import { ATTR_REVEAL } from '../src/utils/attrs';

let active: Memory[] = [];

afterEach(() => {
  for (const m of active) m.destroy();
  active = [];
  resetShapesForTest();
  resetWarnedForTest();
  vi.restoreAllMocks();
});

function fixture(innerHTML = '<p>content</p>'): {
  reveal: HTMLElement;
  element: HTMLElement;
} {
  const reveal = document.createElement('div');
  reveal.setAttribute(ATTR_REVEAL, '');
  const element = document.createElement('div');
  element.innerHTML = innerHTML;
  /* Give the element some apparent height so Memory.save() doesn't bail
   * on `!offsetHeight` — happy-dom returns 0 by default. */
  Object.defineProperty(element, 'offsetHeight', { value: 100, configurable: true });
  Object.defineProperty(element, 'offsetWidth', { value: 200, configurable: true });
  Object.defineProperty(element, 'isConnected', { value: true, configurable: true });
  reveal.append(element);
  document.body.append(reveal);
  return { reveal, element };
}

describe('Memory', () => {
  it('saves the element outerHTML to the shape store on mount', async () => {
    const { element } = fixture('<p>hello world</p>');
    const m = new Memory(element, { id: 'memory-test-save' });
    active.push(m);
    const { recallShape } = await import('../src/utils/shapes');
    const saved = recallShape('memory-test-save');
    expect(saved).toContain('hello world');
  });

  it('is a no-op when no id is provided (nothing to key against)', async () => {
    const { element } = fixture();
    const m = new Memory(element);
    active.push(m);
    const { recallShape } = await import('../src/utils/shapes');
    expect(recallShape('')).toBeNull();
  });

  it('warns on missing sample when driven + no sample + data arrived', async () => {
    const { reveal, element } = fixture();
    /* Simulate the Ghost having set loadingSize with guessed=true. */
    setLoadingSize(reveal, {
      width: 200,
      height: 100,
      guessed: true,
      images: [],
    });
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new Memory(element, {
      id: 'missing-sample-key',
      data: { name: 'Alice' },
      rendered: true,
      sample: false,
    });
    active.push(m);
    /* The missing-sample warning fires synchronously during check(). */
    const callArgs = spy.mock.calls.map((c) => String(c[0] ?? ''));
    expect(callArgs.some((msg) => msg.includes('no `sample`'))).toBe(true);
  });

  it('does not warn when sample was passed', async () => {
    const { reveal, element } = fixture();
    setLoadingSize(reveal, {
      width: 200,
      height: 100,
      guessed: true,
      images: [],
    });
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new Memory(element, {
      id: 'no-missing-warning',
      data: { name: 'Alice' },
      rendered: true,
      sample: true,
    });
    active.push(m);
    const callArgs = spy.mock.calls.map((c) => String(c[0] ?? ''));
    expect(callArgs.some((msg) => msg.includes('no `sample`'))).toBe(false);
  });

  it('destroys cleanly', () => {
    const { element } = fixture();
    const m = new Memory(element, { id: 'destroy-test' });
    expect(() => m.destroy()).not.toThrow();
  });

  it('tolerates destroy being called twice', () => {
    const { element } = fixture();
    const m = new Memory(element, { id: 'destroy-twice' });
    m.destroy();
    expect(() => m.destroy()).not.toThrow();
  });
});
