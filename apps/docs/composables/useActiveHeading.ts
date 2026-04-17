import type { Ref } from 'vue';

export function useActiveHeading(ids: Ref<string[]>) {
  const active = ref<string | null>(null);
  const offset = 120;

  function update() {
    const list = ids.value;
    if (!list.length) {
      active.value = null;
      return;
    }
    let current: string | null = null;
    for (const id of list) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.getBoundingClientRect().top - offset <= 0) {
        current = id;
      } else {
        break;
      }
    }
    active.value = current ?? list[0] ?? null;
  }

  onMounted(() => {
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  });

  watch(ids, () => nextTick(update), { deep: true });

  return active;
}
