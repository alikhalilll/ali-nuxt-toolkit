import { ref, readonly, type ComputedRef, type Ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

/**
 * Typing-phase state machine for the tel input.
 *
 * Owns the three reactive flags that drive the "is the user still typing?" UX:
 *
 * - `isDetecting` — true while the debounce window is in flight (user is mid-burst or
 *   has just paused). Drives the loading spinner in the picker slot.
 * - `hasFinishedTyping` — false from the moment a key lands until the debounce settles.
 *   Gates validation visibility, so error/success states only appear once the user pauses.
 * - `detectionAttempted` — flips true the first time the debounce fires on non-empty
 *   input. Used by the consumer to keep the country picker visible after a failed
 *   detection (so the user can pick manually instead of being stranded).
 *
 * Design notes:
 *
 * - The composable is pure state — it does not know about country detection, phone
 *   numbers, or libphonenumber. The consumer wires the `onSettle` callback to whatever
 *   "what to do when typing pauses" logic is appropriate (typically: try to detect a
 *   country from the current digits, mark a detection attempt, and apply the match).
 *
 * - `markDetectionAttempt()` is exposed separately so the caller controls *when* the
 *   "keep the picker visible" flag flips — not every settle triggers a real attempt
 *   (e.g. when input is empty or the user already picked a country manually).
 *
 * - Refs are exposed `readonly` so external code can't bypass the state machine; all
 *   transitions go through the exposed actions.
 */
export interface UseTypingPhaseOptions {
  /** Debounce window in ms. Reactive so consumers can change `detectDebounceMs` at runtime. */
  debounceMs: ComputedRef<number>;
  /** Fired when the debounce timer settles. Runs regardless of input state — use this
   *  to clear loading UI, then perform any pause-triggered work (e.g. detection). */
  onSettle?: () => void;
}

export interface UseTypingPhaseReturn {
  isDetecting: Readonly<Ref<boolean>>;
  hasFinishedTyping: Readonly<Ref<boolean>>;
  detectionAttempted: Readonly<Ref<boolean>>;
  /** Call from the input handler on every keystroke that produces non-empty input. */
  markTyping: () => void;
  /** Flip `detectionAttempted` to true. Call from within the `onSettle` callback when
   *  a real detection attempt is about to run — so the picker stays visible after even
   *  a failed match. */
  markDetectionAttempt: () => void;
  /** Reset all three flags to defaults. Call when the input is cleared. */
  reset: () => void;
}

export function useTypingPhase(opts: UseTypingPhaseOptions): UseTypingPhaseReturn {
  const isDetecting = ref(false);
  const hasFinishedTyping = ref(true);
  const detectionAttempted = ref(false);

  const settle = useDebounceFn(() => {
    isDetecting.value = false;
    hasFinishedTyping.value = true;
    opts.onSettle?.();
  }, opts.debounceMs);

  function markTyping() {
    isDetecting.value = true;
    hasFinishedTyping.value = false;
    settle();
  }

  function markDetectionAttempt() {
    detectionAttempted.value = true;
  }

  function reset() {
    isDetecting.value = false;
    hasFinishedTyping.value = true;
    detectionAttempted.value = false;
  }

  return {
    isDetecting: readonly(isDetecting),
    hasFinishedTyping: readonly(hasFinishedTyping),
    detectionAttempted: readonly(detectionAttempted),
    markTyping,
    markDetectionAttempt,
    reset,
  };
}
