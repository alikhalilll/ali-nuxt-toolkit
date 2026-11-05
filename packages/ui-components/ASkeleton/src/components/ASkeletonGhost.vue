<script setup lang="ts">
import { ATTR_GHOST } from '../utils/attrs';

/**
 * `<ASkeletonGhost>` — the invisible content host for measure mode.
 *
 * Mounts the real content (via the default slot) inside a wrapper carrying
 * `[data-a-skel-ghost]`. The scoped stylesheet in `styles.src.css` sets
 * `visibility: hidden` on the ghost's leaves AND transparent text — the
 * ghost occupies real layout so the bones painter can measure accurately,
 * but the user sees nothing (the bones overlay on top).
 *
 * Author rule: whatever lives in the default slot is the shape source. In
 * data-driven mode `<ASkeleton>` populates the slot with the sample /
 * last-data stand-in; in control mode it reflects whatever the consumer
 * passed. Either way the ghost just mounts the vnodes.
 */
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div :[ATTR_GHOST]="''" aria-hidden="true" inert class="a-skel-ghost">
    <slot />
  </div>
</template>

<style scoped>
/* The ghost takes real layout space (so its children get measured at their
 * real positions), but its content is visually suppressed: `visibility:
 * hidden` on leaves (via the global scoped CSS, which can't live inside
 * this scoped block) and `color: transparent` on text. We mark the wrapper
 * `aria-hidden` + `inert` so AT skips it and focus can't land inside.
 *
 * `pointer-events: none` so clicks through to the bones layer (none of
 * which handle events) rather than the ghost's underlying content. */
.a-skel-ghost {
  pointer-events: none;
  user-select: none;
}
</style>
