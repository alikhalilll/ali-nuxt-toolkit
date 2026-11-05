import { describe, expect, it } from 'vitest';
import { resolveState } from '../src/utils/resolveState';

describe('resolveState', () => {
  it('returns skeleton when loading is explicitly true', () => {
    expect(resolveState({ loading: true })).toBe('skeleton');
    expect(resolveState({ loading: true, data: { x: 1 }, driven: true })).toBe('skeleton');
    expect(resolveState({ loading: true, error: new Error('x') })).toBe('skeleton');
  });

  it('returns error when error is non-null, outside of forced loading', () => {
    expect(resolveState({ error: new Error('x') })).toBe('error');
    expect(resolveState({ error: 'oops', empty: true })).toBe('error');
    expect(resolveState({ error: null })).not.toBe('error');
  });

  it('returns empty when empty is true, outside of error / forced loading', () => {
    expect(resolveState({ empty: true })).toBe('empty');
    expect(resolveState({ empty: true, driven: true, data: null })).toBe('empty');
  });

  it('returns skeleton when data-driven and data is nullish', () => {
    expect(resolveState({ driven: true, data: null })).toBe('skeleton');
    expect(resolveState({ driven: true, data: undefined })).toBe('skeleton');
  });

  it('returns content when data-driven and data is set', () => {
    expect(resolveState({ driven: true, data: { x: 1 } })).toBe('content');
    expect(resolveState({ driven: true, data: 0 })).toBe('content');
    expect(resolveState({ driven: true, data: '' })).toBe('content');
  });

  it('returns content when not driven and no loading flag', () => {
    expect(resolveState({})).toBe('content');
    expect(resolveState({ loading: false })).toBe('content');
  });

  it('respects priority: loading > error > empty > data-null > content', () => {
    expect(resolveState({ loading: true, error: 'x', empty: true, driven: true, data: null })).toBe(
      'skeleton'
    );
    expect(resolveState({ error: 'x', empty: true, driven: true, data: null })).toBe('error');
    expect(resolveState({ empty: true, driven: true, data: null })).toBe('empty');
    expect(resolveState({ driven: true, data: null })).toBe('skeleton');
    expect(resolveState({ driven: true, data: 'x' })).toBe('content');
  });
});
