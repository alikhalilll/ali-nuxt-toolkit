import { defineComponent, h, inject, provide, watch, type InjectionKey, type PropType } from 'vue';
import {
  setDebug,
  skeletonCSS,
  type RevealMode,
  type SkeletonMode,
  type SkeletonText,
  type SkeletonTheme,
} from '../core';

export type SmartSkeletonConfig = {
  /** Set on the inline script and stylesheets rendered, for a Content Security Policy. */
  nonce?: string;
  /** Colours for light and dark; `mode` picks between them. */
  theme?: SkeletonTheme;
  mode?: SkeletonMode;
  /** Where text bars run: from `top` (ascender, cap-height, x-height) down to `bottom` (baseline, descender). */
  text?: SkeletonText;
  /** How content replaces its skeleton: `smart` (the default), `together`, `sequence`, `sweep`, or a `RevealSpec` of your own. */
  reveal?: RevealMode;
  /** Outlines every reveal with where its skeleton came from and whether anything moved. */
  debug?: boolean;
};

const key: InjectionKey<SmartSkeletonConfig> = Symbol('a-smart-skeleton');

/** Per server render: whether the full inline script has gone out yet, so the skeletons after it send a stub. */
const bootKey: InjectionKey<{ sent: boolean }> = Symbol('a-smart-skeleton.boot');

/** The provider settings in scope for this component. Empty outside a provider. */
export const useSmartSkeleton = (): SmartSkeletonConfig => inject(key, {});

/** Whether this skeleton should send the stub — claiming the full script if it's the first. */
export function claimStub() {
  const boot = inject(bootKey, null);
  const stub = !!boot?.sent;
  if (boot) boot.sent = true;
  return stub;
}

/**
 * Settings for every skeleton inside — per request on the server, as a nonce must be.
 *
 * ```vue
 * <ASmartSkeletonProvider :theme="theme" reveal="smart" :nonce="nonce">
 *   <App />
 * </ASmartSkeletonProvider>
 * ```
 */
export const ASmartSkeletonProvider = defineComponent({
  name: 'ASmartSkeletonProvider',
  props: {
    nonce: String,
    theme: Object as PropType<SkeletonTheme>,
    mode: String as PropType<SkeletonMode>,
    text: Object as PropType<SkeletonText>,
    reveal: [String, Object] as PropType<RevealMode>,
    debug: { type: Boolean, default: undefined },
  },
  setup(props, { slots }) {
    // The props object itself, so components inside read every change.
    provide(key, props);
    provide(bootKey, { sent: false });

    watch(
      () => props.debug,
      (debug) => {
        if (debug !== undefined && typeof window !== 'undefined') setDebug(debug);
      },
      { immediate: true }
    );

    return () => {
      const css = skeletonCSS(props);
      return [css ? h('style', { nonce: props.nonce }, css) : null, slots.default?.()];
    };
  },
});
