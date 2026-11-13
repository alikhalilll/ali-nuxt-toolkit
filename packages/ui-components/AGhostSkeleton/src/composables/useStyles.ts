import { onBeforeMount, onUnmounted } from 'vue';
import { addStyles, removeStyles } from '../core';

/** Adds the stylesheet on mount and removes it on unmount — reference counted, so siblings share one copy. */
export function useStyles(): void {
  onBeforeMount(addStyles);
  onUnmounted(removeStyles);
}
