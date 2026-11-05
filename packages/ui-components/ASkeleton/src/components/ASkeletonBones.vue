<script setup lang="ts">
/**
 * `<ASkeletonBones>` — the Vue adapter around the framework-agnostic
 * `Ghost` class.
 *
 * Thin shell: on mount it finds the enclosing skeleton pane's loading
 * root (the element that will carry `[data-a-skel-loading]`), instantiates
 * a `Ghost(root, { id, exact, refetch })`, and tears it down on unmount.
 * Every bit of lifecycle policy — source selection, re-measurement, dev
 * reports — lives inside the Ghost class, not here.
 *
 * The DOM shape this component renders is intentionally bare: a single
 * host div the Ghost constructor fills with `[data-a-skel-ghost]`,
 * `[data-a-skel-snapshot]`, and `[data-a-skel-layer]` children. The host
 * doubles as the loading root (`[data-a-skel-loading]` is applied by
 * the Ghost itself).
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Ghost } from '../engine/Ghost';

const props = defineProps<{
  /** Stable id for shape persistence + size-mismatch warnings. */
  id?: string;
  /** True when the ghost mounted real `data` (not a sample). */
  exact?: boolean;
  /** True when the reveal is a refetch over existing content. */
  refetch?: boolean;
}>();

defineSlots<{ default?: () => unknown }>();

const rootRef = ref<HTMLElement | null>(null);
let ghost: Ghost | null = null;

function attach(): void {
  ghost?.destroy();
  if (rootRef.value) {
    ghost = new Ghost(rootRef.value, {
      id: props.id,
      exact: props.exact,
      refetch: props.refetch,
    });
  }
}

onMounted(attach);
watch(() => [props.id, props.exact, props.refetch], attach);
onBeforeUnmount(() => {
  ghost?.destroy();
  ghost = null;
});
</script>

<template>
  <div ref="rootRef">
    <!-- The ghost pane. The Ghost class will inject
         [data-a-skel-ghost] / [data-a-skel-snapshot] / [data-a-skel-layer]
         child divs — including this one, which it fills with the slot. -->
    <div data-a-skel-ghost>
      <slot />
    </div>
  </div>
</template>
