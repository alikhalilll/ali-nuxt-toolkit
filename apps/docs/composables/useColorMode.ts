/**
 * Tri-state color-mode for the docs.
 *
 *   - `'light'`  — locked light.
 *   - `'dark'`   — locked dark.
 *   - `'system'` — follows `prefers-color-scheme` and updates live if the OS pref flips.
 *
 * Persists the *preference* (not the resolved value) in localStorage. A pre-paint inline
 * script (see nuxt.config.ts) reads it on first paint so the page never flashes the wrong
 * theme.
 */

export type ColorMode = 'light' | 'dark' | 'system';
export type ResolvedColorMode = 'light' | 'dark';

const STORAGE_KEY = 'ant-docs-theme';

function readStoredPref(): ColorMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function systemPref(): ResolvedColorMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolve(pref: ColorMode): ResolvedColorMode {
  return pref === 'system' ? systemPref() : pref;
}

function apply(resolved: ResolvedColorMode) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.classList.toggle('dark', resolved === 'dark');
  el.classList.toggle('light', resolved === 'light');
}

export function useColorMode() {
  /** The user's preference: light | dark | system. Persisted. */
  const pref = useState<ColorMode>('color-mode-pref', () => 'system');
  /** The currently-applied light/dark mode. Derived from pref + system. */
  const resolved = useState<ResolvedColorMode>('color-mode-resolved', () => 'dark');

  if (import.meta.client) {
    onBeforeMount(() => {
      pref.value = readStoredPref();
      resolved.value = resolve(pref.value);
    });

    // Whenever the preference changes, persist + re-apply.
    watch(pref, (next) => {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage disabled */
      }
      resolved.value = resolve(next);
      apply(resolved.value);
    });

    // Listen for OS theme changes — only react when the user has chosen "system".
    onMounted(() => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        if (pref.value === 'system') {
          resolved.value = systemPref();
          apply(resolved.value);
        }
      };
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange);
        onBeforeUnmount(() => mq.removeEventListener('change', onChange));
      }
    });
  }

  return {
    pref,
    resolved,
    isDark: computed(() => resolved.value === 'dark'),
    set: (next: ColorMode) => {
      pref.value = next;
    },
  };
}
