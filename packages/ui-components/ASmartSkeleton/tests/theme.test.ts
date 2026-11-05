import { describe, expect, it } from 'vitest';
import { skeletonCSS, themeVariables, DEFAULT_COLORS } from '../src/core/theme';

describe('themeVariables', () => {
  it('extracts theme custom properties', () => {
    const vars = themeVariables(
      {
        radius: '6px',
        animation: 'pulse',
        speed: 'fast',
        text: { top: 'cap-height', bottom: 'baseline' },
      },
      'light'
    );

    expect(vars['--ask-radius']).toBe('6px');
    expect(vars['--ask-animation']).toBe('pulse');
    expect(vars['--ask-speed']).toBe('fast');
    expect(vars['--ask-text-top']).toBe('cap-height');
    expect(vars['--ask-text-bottom']).toBe('baseline');
    expect(vars['--ask-base']).toBe(DEFAULT_COLORS.light.base);
    expect(vars['--ask-highlight']).toBe(DEFAULT_COLORS.light.highlight);
  });
});

describe('skeletonCSS', () => {
  it('writes tokens for a defined theme', () => {
    const css = skeletonCSS({
      theme: {
        radius: '4px',
        animation: 'pulse',
        speed: 'fast',
        text: { top: 'x-height' },
      },
    });

    expect(css).toContain('--ask-radius: 4px;');
    expect(css).toContain('--ask-animation: pulse;');
    expect(css).toContain('--ask-speed: fast;');
    expect(css).toContain('--ask-text-top: x-height;');
  });

  it('generates system media query for light and dark', () => {
    const css = skeletonCSS({
      theme: {
        light: { base: '#eee', highlight: '#fff' },
        dark: { base: '#111', highlight: '#333' },
      },
      mode: 'system',
    });

    expect(css).toContain(':root { --ask-base: #eee;');
    expect(css).toContain('@media (prefers-color-scheme: dark) { :root { --ask-base: #111;');
  });

  it('pins dark mode when specified', () => {
    const css = skeletonCSS({
      theme: {
        light: { base: '#eee', highlight: '#fff' },
        dark: { base: '#111', highlight: '#333' },
      },
      mode: 'dark',
    });

    expect(css).toContain(':root { --ask-base: #111;');
    expect(css).not.toContain('@media (prefers-color-scheme: dark)');
  });

  it('drops a radius that would escape its declaration', () => {
    const vars = themeVariables({ radius: '6px; } html { display: none } /*' }, 'light');
    expect(vars['--ask-radius']).toBeUndefined();
  });

  it('keeps a valid radius shorthand', () => {
    const vars = themeVariables({ radius: '4px 8px 4px 8px' }, 'light');
    expect(vars['--ask-radius']).toBe('4px 8px 4px 8px');
  });

  it('drops colour values that could close the declaration', () => {
    const vars = themeVariables(
      { light: { base: 'red; } html { display: none', highlight: '#fff' } },
      'light'
    );
    expect(vars['--ask-base']).toBeUndefined();
    expect(vars['--ask-highlight']).toBe('#fff');
  });

  it('drops animation and speed values outside the enum', () => {
    const vars = themeVariables(
      {
        animation: 'url(javascript:alert(1))' as never,
        speed: 'FAST;' as never,
      },
      'light'
    );
    expect(vars['--ask-animation']).toBeUndefined();
    expect(vars['--ask-speed']).toBeUndefined();
  });
});
