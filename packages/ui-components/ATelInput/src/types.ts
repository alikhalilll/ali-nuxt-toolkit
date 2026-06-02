import type { HTMLAttributes } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import type { DetectionStrategy, DetectCountryOptions } from './composables/useCountryDetection';
import type {
  CountryOption,
  PhoneValidationReason,
  PhoneValidationResult,
} from './composables/usePhoneValidation';
import type { ATelInputValidateOn } from './composables/useTelInputValidation';
import type { FlagUrlBuilder } from './utils/flag-url';
import type { Size } from '@alikhalilll/a-ui-base';

export type { ATelInputValidateOn } from './composables/useTelInputValidation';

/** Alias for the shared `Size` scale — kept for backwards-friendly naming. */
export type ATelInputSize = Size;

// Field styling now lives entirely in ATelInput.vue's scoped CSS — sizes/states are driven
// by the `data-size` / `data-state` attributes set in the template. The cva wrapper survives
// so consumers can still call `aTelInputVariants({ size: 'md' })` (returns the field class);
// the per-size class slots are empty placeholders that exist only to preserve the type.
export const aTelInputVariants = cva('a-tel-input__field', {
  variants: {
    size: { xs: '', sm: '', md: '', lg: '', xl: '' },
  },
  defaultVariants: { size: 'md' },
});

export type ATelInputVariants = VariantProps<typeof aTelInputVariants>;

/** Text direction for the field. `'auto'` (or omitting the prop) inherits from the
 *  nearest `[dir]` ancestor / `<html dir>`; `'ltr'` / `'rtl'` force it. */
export type ATelInputDir = 'ltr' | 'rtl' | 'auto';

/**
 * Every user-facing string in the tel-input UI, bundled so a consumer can localize the
 * component in one prop. Each key has an English default in {@link DEFAULT_MESSAGES}.
 */
export interface TelInputMessages {
  /** Placeholder of the country-picker search box. */
  searchPlaceholder: string;
  /** Shown when a search yields no countries. */
  emptyText: string;
  /** Shown while the country list is loading. */
  loadingText: string;
  /** Header of the "Suggested" group (current + recent picks). */
  suggestedLabel: string;
  /** Header of the full country list. */
  allCountriesLabel: string;
  /** Validation error text, keyed by reason. */
  errorMessages: Record<PhoneValidationReason, string>;
  /** Prefix of the country trigger's `aria-label`, e.g. `"Country: Egypt"`. */
  countryLabel: string;
  /** `aria-label` of the country trigger when no country is selected. */
  selectCountryLabel: string;
  /** `aria-label` of the phone input element. */
  phoneInputLabel: string;
}

/** Partial override shape for the `messages` prop — every key (and every error reason) is optional. */
export type TelInputMessagesInput = Partial<Omit<TelInputMessages, 'errorMessages'>> & {
  errorMessages?: Partial<Record<PhoneValidationReason, string>>;
};

export interface ATelInputProps {
  class?: HTMLAttributes['class'];
  /**
   * Default `v-model` — the canonical **E.164** string (e.g. `'+201066105963'`).
   *
   * Reads + writes the full international number as a single value. Designed to drop
   * straight into VeeValidate's `<Field v-slot="{ field }">` pattern (use
   * `v-bind="field"`), native `<form>` submission, or any `v-model="phoneE164"` consumer.
   *
   * Stays in sync with the split `v-model:phone` + `v-model:country` contract — use
   * either, or both.
   */
  modelValue?: string;
  /**
   * Forwarded to the inner `<input name="">`. Set this when participating in a native
   * `<form>` submission, or when a form library (VeeValidate, etc.) wants a stable name.
   */
  name?: string;
  /**
   * Externally controlled error message. When set to a non-empty string the component
   * is forced into the error visual state and renders this message via the `#error`
   * slot — overriding internal libphonenumber validation. Wire this from VeeValidate,
   * Zod, an async server check ("this phone is already registered"), or any custom
   * validation layer.
   *
   * Pass `null` / `undefined` / `''` to defer to internal validation.
   */
  error?: string | null;
  /**
   * `true` while an async validation is in flight (e.g. a server-side uniqueness
   * check). Renders a small spinner inside the field and sets `aria-busy="true"` on
   * the input. Does **not** disable the field — use `loading` for that. Replace the
   * spinner via the `#validating` slot.
   *
   * Designed to be bound to the `validating` ref returned by `useTelField()`.
   */
  validating?: boolean;
  /**
   * When to surface validation in the UI.
   * - `'change'` (default) — visible state mirrors the typing-paused state.
   * - `'blur'` — stays idle until the input has been blurred once (form-library friendly).
   * - `'eager'` — mirror raw validation immediately, no typing pause.
   */
  validateOn?: ATelInputValidateOn;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: ATelInputSize;
  /**
   * Text direction. Omit (or pass `'auto'`) to inherit from the page — RTL pages get an
   * RTL field automatically. Pass `'ltr'` / `'rtl'` to force it.
   */
  dir?: ATelInputDir;
  /**
   * BCP-47 locale (e.g. `'ar'`, `'fr'`). When set, country names render localized via
   * `Intl.DisplayNames` and the format hint uses the locale's numerals.
   */
  locale?: string;
  /**
   * Localized UI strings. A single bag covering the picker, validation errors, and a11y
   * labels. Individual props (`searchPlaceholder`, `emptyText`, `loadingText`,
   * `errorMessages`) take precedence over the matching `messages` key when both are set.
   */
  messages?: TelInputMessagesInput;
  /**
   * Whitelist of allowed dial-digit codes (no `+`), e.g. `['20', '966']`.
   * Countries outside this list are still shown in the picker but rendered as disabled.
   */
  allowedDialCodes?: string[];
  /** Light up the field's validation styling — coloured border + ring on the input and the
   *  error message line below — when the number is valid / invalid. Default `false`, so the
   *  field stays neutral and validation surfacing is left to the consumer (via the
   *  `validation` ref exposure). */
  showValidation?: boolean;
  /** Show the green check / red alert icon at the end of the field. Default `false`; opt
   *  in with `true`. Independent of `showValidation` — you can show the icon without the
   *  coloured field, or vice versa. The slots `#valid-icon` / `#error-icon` still apply. */
  showValidationIcon?: boolean;
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
  /** Override the flag URL builder, forwarded to ACountrySelect. */
  flagUrl?: (iso2: string, width: number) => string;
  /** Custom search predicate, forwarded to ACountrySelect. */
  searcher?: (query: string, country: CountryOption) => boolean;
  /** Provide your own country list, forwarded to ACountrySelect. */
  countries?: CountryOption[];
  /**
   * Fully custom country detection. When provided, this function runs in place of the
   * built-in chain — `detectCountry`-style options are still honored but the function
   * receives them and is free to ignore them.
   */
  detector?: (options: DetectCountryOptions) => Promise<string | null | undefined>;
  /** Forwarded to ACountrySelect: classes for the popover content surface. */
  contentClass?: string;
  /** Forwarded to ACountrySelect: classes for the desktop popover surface. */
  popoverClass?: string;
  /** Forwarded to ACountrySelect: classes for the mobile drawer surface. */
  drawerClass?: string;
  /** Classes for the inner phone field input element. */
  inputClass?: string;
  /** Classes for the outer wrapper that holds country select + input. */
  fieldClass?: string;
  /** Classes for the helper hint line. */
  hintClass?: string;
  /** Classes for the error message line. */
  errorClass?: string;
  /**
   * How page scroll is blocked while the country popover is open. Both `'events'`
   * (the default) and `'body'` are now sticky-safe document-level locks — the host
   * page's `position: sticky` elements (headers, sticky TOC bars, in-page rails) all
   * keep working. `'body'` used to mutate `body { overflow: hidden }` but that
   * silently broke sticky positioning; it was rewritten to share the event-based
   * implementation. Pass `'none'` to leave page scrolling alone.
   */
  scrollLock?: 'events' | 'body' | 'none';
}

/**
 * Props for {@link ACountryFlag} — the standalone flag image component. Renders a
 * `flagcdn` image for an ISO2 code with an automatic text-badge fallback when the
 * image fails to load. Surface separately so it can be used outside `ATelInput`
 * (e.g., in a custom country picker).
 */
export interface ACountryFlagProps {
  /** ISO 3166-1 alpha-2 country code, case-insensitive. */
  iso2: string;
  /** Pixel width served by flagcdn. 40 is crisp at retina up to ~24px wide. */
  width?: number;
  /** Optional explicit URL override. When set, `iso2` / `width` / `flagUrl` are ignored. */
  src?: string | null;
  /** Function `(iso2, width) => string` — fully replace the URL builder. */
  flagUrl?: FlagUrlBuilder;
  alt?: string;
  class?: HTMLAttributes['class'];
}

/**
 * Slot prop shape for {@link ACountryFlag}. The `empty` slot is rendered when no
 * flag URL is available and no ISO2 fallback can be derived.
 */
export interface ACountryFlagSlots {
  /** Rendered when the flag URL is unavailable and no ISO2 text fallback can be derived. */
  empty?: () => unknown;
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

/** English defaults for every {@link TelInputMessages} key. */
export const DEFAULT_MESSAGES: TelInputMessages = {
  searchPlaceholder: 'Search country or +code…',
  emptyText: 'No countries found.',
  loadingText: 'Loading countries…',
  suggestedLabel: 'Suggested',
  allCountriesLabel: 'All countries',
  errorMessages: DEFAULT_ERROR_MESSAGES,
  countryLabel: 'Country',
  selectCountryLabel: 'Select country',
  phoneInputLabel: 'Phone number',
};

/**
 * Merge a partial `messages` override onto the English defaults. Used internally by
 * `ATelInput` to resolve a complete {@link TelInputMessages} object.
 */
export function resolveMessages(input?: TelInputMessagesInput): TelInputMessages {
  if (!input) return DEFAULT_MESSAGES;
  return {
    ...DEFAULT_MESSAGES,
    ...input,
    errorMessages: { ...DEFAULT_ERROR_MESSAGES, ...input.errorMessages },
  };
}

/**
 * Slot prop shape for {@link ATelInput}. Use to get full slot-prop type inference
 * when overriding slots in a consumer template:
 *
 *   <ATelInput #suffix="{ validationState }">…</ATelInput>
 *                     ↑ inferred as `'idle' | 'valid' | 'error'`
 *
 * Or in TypeScript code:
 *   type SuffixProps = Parameters<NonNullable<ATelInputSlots['suffix']>>[0];
 */
export interface ATelInputSlots {
  /** Content before the country select trigger (e.g. an icon). */
  prefix?: () => unknown;
  /** Content between the input and the validation icons. */
  suffix?: (props: {
    validationState: 'idle' | 'valid' | 'error';
    validation: PhoneValidationResult;
  }) => unknown;
  /** Replace the green check shown when the number validates. */
  'valid-icon'?: () => unknown;
  /** Replace the warning icon shown when the number fails validation. */
  'error-icon'?: (props: { reason: string }) => unknown;
  /** Replace the dim helper line shown below the input when empty. */
  hint?: (props: { country: string; formatHint: string; example: string | null }) => unknown;
  /** Replace the error message rendered when invalid. */
  error?: (props: {
    message: string;
    reason: string;
    validation: PhoneValidationResult;
  }) => unknown;
  /** Forwarded to ACountrySelect — replace the trigger button. */
  trigger?: (props: {
    selectedCountry: CountryOption | null;
    open: boolean;
    sizeClasses: string;
  }) => unknown;
  /** Forwarded to ACountrySelect — replace the chevron. */
  chevron?: (props: { open: boolean }) => unknown;
  /** Forwarded — replace any flag rendering. */
  flag?: (props: { country: CountryOption; context: 'trigger' | 'item' }) => unknown;
  /** Forwarded — replace each country list row. */
  item?: (props: {
    country: CountryOption;
    selected: boolean;
    disabled: boolean;
    select: () => void;
  }) => unknown;
  /** Forwarded — section header. */
  'group-header'?: (props: { label: string; group: 'suggested' | 'all' }) => unknown;
  /** Forwarded — search bar. */
  search?: (props: {
    value: string;
    setValue: (v: string) => void;
    isSearching: boolean;
  }) => unknown;
  loading?: () => unknown;
  empty?: (props: { query: string }) => unknown;
  /** Replace the spinner shown in the picker slot during the debounce window. */
  detecting?: () => unknown;
  /** Replace the spinner shown inside the field while async validation is in flight. */
  validating?: () => unknown;
}

/**
 * Emit map for {@link ATelInput}. `update:phone` carries the digits-only string,
 * `update:country` carries the dial-number (not ISO2). Surface for consumers who
 * wire the events manually instead of via `v-model:phone` / `v-model:country`.
 *
 * `blur` / `focus` mirror the inner input's native events — useful for form
 * libraries (VeeValidate's `handleBlur`, etc.).
 */
export type ATelInputEmits = {
  'update:modelValue': [value: string];
  'update:phone': [value: string];
  'update:country': [value: number | null];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
};

/**
 * Imperative API exposed by {@link ATelInput} via `defineExpose`. Grab it with
 * `ref="tellRef"` + `tellRef.value?.focus()` — useful for form libraries that want
 * to focus the offending field after a failed submit.
 */
export interface ATelInputExpose {
  /** Full {@link PhoneValidationResult} for the current input. */
  validation: import('vue').ComputedRef<PhoneValidationResult>;
  /** Format hint + example for the currently selected country, or `null`. */
  required: import('vue').ComputedRef<unknown>;
  /** Selected country's dial code as a `+`-prefixed string (e.g. `+20`), or `null`. */
  selectedDialCode: import('vue').ComputedRef<string | null>;
  /** Raw validation state — not gated by typing pause / blur / `showValidation`. */
  validationState: import('vue').ComputedRef<'idle' | 'valid' | 'error'>;
  /** Surfacing-gated validation state — the one the UI actually displays. */
  visibleValidationState: import('vue').ComputedRef<'idle' | 'valid' | 'error'>;
  isDetecting: Readonly<import('vue').Ref<boolean>>;
  hasFinishedTyping: Readonly<import('vue').Ref<boolean>>;
  detectionAttempted: Readonly<import('vue').Ref<boolean>>;
  /** Programmatically focus the inner `<input>`. */
  focus(options?: FocusOptions): void;
  /** Programmatically blur the inner `<input>`. */
  blur(): void;
  /** Programmatically select the inner `<input>`'s text. */
  select(): void;
}

/**
 * Props for {@link ACountrySelect} — the standalone country picker. Surface
 * separately so it can be used outside `ATelInput` with full type support.
 */
export interface ACountrySelectProps {
  class?: HTMLAttributes['class'];
  triggerClass?: HTMLAttributes['class'];
  contentClass?: HTMLAttributes['class'];
  popoverClass?: HTMLAttributes['class'];
  drawerClass?: HTMLAttributes['class'];
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  suggestedLabel?: string;
  allCountriesLabel?: string;
  /** ISO2 codes that are selectable. Others are listed but disabled. */
  allowedDialCodes?: string[];
  disabled?: boolean;
  /** Drives the trigger button padding + text size. Matches ATelInput's `size`. */
  size?: ATelInputSize;
  /** Max items rendered under the "Suggested" header (current + recents, deduped). */
  suggestedLimit?: number;
  /** Cap the number of matching countries shown in search results. */
  maxResults?: number;
  /** Override the flag URL builder, e.g. `(iso, w) => `/flags/${iso}.svg``. */
  flagUrl?: (iso2: string, width: number) => string;
  /** Custom search predicate. Default: substring match on the precomputed `search_key`. */
  searcher?: (query: string, country: CountryOption) => boolean;
  /** Provide your own country list (bypasses the REST Countries fetch). */
  countries?: CountryOption[];
  /** Override the right-side kbd hints. Pass `null` to hide. */
  kbdOpen?: string | null;
  kbdClose?: string | null;
  /** BCP-47 locale — country names render localized via `Intl.DisplayNames`. */
  locale?: string;
  /** Prefix of the trigger's `aria-label` when a country is selected, e.g. `"Country"`. */
  countryLabel?: string;
  /** Trigger's `aria-label` when no country is selected. */
  selectCountryLabel?: string;
  /**
   * How page scroll is blocked while the popover is open. Both `'events'` (default)
   * and `'body'` are sticky-safe document-level locks; `'none'` disables locking.
   * See {@link ATelInputProps.scrollLock} for the full rationale.
   */
  scrollLock?: 'events' | 'body' | 'none';
}

/**
 * Slot prop shape for {@link ACountrySelect}. Forwarded versions of these slots
 * also appear on {@link ATelInputSlots} (`trigger`, `chevron`, `flag`, `item`,
 * etc.) — keep them in sync when changing one.
 */
export interface ACountrySelectSlots {
  /** Replace the entire country picker trigger button. */
  trigger?: (props: {
    selectedCountry: CountryOption | null;
    open: boolean;
    sizeClasses: string;
  }) => unknown;
  /** Replace the chevron icon. */
  chevron?: (props: { open: boolean }) => unknown;
  /**
   * Replace the selected-state label rendered inside the trigger button.
   *
   * Use this for trigger-only customisation — e.g. rendering flag + country
   * name + dial code as one composed cell — without affecting how each row
   * in the popover's country list renders. The picker's option items use
   * {@link ACountrySelectSlots['item-flag']} (or fall back to {@link flag}).
   *
   * Receives the currently-selected country and the open state. Falls back
   * to the legacy unified `flag` slot (with `context: 'trigger'`) when not
   * provided, so consumers built against earlier versions keep working.
   */
  'selected-flag'?: (props: { country: CountryOption; open: boolean }) => unknown;
  /**
   * Replace just the flag rendered for each row inside the popover's country
   * list. The trigger has its own dedicated {@link selected-flag} slot now —
   * use this to customise the option rows without touching the trigger.
   *
   * Falls back to the legacy unified `flag` slot (with `context: 'item'`)
   * for back-compat.
   */
  'item-flag'?: (props: { country: CountryOption }) => unknown;
  /**
   * Legacy unified flag slot. Still fires for BOTH the trigger and each
   * option row (with `context` indicating which) so existing consumers keep
   * working; new code should prefer {@link selected-flag} or
   * {@link item-flag} to target one location at a time.
   */
  flag?: (props: { country: CountryOption; context: 'trigger' | 'item' }) => unknown;
  /** Replace the entire search bar (input + icon + kbd). */
  search?: (props: {
    value: string;
    setValue: (v: string) => void;
    isSearching: boolean;
  }) => unknown;
  /** Replace the search-bar leading icon. */
  'search-icon'?: () => unknown;
  /** Replace the loading state. */
  loading?: () => unknown;
  /** Replace the empty/no-results state. */
  empty?: (props: { query: string }) => unknown;
  /** Replace a section header. */
  'group-header'?: (props: { label: string; group: 'suggested' | 'all' }) => unknown;
  /** Replace each country list row. */
  item?: (props: {
    country: CountryOption;
    selected: boolean;
    disabled: boolean;
    select: () => void;
  }) => unknown;
  /** Replace just the right-side check icon for the selected row. */
  'item-check'?: (props: { country: CountryOption }) => unknown;
}

/**
 * Emit map for {@link ACountrySelect}. The `selected` is `v-model:selected`,
 * carrying the ISO2 code of the picked country.
 */
export type ACountrySelectEmits = {
  'update:selected': [value: string];
};
