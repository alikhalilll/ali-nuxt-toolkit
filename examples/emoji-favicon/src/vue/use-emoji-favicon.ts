import { ref, watchEffect, type Ref } from 'vue';
import { setFavicon, type SetFaviconOptions } from '../core';

export interface UseEmojiFaviconReturn {
  emoji: Ref<string>;
  set(value: string): void;
  clear(): void;
}

export function useEmojiFavicon(
  initial = '',
  options: SetFaviconOptions = {},
): UseEmojiFaviconReturn {
  const emoji = ref(initial);

  watchEffect(() => {
    if (typeof document === 'undefined') return;
    if (emoji.value) setFavicon(emoji.value, options);
  });

  return {
    emoji,
    set: (value: string) => (emoji.value = value),
    clear: () => (emoji.value = ''),
  };
}
