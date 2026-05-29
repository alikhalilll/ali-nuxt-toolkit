/**
 * Shared size scale for every interactive component in the @alikhalilll/a-* set.
 *
 *   xs = 28px · sm = 36px · md = 43px (default) · lg = 52px · xl = 60px
 *
 * Use the {@link controlHeight}, {@link controlPaddingX}, {@link controlTextSize}
 * maps when building a CVA variant so every component stays in lockstep.
 */

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const SIZES: readonly Size[] = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const DEFAULT_SIZE: Size = 'md';

/** Tailwind height utility per size. md uses an arbitrary value because 43px isn't on the spacing scale. */
export const controlHeight: Record<Size, string> = {
  xs: 'h-7',
  sm: 'h-9',
  md: 'h-[43px]',
  lg: 'h-[52px]',
  xl: 'h-[60px]',
};

export const controlPaddingX: Record<Size, string> = {
  xs: 'px-2',
  sm: 'px-2.5',
  md: 'px-3',
  lg: 'px-3.5',
  xl: 'px-4',
};

export const controlTextSize: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-base',
};

/** Pixel values exposed so non-template code (icons, ResizeObserver, etc.) can read the height. */
export const controlHeightPx: Record<Size, number> = {
  xs: 28,
  sm: 36,
  md: 43,
  lg: 52,
  xl: 60,
};
