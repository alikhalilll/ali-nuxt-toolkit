import { computed, type ComputedRef, type Ref } from 'vue';
import type {
  CountryOption,
  PhoneValidationReason,
  PhoneValidationResult,
  PhoneRequiredInfo,
  UsePhoneValidationReturn,
} from './usePhoneValidation';
import type { TelInputMessages } from '../utils/types';

/**
 * Validation surfacing facade for ATelInput.
 *
 * Wraps the raw `usePhoneValidation()` calls and produces the *view-layer* surface the
 * component needs:
 *
 * - `validation` / `validationState` — the raw + simplified state of the current input.
 * - `visibleValidationState` — `validationState` gated by the `hasFinishedTyping` flag
 *   from {@link useTypingPhase}, so error tints / icons / messages only appear once the
 *   user has paused. This is the value the template should bind to.
 * - `errorMessage` — localised error string for the current `validation.reason`, or
 *   `null` when the input is empty or valid.
 * - `showError` / `showHint` — boolean computed properties for conditional rendering
 *   in the template; both already respect `showValidation` and the typing-pause gate.
 * - `selectedDialCode` — the human-readable dial prefix (`+20`, `+1`, …) for the
 *   selected country, used as an in-input prefix.
 *
 * Design notes:
 *
 * - The composable takes the `usePhoneValidation()` return value as a *dependency*
 *   rather than calling `usePhoneValidation()` itself. That function creates a fresh
 *   country index per invocation; calling it here would produce a second, empty index
 *   that never gets populated by the caller's `getCountries()` (the same bug pattern
 *   {@link useCountryMatching} avoids).
 *
 * - All inputs are `Ref` / `ComputedRef` so reactivity flows correctly. Method
 *   references on the validation singleton (`validate`, `getRequiredInfo`,
 *   `getCountryByValue`) are passed verbatim — their backing state is reactive.
 */
export interface UseTelInputValidationDeps {
  validate: UsePhoneValidationReturn['validate'];
  getRequiredInfo: UsePhoneValidationReturn['getRequiredInfo'];
  getCountryByValue: UsePhoneValidationReturn['getCountryByValue'];
}

export interface UseTelInputValidationInputs {
  /** Digits-only national number model. */
  phone: Ref<string>;
  /** Currently selected ISO2 — empty string when no country chosen. */
  selectedIso2: Ref<string>;
  /** From {@link useTypingPhase} — gates visible state during the debounce window. */
  hasFinishedTyping: Readonly<Ref<boolean>>;
  /** Resolved i18n messages (merged defaults + consumer overrides). */
  messages: ComputedRef<TelInputMessages>;
}

export interface UseTelInputValidationConfig {
  /** BCP-47 locale; affects `format_hint` numeral rendering. */
  locale: () => string | undefined;
  /** Light up field tinting + error message line. From props. */
  showValidation: () => boolean | undefined;
  /** Per-reason error string overrides. From props. */
  errorMessages: () => Partial<Record<PhoneValidationReason, string>> | undefined;
}

export interface UseTelInputValidationReturn {
  validation: ComputedRef<PhoneValidationResult>;
  required: ComputedRef<PhoneRequiredInfo | null>;
  validationState: ComputedRef<'idle' | 'valid' | 'error'>;
  visibleValidationState: ComputedRef<'idle' | 'valid' | 'error'>;
  errorMessage: ComputedRef<string | null>;
  showError: ComputedRef<boolean>;
  showHint: ComputedRef<boolean>;
  selectedDialCode: ComputedRef<string | null>;
}

export function useTelInputValidation(
  deps: UseTelInputValidationDeps,
  inputs: UseTelInputValidationInputs,
  config: UseTelInputValidationConfig
): UseTelInputValidationReturn {
  const required = computed(() =>
    inputs.selectedIso2.value
      ? deps.getRequiredInfo({ iso2: inputs.selectedIso2.value }, config.locale())
      : null
  );

  const validation = computed<PhoneValidationResult>(() =>
    deps.validate({
      country: inputs.selectedIso2.value ? { iso2: inputs.selectedIso2.value } : null,
      phone: inputs.phone.value ?? '',
      locale: config.locale(),
    })
  );

  const validationState = computed<'idle' | 'valid' | 'error'>(() => {
    if (!inputs.phone.value) return 'idle';
    return validation.value.ok ? 'valid' : 'error';
  });

  const visibleValidationState = computed<'idle' | 'valid' | 'error'>(() =>
    inputs.hasFinishedTyping.value ? validationState.value : 'idle'
  );

  const errorMessage = computed<string | null>(() => {
    const v = validation.value;
    if (v.ok || !v.reason) return null;
    if (!inputs.phone.value) return null;
    return config.errorMessages()?.[v.reason] ?? inputs.messages.value.errorMessages[v.reason];
  });

  const showError = computed<boolean>(() =>
    Boolean(config.showValidation() && inputs.hasFinishedTyping.value && errorMessage.value)
  );

  const showHint = computed<boolean>(
    () => !showError.value && !inputs.phone.value && !!required.value?.format_hint
  );

  const selectedDialCode = computed<string | null>(() => {
    if (!inputs.selectedIso2.value) return null;
    const country: CountryOption | null = deps.getCountryByValue(inputs.selectedIso2.value);
    return country?.raw_data.dial_code ?? null;
  });

  return {
    validation,
    required,
    validationState,
    visibleValidationState,
    errorMessage,
    showError,
    showHint,
    selectedDialCode,
  };
}
