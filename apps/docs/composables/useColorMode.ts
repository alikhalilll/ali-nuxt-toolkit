/**
 * Tri-state color-mode for the docs.
 *
 *   - `'light'`  — locked light.
 *   - `'dark'`   — locked dark.
 *   - `'system'` — follows `prefers-color-scheme` and updates live if the OS pref flips.
 *
 * Persists the *preference* (not the resolved value) in two places so every
 * entry point can read it:
 *
 *   1. **Cookie** `ant-docs-theme` — so the server knows the preference on the
 *      very first request. SSR renders with the correct mode from the first
 *      byte, no flash on hard refresh.
 *   2. **localStorage** — so the pre-paint inline script in `nuxt.config.ts`
 *      head.script can resolve the preference before any CSS loads. The cookie
 *      and localStorage are kept in sync by the `watch(pref)` below.
 *
 * The *resolved* value (the one the pre-paint script actually applies) is also
 * mirrored into a `ant-docs-resolved` cookie so an SSR consumer can skip the
 * `prefers-color-scheme` guess when `pref === 'system'`.
 */

export type ColorMode = 'light' | 'dark' | 'system';
export type ResolvedColorMode = 'light' | 'dark';

const PREF_KEY = 'ant-docs-theme';
const RESOLVED_KEY = 'ant-docs-resolved';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function isValidPref(v: unknown): v is ColorMode {
  return v === 'light' || v === 'dark' || v === 'system';
}
function isValidResolved(v: unknown): v is ResolvedColorMode {
  return v === 'light' || v === 'dark';
}

function readStoredPref(): ColorMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (isValidPref(v)) return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function systemPref(): ResolvedColorMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolve(pref: ColorMode, fallback: ResolvedColorMode): ResolvedColorMode {
  if (pref === 'light' || pref === 'dark') return pref;
  return typeof window === 'undefined' ? fallback : systemPref();
}

function apply(resolved: ResolvedColorMode) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.classList.toggle('dark', resolved === 'dark');
  el.classList.toggle('light', resolved === 'light');
}

export function useColorMode() {
  // Cookie layer — bidirectional ref, SSR-aware, auto-sent on every
  // subsequent request so `useCookie` on the server reads the right value.
  const prefCookie = useCookie<ColorMode>(PREF_KEY, {
    default: () => 'system',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
  const resolvedCookie = useCookie<ResolvedColorMode>(RESOLVED_KEY, {
    default: () => 'dark',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  });

  // useState shares the resolved value across every component on the page.
  // Factory runs once per request on the server (seeded from the cookie) and
  // once on the client during hydration (same seed, no mismatch).
  const pref = useState<ColorMode>('color-mode-pref', () =>
    isValidPref(prefCookie.value) ? prefCookie.value : 'system'
  );
  const resolved = useState<ResolvedColorMode>('color-mode-resolved', () =>
    resolve(pref.value, isValidResolved(resolvedCookie.value) ? resolvedCookie.value : 'dark')
  );

  if (import.meta.client) {
    // localStorage takes precedence on the client: it's the source the
    // pre-paint script reads, and the user may have changed it in another tab.
    onBeforeMount(() => {
      const stored = readStoredPref();
      if (stored !== pref.value) pref.value = stored;
      resolved.value = resolve(pref.value, resolved.value);
      apply(resolved.value);
    });

    // Preference change → persist to both stores and re-apply.
    watch(pref, (next) => {
      try {
        localStorage.setItem(PREF_KEY, next);
      } catch {
        /* storage disabled */
      }
      prefCookie.value = next;
      resolved.value = resolve(next, resolved.value);
      resolvedCookie.value = resolved.value;
      apply(resolved.value);
    });

    // Resolved change (e.g. OS theme flip under `pref === 'system'`) → sync
    // the cookie so next SSR can skip the `matchMedia` guess.
    watch(resolved, (next) => {
      if (resolvedCookie.value !== next) resolvedCookie.value = next;
    });

    // Listen for OS theme changes — only react when the user chose "system".
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
