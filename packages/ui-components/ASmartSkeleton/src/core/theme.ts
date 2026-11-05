import type { TextBottom, TextTop } from './measure';

export type SkeletonColors = {
  /** The skeleton's fill. */
  base: string;
  /** The shimmer sweeping across it. */
  highlight: string;
};

/** `shimmer` sweeps the whole page, `group-shimmer` each skeleton, `pulse` fades; all hold still under reduced motion. */
export type SkeletonAnimation = 'shimmer' | 'group-shimmer' | 'pulse' | 'none';

/** How quickly the animation loops — each animation has its own slow and fast. */
export type SkeletonSpeed = 'slow' | 'fast';

/** How much of each line of text is drawn: from the font's `top` line down to its `bottom` line. */
export type SkeletonText = { top?: TextTop; bottom?: TextBottom };

/** `system` follows `prefers-color-scheme`; the others pin one set of colours. */
export type SkeletonMode = 'light' | 'dark' | 'system';

export type SkeletonTheme = {
  light?: SkeletonColors;
  dark?: SkeletonColors;
  /** How round each line of text, and any other single bar, is drawn — any CSS length; `999px` for pills. Images and chips keep their own. */
  radius?: string;
  animation?: SkeletonAnimation;
  speed?: SkeletonSpeed;
  text?: SkeletonText;
};

export const DEFAULT_COLORS: { light: SkeletonColors; dark: SkeletonColors } = {
  light: { base: 'rgb(0 0 0 / 0.07)', highlight: 'rgb(255 255 255 / 0.6)' },
  dark: {
    base: 'rgb(255 255 255 / 0.08)',
    highlight: 'rgb(255 255 255 / 0.1)',
  },
};

export const DEFAULT_THEME = {
  ...DEFAULT_COLORS,
  animation: 'shimmer',
  speed: 'slow',
  text: { top: 'ascender', bottom: 'descender' },
} as const satisfies SkeletonTheme;

/** A theme's custom properties for one set of colours, for a style attribute. */
export function themeVariables(
  theme: SkeletonTheme = {},
  mode: 'light' | 'dark' | null = null
): Record<string, string> {
  const variables: Record<string, string> = {};
  const colors = mode && (theme[mode] ?? DEFAULT_COLORS[mode]);
  if (colors) {
    variables['--ask-base'] = colors.base;
    variables['--ask-highlight'] = colors.highlight;
  }
  if (theme.radius) variables['--ask-radius'] = theme.radius;
  if (theme.animation) variables['--ask-animation'] = theme.animation;
  if (theme.speed) variables['--ask-speed'] = theme.speed;
  if (theme.text?.top) variables['--ask-text-top'] = theme.text.top;
  if (theme.text?.bottom) variables['--ask-text-bottom'] = theme.text.bottom;
  return variables;
}

const declarations = (variables: Record<string, string>) =>
  Object.entries(variables)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ');

/** CSS for a theme on `selector`; colours follow `mode`, and are left out when neither is given. */
export function skeletonCSS({
  theme = {},
  mode,
  text,
  selector = ':root',
}: {
  theme?: SkeletonTheme;
  mode?: SkeletonMode;
  text?: SkeletonText;
  selector?: string;
}): string {
  const resolved = { ...theme, text: { ...theme.text, ...text } };
  const colored = mode ?? (theme.light || theme.dark ? 'system' : null);
  const base = themeVariables(resolved, colored === 'dark' ? 'dark' : colored ? 'light' : null);

  const rules: string[] = [];
  if (Object.keys(base).length) {
    rules.push(`${selector} { ${declarations(base)} }`);
  }
  if (colored === 'system') {
    const dark = themeVariables({ dark: theme.dark }, 'dark');
    rules.push(`@media (prefers-color-scheme: dark) { ${selector} { ${declarations(dark)} } }`);
  }
  return rules.join('\n');
}

let themeEl: HTMLStyleElement | null = null;

/** Sets a theme for the whole page, for setups without a provider. */
export function applyTheme(
  theme?: SkeletonTheme,
  mode?: SkeletonMode,
  { nonce }: { nonce?: string } = {}
) {
  themeEl ??= document.head.appendChild(document.createElement('style'));
  if (nonce) themeEl.nonce = nonce;
  themeEl.textContent = skeletonCSS({ theme, mode });
}

/** The same CSS as a whole element, for templates that can only render HTML strings. */
export const themeStyleTag = (
  config: { theme?: SkeletonTheme; mode?: SkeletonMode; text?: SkeletonText },
  nonce?: string
) => {
  const css = skeletonCSS(config);
  return css
    ? `<style${nonce ? ` nonce="${nonce.replace(/"/g, '&quot;')}"` : ''}>${css}</style>`
    : '';
};
