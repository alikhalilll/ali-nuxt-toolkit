import { describe, expect, it } from 'vitest';
import { fill, sampleFrom } from '../src/utils/sample';

describe('fill', () => {
  it('replaces alphanumerics while preserving case + punctuation', () => {
    expect(fill('Hello World 123!')).toBe('Xxxxx Xxxxx 000!');
    expect(fill('abcDEF')).toBe('xxxXXX');
  });
});

describe('sampleFrom', () => {
  it('scrambles strings', () => {
    expect(sampleFrom('Alice')).toBe('Xxxxx');
  });

  it('leaves URL-like strings empty', () => {
    expect(sampleFrom('https://example.com/img.png')).toBe('');
    expect(sampleFrom('/local')).toBe('');
    expect(sampleFrom('data:text/plain,hi')).toBe('');
  });

  it('preserves array lengths + object shapes', () => {
    const input = { name: 'Alice', age: 30, tags: ['admin', 'user'], home: null };
    const output = sampleFrom(input) as typeof input;
    expect(output.name).toBe('Xxxxx');
    expect(output.age).toBe(30);
    expect(output.tags).toEqual(['xxxxx', 'xxxx']);
    expect(output.home).toBeNull();
  });

  it('preserves Date values', () => {
    const d = new Date('2024-01-01');
    expect(sampleFrom(d)).toBe(d);
  });

  it('passes non-string primitives through', () => {
    expect(sampleFrom(42)).toBe(42);
    expect(sampleFrom(true)).toBe(true);
    expect(sampleFrom(null)).toBeNull();
  });
});
