// Components
export { default as ATelInput } from './components/telInput/index.vue';
export { default as ACountrySelect } from './components/countrySelect/index.vue';
export { default as ACountryFlag } from './components/countryFlag/index.vue';

// Types, variants, defaults
export {
  aTelInputVariants,
  DEFAULT_ERROR_MESSAGES,
  DEFAULT_MESSAGES,
  resolveMessages,
  type ATelInputProps,
  type ATelInputSlots,
  type ATelInputEmits,
  type ATelInputSize,
  type ATelInputVariants,
  type ATelInputDir,
  type ACountrySelectProps,
  type ACountrySelectSlots,
  type ACountrySelectEmits,
  type ACountryFlagProps,
  type ACountryFlagSlots,
  type TelInputMessages,
  type TelInputMessagesInput,
} from './utils/types';
export { defaultFlagUrl, type FlagUrlBuilder } from './utils/flag-url';

// i18n — alternative-numeral normalization
export { normalizeDigits, LOCALE_DIGIT_RANGES } from './utils/digits';

// Composables — co-located with the components since they're tel-input specific.
export * from './composables/usePhoneValidation';
export * from './composables/useCountryDetection';
export * from './composables/useCountryMatching';
export * from './composables/useTypingPhase';
export * from './composables/useTelInputValidation';
