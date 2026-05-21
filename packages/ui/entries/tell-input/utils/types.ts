import type { HTMLAttributes } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import type { DetectionStrategy } from '../composables/useCountryDetection';
import type { PhoneValidationReason } from '../composables/usePhoneValidation';
import { controlHeight, controlTextSize, type Size } from '@/utils';

/** Alias for the shared `Size` scale — kept for backwards-friendly naming. */
export type ATellInputSize = Size;

export const aTellInputVariants = cva(
  // items-center (not items-stretch) so #prefix/#suffix icons centre vertically without distortion.
  // The country trigger button and the input element both carry `h-full`, so they still fill the
  // field height regardless of this setting.
  'border-input bg-background ring-offset-background focus-within:ring-ring flex w-full items-center overflow-hidden rounded-md border shadow-sm transition-colors focus-within:ring-1 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
  {
    variants: {
      size: {
        xs: `${controlHeight.xs} ${controlTextSize.xs}`,
        sm: `${controlHeight.sm} ${controlTextSize.sm}`,
        md: `${controlHeight.md} ${controlTextSize.md}`,
        lg: `${controlHeight.lg} ${controlTextSize.lg}`,
        xl: `${controlHeight.xl} ${controlTextSize.xl}`,
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export type ATellInputVariants = VariantProps<typeof aTellInputVariants>;

export interface ATellInputProps {
  class?: HTMLAttributes['class'];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: ATellInputSize;
  /**
   * Whitelist of allowed dial-digit codes (no `+`), e.g. `['20', '966']`.
   * Countries outside this list are still shown in the picker but rendered as disabled.
   */
  allowedDialCodes?: string[];
  /** Show validation error text beneath the input when invalid. */
  showValidation?: boolean;
  /**
   * Country auto-detect strategy. Defaults to `'auto'` — try IP geolocation first, then
   * timezone, then `navigator.language`, finally `defaultCountry`.
   */
  detectCountry?: DetectionStrategy;
  /**
   * Initial country. Accepts either an ISO2 code (`'EG'`) or a dial-digit string
   * (`'20'`, `'+20'`). When set, the picker is visible at mount with this country
   * pre-selected — overrides the hidden-until-detected default.
   */
  defaultCountry?: string;
  /** Override the IP geolocation endpoint. Must return JSON with `country_code` or `country`. */
  ipEndpoint?: string;
  /** Localized strings for the country picker UI. */
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  /** Error labels keyed by reason. Each gets a sensible English default. */
  errorMessages?: Partial<Record<PhoneValidationReason, string>>;
  /**
   * When true, the country picker is hidden until a leading dial code is detected in the
   * phone input. Every keystroke runs a longest-prefix match against known dial codes; on
   * first match the picker reveals with that country and the matched dial digits are
   * stripped from `phone`. Skips the onMount IP/timezone/locale detection chain.
   */
  detectFromInput?: boolean;
  /**
   * Debounce window (ms) for `detectFromInput` detection. Each keystroke schedules the
   * libphonenumber parse + lookup; bursts of typing/paste collapse into a single call.
   * Clearing the input is not debounced — the picker hides immediately. Default 150ms.
   */
  detectDebounceMs?: number;
}

export const DEFAULT_ERROR_MESSAGES: Record<PhoneValidationReason, string> = {
  missing_country: 'Please select a country.',
  country_not_supported: 'This country is not supported.',
  phone_has_non_digits: 'Phone number can only contain digits.',
  too_short: 'Phone number is too short.',
  too_long: 'Phone number is too long.',
  invalid_phone: 'Phone number is invalid.',
  parse_failed: 'Could not parse phone number.',
};
