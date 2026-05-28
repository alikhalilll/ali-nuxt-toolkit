// Components
export { default as ATellInput } from './components/ATellInput.vue';
export { default as ACountrySelect } from './components/ACountrySelect.vue';
export { default as ACountryFlag } from './components/ACountryFlag.vue';

// Types, variants, defaults
export {
  aTellInputVariants,
  DEFAULT_ERROR_MESSAGES,
  DEFAULT_MESSAGES,
  resolveMessages,
  type ATellInputProps,
  type ATellInputSlots,
  type ATellInputEmits,
  type ATellInputSize,
  type ATellInputVariants,
  type ATellInputDir,
  type ACountrySelectProps,
  type ACountrySelectSlots,
  type ACountrySelectEmits,
  type ACountryFlagProps,
  type ACountryFlagSlots,
  type TellInputMessages,
  type TellInputMessagesInput,
} from './utils/types';
export { defaultFlagUrl, type FlagUrlBuilder } from './utils/flag-url';

// i18n — alternative-numeral normalization
export { normalizeDigits, LOCALE_DIGIT_RANGES } from './utils/digits';

// Composables — co-located with the components since they're tel-input specific.
export * from './composables/usePhoneValidation';
export * from './composables/useCountryDetection';
export * from './composables/useCountryMatching';
export * from './composables/useTypingPhase';
export * from './composables/useTellInputValidation';
