/**
 * Theme model — port of `/theme.ts`.
 *
 * A theme is light + dark colour pairs plus animation / speed / typographic
 * text-bar edges. The functions here turn a theme into:
 *
 *   - a map of CSS custom properties (`themeVariables`),
 *   - a CSS text block ready for `<style>` injection (`skeletonCSS`),
 *   - an idempotent `document.head` injection (`applyTheme`),
 *   - a nonce-aware `<style>` tag string for SSR (`themeStyleTag`).
 *
 * Every surface is pure except `applyTheme`, which touches `document.head`.
 */

export type SkeletonMode = 'light' | 'dark' | 'system';
export type SkeletonAnimation = 'shimmer' | 'group-shimmer' | 'pulse' | 'none';
export type SkeletonSpeed = 'slow' | 'fast';
export type SkeletonTextTop = 'ascender' | 'cap-height' | 'x-height';
export type SkeletonTextBottom = 'baseline' | 'descender';

export interface SkeletonColors {
  base: string;
  highlight: string;
}

export interface SkeletonText {
  top?: SkeletonTextTop;
  bottom?: SkeletonTextBottom;
}

export interface SkeletonTheme {
  light?: SkeletonColors;
  dark?: SkeletonColors;
  animation?: SkeletonAnimation;
  speed?: SkeletonSpeed;
  radius?: string;
  text?: SkeletonText;
}

export const DEFAULT_COLORS = Object.freeze({
  light: Object.freeze({
    base: 'hsl(220 13% 84%)',
    highlight: 'hsl(0 0% 100% / 0.6)',
  }),
  dark: Object.freeze({
    base: 'hsl(220 13% 22%)',
    highlight: 'hsl(0 0% 100% / 0.08)',
  }),
});

export const DEFAULT_THEME: Required<Omit<SkeletonTheme, 'light' | 'dark'>> = Object.freeze({
  animation: 'shimmer',
  speed: 'slow',
  radius: '0.5rem',
  text: Object.freeze({ top: 'ascender', bottom: 'descender' }),
});

/**
 * Build the CSS custom property map for a given theme + mode. Variables
 * are keyed `--ak-skel-*` to stay inside the package's namespace.
 */
export function themeVariables(
  theme: SkeletonTheme = {},
  mode: 'light' | 'dark' = 'light'
): Record<string, string> {
  const colours =
    mode === 'dark'
      ? { ...DEFAULT_COLORS.dark, ...theme.dark }
      : { ...DEFAULT_COLORS.light, ...theme.light };
  const t = { ...DEFAULT_THEME, ...theme, text: { ...DEFAULT_THEME.text, ...theme.text } };
  return {
    '--ak-skel-base': colours.base,
    '--ak-skel-highlight': colours.highlight,
    '--ak-skel-radius': t.radius,
    '--ak-skel-animation': t.animation,
    '--ak-skel-speed': t.speed,
    '--ak-skel-text-top': t.text.top!,
    '--ak-skel-text-bottom': t.text.bottom!,
  };
}

export interface SkeletonCSSOptions {
  theme?: SkeletonTheme;
  mode?: SkeletonMode;
  text?: SkeletonText;
  selector?: string;
}

/**
 * Serialise a theme + mode to a CSS text block. For `'system'`, emits
 * light tokens on the selector + a `@media (prefers-color-scheme: dark)`
 * block overriding with dark tokens.
 */
export function skeletonCSS(options: SkeletonCSSOptions = {}): string {
  const selector = options.selector ?? ':root';
  const theme: SkeletonTheme = {
    ...options.theme,
    text: { ...options.theme?.text, ...options.text },
  };
  const mode: SkeletonMode = options.mode ?? 'system';
  const lightVars = themeVariables(theme, 'light');
  const darkVars = themeVariables(theme, 'dark');

  const toBlock = (vars: Record<string, string>): string =>
    Object.entries(vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

  const chunks: string[] = [];
  const primary = mode === 'dark' ? darkVars : lightVars;
  chunks.push(`${selector} {\n${toBlock(primary)}\n}`);
  if (mode === 'system') {
    chunks.push(
      `@media (prefers-color-scheme: dark) {\n  ${selector} {\n${toBlock(darkVars)
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}\n  }\n}`
    );
  }
  return chunks.join('\n\n');
}

/**
 * Inject (or replace) the theme stylesheet in `document.head`. Idempotent —
 * calling with the same theme twice doesn't duplicate. Returns a cleanup
 * function that removes the injected sheet.
 */
export function applyTheme(
  theme: SkeletonTheme = {},
  mode: SkeletonMode = 'system',
  { nonce }: { nonce?: string } = {}
): () => void {
  if (typeof document === 'undefined') return () => {};
  let style = document.querySelector<HTMLStyleElement>('style[data-a-skel-theme]');
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('data-a-skel-theme', '');
    document.head.append(style);
  }
  if (nonce) style.setAttribute('nonce', nonce);
  style.textContent = skeletonCSS({ theme, mode });
  return () => {
    style?.remove();
  };
}

/** Serialise a theme to a `<style>` HTML string — for SSR templating. */
export function themeStyleTag(options: SkeletonCSSOptions = {}, nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${escapeHtml(nonce)}"` : '';
  return `<style data-a-skel-theme${nonceAttr}>${skeletonCSS(options)}</style>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
