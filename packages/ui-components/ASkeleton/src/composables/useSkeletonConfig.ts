/**
 * Package-wide configuration injected by `<ASkeletonProvider>` and read by
 * every `<ASkeleton>` instance. Mirrors the provider pattern
 *
 *
 * The injection is strictly optional — a consumer who doesn't mount a
 * provider gets the frozen `DEFAULT_CONFIG`, and nothing in the engine
 * depends on the provider's presence. The provider is sugar: one place to
 * set the nonce, theme, mode, debug flag, and default reveal animation.
 */

import { inject, type InjectionKey } from 'vue';
import type { SkeletonMode, SkeletonText, SkeletonTheme } from '../boot';
import type { ASkeletonReveal } from '../types';

export interface SkeletonConfig {
  /** CSP nonce applied to injected `<style>` / `<script>` tags. */
  nonce?: string;
  /** Theme — light + dark colour pairs, animation, speed, radius, text. */
  theme?: SkeletonTheme;
  /** Light / dark / follow-system. */
  mode?: SkeletonMode;
  /** Overrides `theme.text` without having to re-specify every colour. */
  text?: SkeletonText;
  /** Default reveal animation used when a `<ASkeleton>` doesn't set `reveal`. */
  reveal?: ASkeletonReveal;
  /** Force-enable the debug overlay for every `<ASkeleton>` under the provider. */
  debug?: boolean;
}

export const SKELETON_CONFIG_KEY: InjectionKey<SkeletonConfig> = Symbol(
  'a-skel:config'
) as InjectionKey<SkeletonConfig>;

const EMPTY: SkeletonConfig = Object.freeze({});

/** Access the package-wide configuration. Returns `{}` outside a provider. */
export function useSkeletonConfig(): SkeletonConfig {
  return inject(SKELETON_CONFIG_KEY, EMPTY);
}
