import type { VNodeChild } from 'vue';
import type {
  RevealMode,
  SkeletonBoxOptions,
  SkeletonMode,
  SkeletonText,
  SkeletonTheme,
} from './core';

export interface ASmartSkeletonBoxProps extends SkeletonBoxOptions {
  class?: string;
  style?: Record<string, string | number>;
}

/**
 * Slots: `default` (with `{ data }` when `data` is bound), `skeleton`, `empty`,
 * `error` (with `{ error }`).
 */
export interface ASmartSkeletonProps<T = unknown> {
  /** Shows the skeleton, even over `data`. With `data`, it also shows while there is none. */
  loading?: boolean;
  /** Loading while `null` or `undefined`; handed to the default slot as `{ data }`. */
  data?: T | null;
  /** Stands in for `data` to draw the skeleton before any has loaded. */
  sample?: T;
  /** Remembers the shape under this key across visits. */
  id?: string;
  /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
  label?: string;
  /** Renders the `empty` slot instead of the content. */
  empty?: boolean;
  /** When set, renders the `error` slot with `{ error }` instead of the content. */
  error?: unknown;
  /** Overrides the provider's reveal for this skeleton alone. */
  reveal?: RevealMode;
  /** Called once content has come in over a skeleton; `@reveal` in a template. */
  onReveal?: () => void;
  class?: string;
  style?: Record<string, string | number>;
}

export interface ASmartSkeletonSlots<T = unknown> {
  /** The content. Receives `{ data }` when `data` is bound. */
  default?: (props: { data: T }) => VNodeChild;
  /** Shown while loading instead of the measured skeleton. */
  skeleton?: () => VNodeChild;
  /** Shown when `empty` is set. Falls back to the content. */
  empty?: () => VNodeChild;
  /** Shown when `error` is set. Receives `{ error }`. */
  error?: (props: { error: unknown }) => VNodeChild;
}

export interface ASmartSkeletonEmits {
  /** Content has come in over a skeleton. */
  reveal: () => void;
}

/** Slots: `default`, the content that suspends; `skeleton`, the content rendered from sample data. */
export interface ASmartSkeletonSuspenseProps {
  /** Remembers the shape under this key across visits. */
  id?: string;
  /** Read to screen readers while suspended, in place of the skeleton. */
  label?: string;
  /** Overrides the provider's reveal for this boundary alone. */
  reveal?: RevealMode;
  /** Called once content has come in over the skeleton; `@reveal` in a template. */
  onReveal?: () => void;
}

export interface ASmartSkeletonSuspenseSlots {
  default?: () => VNodeChild;
  skeleton?: () => VNodeChild;
}

export interface ASmartSkeletonSuspenseEmits {
  /** Content has come in over the skeleton. */
  reveal: () => void;
}

/** Settings for every skeleton inside. Per request on the server, as a nonce must be. */
export interface ASmartSkeletonProviderProps {
  /** Set on the inline script and stylesheets rendered, for a Content Security Policy. */
  nonce?: string;
  /** Colours for light and dark; `mode` picks between them. */
  theme?: SkeletonTheme;
  /** `system` follows `prefers-color-scheme`; the others pin one set of colours. */
  mode?: SkeletonMode;
  /** Where text bars run: from `top` (ascender, cap-height, x-height) down to `bottom` (baseline, descender). */
  text?: SkeletonText;
  /** How content replaces its skeleton: `smart` (the default), `together`, `sequence`, `sweep`, or a `RevealSpec` of your own. */
  reveal?: RevealMode;
  /** Outlines every reveal with where its skeleton came from and whether anything moved. */
  debug?: boolean;
}

export interface ASmartSkeletonProviderSlots {
  default?: () => VNodeChild;
}

export type SmartSkeletonConfig = ASmartSkeletonProviderProps;
