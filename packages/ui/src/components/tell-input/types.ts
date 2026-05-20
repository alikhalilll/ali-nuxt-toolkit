import type { HTMLAttributes } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import type { DetectionStrategy } from '../../composables/useCountryDetection';
import type { PhoneValidationReason } from '../../composables/usePhoneValidation';
import { controlHeight, controlTextSize, type Size } from '../../lib/sizes';

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
  /** Fallback ISO2 when detection fails or is disabled. */
  defaultCountry?: string;
  /** Override the IP geolocation endpoint. Must return JSON with `country_code` or `country`. */
  ipEndpoint?: string;
  /** Localized strings for the country picker UI. */
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  /** Error labels keyed by reason. Each gets a sensible English default. */
  errorMessages?: Partial<Record<PhoneValidationReason, string>>;
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
