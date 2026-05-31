import { computed, ref, type ComputedRef, type Ref } from 'vue';

/**
 * How the currently-selected country came to be.
 *
 * The source drives the detection state machine — some sources are "hints" that
 * typed-international input is allowed to override (`'default'`, `'env'`,
 * `'external'`), others are "locks" that must be cleared before detection can
 * re-route the picker (`'picker'`, `'input'`).
 */
export type CountrySource =
  /** Nothing selected. */
  | 'none'
  /** Seeded from the `defaultCountry` prop at mount. Overridable. */
  | 'default'
  /** Silent IP / timezone / `navigator.language` resolution at mount. Overridable. */
  | 'env'
  /** `tryMatchPhone` recognised a dial code in user input. Locks until cleared. */
  | 'input'
  /** User clicked an item in the country picker. Locks until cleared. */
  | 'picker'
  /** Caller wrote `v-model:country` (dial number) or `v-model` (E.164) directly.
   *  Treated as a hint — typed-international input can still override. */
  | 'external';

export interface UseCountrySelectionReturn {
  /** Currently selected ISO 3166-1 alpha-2 code, or `''` when no country selected. */
  iso2: Ref<string>;
  /** Where the current selection came from. */
  source: Ref<CountrySource>;
  /** `true` when typed-input detection should be suppressed (`'picker'` / `'input'`). */
  detectionLocked: ComputedRef<boolean>;
  /** Set both `iso2` and `source` atomically. The single mutator for the selection. */
  set: (iso2: string, source: CountrySource) => void;
  /** Reset to the empty / no-country state. */
  clear: () => void;
}

/**
 * The picker selection state machine for {@link ATelInput}, consolidated into a
 * single composable so the component doesn't have to juggle three boolean flags
 * (`userPickedCountry` / `autoSettingCountry` / `inputDetectionApplied`) and
 * reason about their pairwise interactions.
 *
 * Every write to the selection goes through {@link UseCountrySelectionReturn.set},
 * which records both the new ISO2 and the *origin* of the change. That makes the
 * downstream decision — should detection re-route the picker on the next typed-input
 * burst? — a one-liner: `if (detectionLocked.value) return;`.
 */
export function useCountrySelection(): UseCountrySelectionReturn {
  const iso2 = ref<string>('');
  const source = ref<CountrySource>('none');

  function set(nextIso2: string, nextSource: CountrySource) {
    iso2.value = nextIso2;
    source.value = nextSource;
  }

  function clear() {
    iso2.value = '';
    source.value = 'none';
  }

  // A "locked" source means the user (or `tryMatchPhone`) has committed to this
  // country — further typed-input detection must not churn the picker. The hint
  // sources (`'default'`, `'env'`, `'external'`) remain overridable by an explicit
  // typed-international prefix; the component layer applies that policy.
  const detectionLocked = computed(() => source.value === 'picker' || source.value === 'input');

  return { iso2, source, set, clear, detectionLocked };
}
