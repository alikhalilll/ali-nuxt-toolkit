import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnedForTest } from '../src/utils/dev';
import { warnMissingSample, warnSizeMismatch, warnUnsizedImage } from '../src/utils/warnings';

afterEach(() => {
  resetWarnedForTest();
  vi.restoreAllMocks();
});

describe('warnMissingSample', () => {
  it('logs a `sample=…` suggestion generated from the data', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnMissingSample('card', { name: 'Alice', age: 30 });
    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('card');
    expect(msg).toContain('Xxxxx');
    expect(msg).toContain('30');
  });

  it('dedups the same cache key within a session', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnMissingSample('card', { name: 'Alice' });
    warnMissingSample('card', { name: 'Bob' });
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('warnSizeMismatch', () => {
  it('stays silent when the skeleton and content match within 10%', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnSizeMismatch('card', { width: 100, height: 100 }, { width: 105, height: 108 });
    expect(spy).not.toHaveBeenCalled();
  });

  it('warns when the delta is >10%', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnSizeMismatch('card', { width: 100, height: 100 }, { width: 200, height: 100 });
    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('100×100');
    expect(msg).toContain('200×100');
  });
});

describe('warnUnsizedImage', () => {
  it('logs once per src', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnUnsizedImage('/a.png');
    warnUnsizedImage('/a.png');
    warnUnsizedImage('/b.png');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
