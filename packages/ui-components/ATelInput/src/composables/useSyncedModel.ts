import { watch, type Ref, type WatchSource } from 'vue';

export interface UseSyncedModelOptions<T> {
  /** The `defineModel` ref to keep in sync with internal state. */
  model: Ref<T>;
  /**
   * Internal reactive sources that, when they change, should re-compose and emit
   * a new model value. Typically the refs that {@link compose} reads from.
   */
  triggers: WatchSource[];
  /** Compose the next model value from current internal state. */
  compose: () => T;
  /** Apply an externally-written model value into internal state. */
  apply: (next: T) => void;
  /** Equality test for the model value. Defaults to `Object.is`. */
  isEqual?: (a: T, b: T) => boolean;
}

/**
 * Two-way bidirectional sync between a `defineModel` ref and internal component
 * state — with the **echo-loop guard** built in. Solves a recurring class of
 * bugs in this component where two watchers (external→internal and
 * internal→external) would fight each other and rewrite values the user just
 * typed.
 *
 * Mechanics:
 *
 *   1. When any of `triggers` change AND we're not currently applying an
 *      external write, recompute the model value via `compose()` and write it
 *      into `model`. Stamp `lastEmitted` first so we recognise the echo.
 *   2. When `model` changes AND the new value isn't the echo of our last emit,
 *      apply it into internal state via `apply()`. The `applying` flag is held
 *      for the duration of `apply()` so step (1) skips while we mutate.
 *
 * Used for:
 *   - `modelValue` (E.164 string) ↔ `phone` + `selectedIso2`.
 *   - `country` (dial-number) ↔ `selectedIso2`.
 *
 * The hand-rolled equivalents (`applyingModelValue` / `lastEmittedModelValue`
 * plus the country↔iso2 watcher pair with `autoSettingCountry`) collapse into
 * two calls to this helper.
 */
export function useSyncedModel<T>(options: UseSyncedModelOptions<T>): void {
  const { model, triggers, compose, apply } = options;
  const isEqual = options.isEqual ?? Object.is;

  let applying = false;
  let lastEmitted: T | { __unset: true } = { __unset: true };
  const isEcho = (v: T) =>
    typeof lastEmitted === 'object' && lastEmitted !== null && '__unset' in (lastEmitted as object)
      ? false
      : isEqual(v, lastEmitted as T);

  watch(
    model,
    (next) => {
      if (isEcho(next)) return;
      applying = true;
      try {
        apply(next);
      } finally {
        applying = false;
      }
    },
    { immediate: true }
  );

  watch(
    triggers,
    () => {
      if (applying) return;
      const next = compose();
      if (!isEqual(next, model.value)) {
        lastEmitted = next;
        model.value = next;
      }
    },
    { flush: 'post' }
  );
}
