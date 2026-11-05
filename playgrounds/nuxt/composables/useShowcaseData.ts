import { onMounted, ref, type Ref } from 'vue';

/**
 * Three-state lifecycle (`null → loading → T`) for every showcase in
 * `pages/showcases.vue`. The showcase wraps `<ASkeleton :data="data"
 * :sample="sample">` so the ASkeleton sees `null` → draws skeleton, then
 * the resolved value → fades to content.
 *
 * `reload()` resets the data to `null` and schedules the real value to
 * land after `delay` ms. The returned ref is a `Ref<T | null>` so the
 * TypeScript inference on the `#default="{ data }"` slot is tight.
 *
 * SRP: this composable owns one fact — the lifecycle. Everything else
 * (sample, layout, ASkeleton wrapper) is the showcase's concern.
 */
export function useShowcaseData<T>(
  resolve: () => T,
  delay = 800
): {
  data: Ref<T | null>;
  reload: () => void;
} {
  const data: Ref<T | null> = ref(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function reload(): void {
    if (timer) clearTimeout(timer);
    data.value = null;
    timer = setTimeout(() => {
      data.value = resolve();
    }, delay);
  }

  onMounted(reload);

  return { data, reload };
}
