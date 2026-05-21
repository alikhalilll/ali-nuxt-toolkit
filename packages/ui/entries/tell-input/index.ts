// Components
export { default as ATellInput } from './components/ATellInput.vue';
export { default as ACountrySelect } from './components/ACountrySelect.vue';
export { default as ACountryFlag } from './components/ACountryFlag.vue';

// Types, variants, defaults
export {
  aTellInputVariants,
  DEFAULT_ERROR_MESSAGES,
  type ATellInputProps,
  type ATellInputSize,
  type ATellInputVariants,
} from './utils/types';
export { defaultFlagUrl, type FlagUrlBuilder } from './utils/flag-url';

// Composables — co-located with the components since they're tel-input specific.
export * from './composables/usePhoneValidation';
export * from './composables/useCountryDetection';
