<script setup lang="ts">
import { computed, provide, watch } from 'vue';
import type { SkeletonMode, SkeletonText, SkeletonTheme } from '../boot';
import { applyTheme } from '../boot/theme';
import { SKELETON_CONFIG_KEY, type SkeletonConfig } from '../composables/useSkeletonConfig';
import { setDebug } from '../utils/debug';
import type { ASkeletonReveal } from '../types';

/**
 * `<ASkeletonProvider>` — the Vue-adapter configuration root.
 *
 * Mounts a `<style data-a-skel-theme>` with the resolved colour / radius /
 * animation / text tokens so every `<ASkeleton>` descendant inherits them,
 * and provides a `SkeletonConfig` object via `inject` for programmatic
 * access (nonce, default reveal mode, debug flag).
 *
 * This component is strictly optional — the package works without it. The
 * provider is the "recommended setup" for apps that want:
 *   - a CSP nonce threaded through the injected styles
 *   - a shared default `reveal` mode
 *   - a dark/light/system mode switcher wiring the theme at the root
 *   - the debug overlay force-enabled for a whole subtree
 */

interface Props {
  nonce?: string;
  theme?: SkeletonTheme;
  mode?: SkeletonMode;
  text?: SkeletonText;
  reveal?: ASkeletonReveal;
  debug?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'system',
  reveal: 'smart',
  debug: false,
});

const config = computed<SkeletonConfig>(() => ({
  nonce: props.nonce,
  theme: props.theme,
  mode: props.mode,
  text: props.text,
  reveal: props.reveal,
  debug: props.debug,
}));

provide(SKELETON_CONFIG_KEY, config.value);

/* Keep the injected theme stylesheet in sync with props. `applyTheme` is
 * idempotent — mutating the same `<style data-a-skel-theme>` tag. */
watch(
  () => [props.theme, props.mode, props.nonce],
  () => applyTheme(props.theme, props.mode, { nonce: props.nonce }),
  { immediate: true, deep: true }
);

/* Mirror the `debug` prop into the module-level overlay toggle so every
 * descendant `<ASkeleton>` sees the enabled state. */
watch(
  () => props.debug,
  (on) => setDebug(on),
  { immediate: true }
);
</script>

<template>
  <slot />
</template>
