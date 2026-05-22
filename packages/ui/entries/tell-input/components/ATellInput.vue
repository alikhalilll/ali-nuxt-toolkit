<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { CheckCircle2, AlertCircle } from 'lucide-vue-next';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { cn } from '@/utils';
import {
  usePhoneValidation,
  type CountryOption,
  type PhoneValidationResult,
} from '../composables/usePhoneValidation';
import { detectCountry, type DetectCountryOptions } from '../composables/useCountryDetection';
import { controlPaddingX, controlTextSize, DEFAULT_SIZE } from '@/utils';
import { aTellInputVariants, resolveMessages, type ATellInputProps } from '../utils/types';
import { normalizeDigits } from '../utils/digits';
import ACountrySelect from './ACountrySelect.vue';

interface ExtendedProps extends ATellInputProps {
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
  popoverClass?: string;
  drawerClass?: string;
  /** Classes for the inner phone field input element. */
  inputClass?: string;
  /** Classes for the outer wrapper that holds country select + input. */
  fieldClass?: string;
  /** Classes for the helper hint line. */
  hintClass?: string;
  /** Classes for the error message line. */
  errorClass?: string;
}

const props = withDefaults(defineProps<ExtendedProps>(), {
  placeholder: 'Phone number',
  size: DEFAULT_SIZE,
  detectCountry: 'auto',
  defaultCountry: '',
  ipEndpoint: 'https://ipapi.co/json/',
  detectFromInput: true,
  detectDebounceMs: 150,
});

defineSlots<{
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
}>();

const phone = defineModel<string>('phone', { default: '' });
/** Public `v-model:country` — the **dial number** (e.g. `20` for Egypt, `44` for the UK,
 *  `1` for the NANP block). `null` means no country selected. Internally the component
 *  tracks a richer ISO2 code (`selectedIso2`) because dial codes alone can't disambiguate
 *  NANP (`+1` covers 25+ countries) — the picker still needs an exact country. */
const country = defineModel<number | null>('country', { default: null });

/** Internal source of truth — the ISO2 alpha-2 code of the picker selection. Synced with
 *  `country` (dial number) via watchers below. */
const selectedIso2 = ref<string>('');

const { getCountries, validate, getRequiredInfo, getCountryByValue, getCountriesByDial } =
  usePhoneValidation();

void getCountries();

const userPickedCountry = ref(false);
const autoSettingCountry = ref(false);

/** Synchronous dial-digit → ISO2 fallback for common countries, in case the async REST
 *  Countries fetch hasn't populated `getCountriesByDial`'s index yet during setup. */
const DIAL_TO_ISO2_FALLBACK: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '20': 'EG',
  '27': 'ZA',
  '30': 'GR',
  '31': 'NL',
  '32': 'BE',
  '33': 'FR',
  '34': 'ES',
  '39': 'IT',
  '44': 'GB',
  '46': 'SE',
  '47': 'NO',
  '48': 'PL',
  '49': 'DE',
  '52': 'MX',
  '54': 'AR',
  '55': 'BR',
  '60': 'MY',
  '61': 'AU',
  '62': 'ID',
  '63': 'PH',
  '64': 'NZ',
  '65': 'SG',
  '66': 'TH',
  '81': 'JP',
  '82': 'KR',
  '84': 'VN',
  '86': 'CN',
  '90': 'TR',
  '91': 'IN',
  '92': 'PK',
  '95': 'MM',
  '212': 'MA',
  '213': 'DZ',
  '216': 'TN',
  '218': 'LY',
  '234': 'NG',
  '254': 'KE',
  '352': 'LU',
  '353': 'IE',
  '358': 'FI',
  '359': 'BG',
  '380': 'UA',
  '420': 'CZ',
  '421': 'SK',
  '961': 'LB',
  '962': 'JO',
  '963': 'SY',
  '964': 'IQ',
  '965': 'KW',
  '966': 'SA',
  '967': 'YE',
  '968': 'OM',
  '970': 'PS',
  '971': 'AE',
  '972': 'IL',
  '973': 'BH',
  '974': 'QA',
};

/** Accept either an ISO2 code (`'EG'`) or a dial-digit string (`'20'`, `'+20'`).
 *  Returns the canonical ISO2 for downstream consumers, or `''` if it can't resolve. */
function resolveCountryIdentifier(raw: string | undefined | null): string {
  const v = String(raw ?? '').trim();
  if (!v) return '';
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
  const dial = v.replace(/^\+/, '');
  if (!/^\d+$/.test(dial)) return '';
  // Prefer the loaded country index (gives the right answer when multiple share a dial);
  // fall back to the synchronous table when the async list hasn't arrived yet.
  const match = getCountriesByDial(dial)[0];
  if (match) return match.value;
  return DIAL_TO_ISO2_FALLBACK[dial] ?? '';
}

/** Silently resolved via IP/timezone/locale when `detectFromInput` is on — used as a hint
 *  so local-format numbers (e.g. Egyptian `01066105963`) can be parsed without a `+` prefix.
 *  Seeded from `defaultCountry` so it has a usable value before async detection resolves. */
const inferredCountry = ref<string>(resolveCountryIdentifier(props.defaultCountry));

const RECENTS_KEY = 'ali_ui_country_recents_v1';
function readRecents(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

interface DialMatch {
  country: CountryOption;
  /** The national significant number — what `phone` should become, with both dial code
   *  and national prefix (e.g. Egyptian leading `0`) stripped. */
  nationalNumber: string;
}

function matchLeadingDialCode(digits: string): DialMatch | null {
  if (!digits) return null;

  // Tier 1: international parse — disambiguates NANP (+1 ... area code → US/CA/etc.) and
  // returns the canonical NSN with the country calling code already stripped.
  try {
    const parsed = parsePhoneNumberFromString(`+${digits}`);
    if (parsed?.country && parsed.countryCallingCode) {
      const parsedCountry = getCountryByValue(parsed.country);
      if (parsedCountry) {
        return { country: parsedCountry, nationalNumber: String(parsed.nationalNumber ?? '') };
      }
    }
  } catch {
    /* libphonenumber throws on partial input — fall through */
  }

  // Tier 2: national-format parse using the silently-inferred country (IP/timezone/locale)
  // as a hint. Catches local formats like Egyptian `01066105963` where there's no leading
  // dial code to match against. libphonenumber strips the national prefix (the leading 0
  // for EG, etc.) so the resulting `nationalNumber` is the canonical NSN.
  const hint = inferredCountry.value;
  if (hint && digits.length >= 4) {
    try {
      const parsed = parsePhoneNumberFromString(digits, hint as CountryCode);
      if (parsed?.isValid()) {
        const matched = getCountryByValue(parsed.country || hint);
        if (matched) {
          return { country: matched, nationalNumber: String(parsed.nationalNumber ?? '') };
        }
      }
    } catch {
      /* fall through */
    }
  }

  // Tier 3: longest-prefix match over our own dial-digits index — handles partial
  // international input like `44` or `20` before libphonenumber can disambiguate.
  for (let len = Math.min(3, digits.length); len >= 1; len--) {
    const prefix = digits.slice(0, len);
    const group = getCountriesByDial(prefix);
    if (!group.length) continue;
    const nationalNumber = digits.slice(prefix.length);
    if (group.length === 1) return { country: group[0], nationalNumber };
    const current = selectedIso2.value
      ? group.find((c) => c.value === selectedIso2.value.toUpperCase())
      : null;
    if (current) return { country: current, nationalNumber };
    const recents = readRecents();
    const recentHit = recents
      .map((iso2) => group.find((c) => c.value === iso2))
      .find((c): c is CountryOption => Boolean(c));
    if (recentHit) return { country: recentHit, nationalNumber };
    return { country: group[0], nationalNumber };
  }
  return null;
}

onMounted(async () => {
  if (selectedIso2.value) return; // v-model has an initial value — respect it.

  // Explicit `defaultCountry` is treated as the initial picker value (the picker shows
  // immediately) — this is how callers opt out of the hidden-until-detected default. Accepts
  // either an ISO2 code (`'EG'`) or a dial-digit string (`'20'`, `'+20'`).
  if (props.defaultCountry) {
    const seed = resolveCountryIdentifier(props.defaultCountry);
    if (seed) {
      inferredCountry.value = seed;
      autoSettingCountry.value = true;
      selectedIso2.value = seed;
      return;
    }
  }

  // No defaultCountry → run the environment chain. Used as a parsing hint in detect mode,
  // or as the auto-fill source in legacy (`detectFromInput=false`) mode.
  const detectOpts: DetectCountryOptions = {
    strategy: props.detectCountry,
    ipEndpoint: props.ipEndpoint,
    defaultCountry: '',
  };
  let detected: string | null | undefined;
  if (props.detector) {
    try {
      detected = await props.detector(detectOpts);
    } catch {
      detected = null;
    }
  }
  if (!detected) {
    detected = await detectCountry(detectOpts);
  }
  const iso2 = detected ? detected.toUpperCase() : '';

  if (props.detectFromInput) {
    inferredCountry.value = iso2;
    // If the user has already typed something while detection was resolving, re-attempt
    // matching now that we have a hint country for the libphonenumber national-format pass.
    if (phone.value && !userPickedCountry.value && !selectedIso2.value) {
      const match = matchLeadingDialCode(phone.value);
      if (match) {
        autoSettingCountry.value = true;
        selectedIso2.value = match.country.value;
        phone.value = match.nationalNumber;
      }
    }
    return;
  }
  if (!selectedIso2.value && iso2) {
    autoSettingCountry.value = true;
    selectedIso2.value = iso2;
  }
});

/** Compute the dial digits (as a number) for an ISO2 code. Falls back to the synchronous
 *  dial table if the async country list hasn't populated yet. */
function dialNumberFor(iso2: string): number | null {
  if (!iso2) return null;
  const fromIndex = getCountryByValue(iso2)?.raw_data?.dial_digits;
  const digits =
    fromIndex ?? Object.entries(DIAL_TO_ISO2_FALLBACK).find(([, v]) => v === iso2)?.[0];
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** External → internal: when the caller mutates `v-model:country` (dial number), resolve
 *  it to an ISO2. If the current ISO2 already maps to this dial (e.g. user has Canada
 *  selected and the caller writes back `1`), keep the existing selection — don't churn it. */
watch(
  country,
  (next) => {
    if (next == null) {
      if (selectedIso2.value) selectedIso2.value = '';
      return;
    }
    if (dialNumberFor(selectedIso2.value) === next) return; // already in sync
    const iso2 = resolveCountryIdentifier(String(next));
    if (iso2) selectedIso2.value = iso2;
  },
  { immediate: true }
);

/** Internal → external: keep `country` (dial number) in lockstep with `selectedIso2`, and
 *  flag "user manually picked from picker" when the change isn't one we initiated.
 *  `flush: 'sync'` so the `autoSettingCountry` guard is reliable. */
watch(
  selectedIso2,
  (iso2, prev) => {
    const wasAutoSet = autoSettingCountry.value;
    autoSettingCountry.value = false;

    const nextDial = dialNumberFor(iso2);
    if (country.value !== nextDial) country.value = nextDial;

    if (!wasAutoSet && props.detectFromInput && iso2 && prev !== iso2) {
      userPickedCountry.value = true;
    }
  },
  { flush: 'sync' }
);

/** Debounced detection — re-evaluates `phone.value` at the time the timer fires (not the
 *  value captured when scheduled), so a burst of keystrokes collapses into one parse. */
const detectAndApply = useDebounceFn(
  () => {
    if (!props.detectFromInput) return;
    if (userPickedCountry.value || selectedIso2.value) return;
    const current = phone.value;
    if (!current) return;
    const match = matchLeadingDialCode(current);
    if (!match) return;
    autoSettingCountry.value = true;
    selectedIso2.value = match.country.value;
    phone.value = match.nationalNumber;
  },
  computed(() => Math.max(0, props.detectDebounceMs))
);

/** The string shown in the `<input>`. Deliberately decoupled from `phone` (the digits-only
 *  model) so the visible field is NOT rewritten mid-edit — non-digits / alternative numerals
 *  are normalized into `phone` immediately, but the displayed value is only cleaned up once
 *  the user finishes typing (on blur / change). */
const displayValue = ref<string>(String(phone.value ?? ''));

/** Set when the in-flight `phone` change came from the user typing — tells the `phone`
 *  watcher to leave `displayValue` alone (the user is still editing it). */
let phoneEditedByInput = false;

function commitPhone(value: string) {
  phoneEditedByInput = true;
  phone.value = value;
}

function handlePhoneInput(e: Event) {
  const target = e.target as HTMLInputElement;
  // Keep the visible value exactly as typed — don't rewrite it mid-edit. The model still
  // receives a normalized, digits-only value so validation + detection stay correct.
  displayValue.value = target.value;
  // Fold alternative numerals (Arabic-Indic, Persian, …) to ASCII, then strip non-digits.
  const cleaned = normalizeDigits(target.value).replace(/\D/g, '');

  if (props.detectFromInput) {
    if (!cleaned) {
      // Always reset on clear — even after a manual pick. Instant (not debounced) so the
      // picker hides the moment the input goes empty.
      autoSettingCountry.value = true;
      selectedIso2.value = '';
      commitPhone('');
      userPickedCountry.value = false;
      return;
    }
    commitPhone(cleaned);
    if (!userPickedCountry.value && !selectedIso2.value) {
      detectAndApply();
    }
    return;
  }

  commitPhone(cleaned);
}

/** Fires when the user finishes editing (blur). Now it's safe to normalize the visible
 *  value — fold alternative numerals to ASCII and drop any stray non-digits. */
function handlePhoneChange(e: Event) {
  const target = e.target as HTMLInputElement;
  displayValue.value = normalizeDigits(target.value).replace(/\D/g, '');
}

watch(
  () => phone.value,
  (next) => {
    const cleaned = normalizeDigits(String(next ?? '')).replace(/\D/g, '');
    // Normalize a programmatic value that arrived non-clean.
    if (cleaned !== next) {
      phone.value = cleaned;
      return;
    }
    // The user typing manages `displayValue` itself — don't fight their edit.
    if (phoneEditedByInput) {
      phoneEditedByInput = false;
      return;
    }
    // External or detection-driven change → reflect it in the visible input.
    displayValue.value = cleaned;
  },
  { flush: 'post' }
);

/** Resolved UI strings — `messages` prop merged onto English defaults. The individual
 *  string props still win when both are set (see `errorMessage` / template bindings). */
const messages = computed(() => resolveMessages(props.messages));

/** `dir` of the outer wrapper — drives the hint/error text alignment and the country
 *  picker popover. Explicit `'ltr'`/`'rtl'` is applied; `'auto'` or an omitted prop yields
 *  `undefined` so it inherits from the page. The field row itself is always LTR so the
 *  dial prefix / digits / flag trigger keep a consistent order. */
const dirAttr = computed<'ltr' | 'rtl' | undefined>(() =>
  props.dir === 'ltr' || props.dir === 'rtl' ? props.dir : undefined
);

const required = computed(() =>
  selectedIso2.value ? getRequiredInfo({ iso2: selectedIso2.value }, props.locale) : null
);

const validation = computed<PhoneValidationResult>(() =>
  validate({
    country: selectedIso2.value ? { iso2: selectedIso2.value } : null,
    phone: phone.value ?? '',
    locale: props.locale,
  })
);

const effectivePlaceholder = computed(
  () => props.placeholder || required.value?.format_hint || messages.value.phoneInputLabel
);

const errorMessage = computed(() => {
  const v = validation.value;
  if (v.ok || !v.reason) return null;
  if (!phone.value) return null;
  return props.errorMessages?.[v.reason] ?? messages.value.errorMessages[v.reason];
});

const selectedDialCode = computed(() => {
  if (!selectedIso2.value) return null;
  return getCountryByValue(selectedIso2.value)?.raw_data.dial_code ?? null;
});

const inputSizeClasses = computed(
  () => `${controlPaddingX[props.size]} ${controlTextSize[props.size]}`
);

/** Classes for the inline dial-code prefix — a tight `px-2` so it hugs the input digits. */
const dialPrefixClasses = computed(() => `px-2 ${controlTextSize[props.size]}`);

const validationState = computed<'idle' | 'valid' | 'error'>(() => {
  if (!phone.value) return 'idle';
  return validation.value.ok ? 'valid' : 'error';
});

/* ---------------------------------------------------------------
 * Accessibility — the helper line (hint or error) lives in a single
 * `aria-live` region; the input's `aria-describedby` points at it
 * whenever it has content.
 * ------------------------------------------------------------- */
const helperId = useId();
const showError = computed(() => Boolean(props.showValidation && errorMessage.value));
const showHint = computed(() => !showError.value && !phone.value && !!required.value?.format_hint);
const describedBy = computed(() => (showError.value || showHint.value ? helperId : undefined));

defineExpose({ validation, required, selectedDialCode, validationState });
</script>

<template>
  <div
    :class="cn('flex w-full flex-col gap-1.5', $attrs.class as string)"
    data-slot="tell-input"
    :dir="dirAttr"
  >
    <!-- The field row is forced LTR so its pieces (dial prefix, digits, flag trigger) keep
         the same order regardless of page direction — phone numbers read left-to-right. -->
    <div class="flex items-center gap-2" dir="ltr">
      <div
        :class="
          cn(
            aTellInputVariants({ size: props.size }),
            'focus-within:ring-2 focus-within:ring-offset-0',
            validationState === 'idle' && 'focus-within:ring-ring/40',
            validationState === 'valid' &&
              'border-emerald-500/60 ring-1 ring-emerald-500/20 focus-within:ring-emerald-500/40',
            validationState === 'error' &&
              'border-destructive/80 ring-1 ring-destructive/20 focus-within:ring-destructive/40',
            props.class,
            props.fieldClass
          )
        "
        :data-state="validationState"
      >
        <slot name="prefix" />

        <span
          v-if="selectedDialCode"
          data-slot="tell-input-dial"
          dir="ltr"
          aria-hidden="true"
          :class="cn('text-muted-foreground shrink-0 tabular-nums select-none', dialPrefixClasses)"
        >
          {{ selectedDialCode }}
        </span>

        <input
          :value="displayValue"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          dir="ltr"
          data-slot="tell-input-field"
          :disabled="props.disabled || props.loading"
          :placeholder="effectivePlaceholder"
          :aria-label="messages.phoneInputLabel"
          :aria-invalid="validationState === 'error' || undefined"
          :aria-describedby="describedBy"
          :class="
            cn(
              'placeholder:text-muted-foreground h-full w-full min-w-0 flex-1 bg-transparent tabular-nums outline-none disabled:cursor-not-allowed',
              inputSizeClasses,
              selectedDialCode && 'ps-1',
              props.inputClass
            )
          "
          @input="handlePhoneInput"
          @change="handlePhoneChange"
        />

        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          enter-from-class="opacity-0 max-w-0"
          leave-to-class="opacity-0 max-w-0"
          enter-to-class="max-w-[12rem]"
          leave-from-class="max-w-[12rem]"
        >
          <ACountrySelect
            v-if="!props.detectFromInput || selectedIso2"
            v-model:selected="selectedIso2"
            :allowed-dial-codes="props.allowedDialCodes"
            :disabled="props.disabled || props.loading"
            :size="props.size"
            :locale="props.locale"
            :search-placeholder="props.searchPlaceholder ?? messages.searchPlaceholder"
            :empty-text="props.emptyText ?? messages.emptyText"
            :loading-text="props.loadingText ?? messages.loadingText"
            :suggested-label="messages.suggestedLabel"
            :all-countries-label="messages.allCountriesLabel"
            :country-label="messages.countryLabel"
            :select-country-label="messages.selectCountryLabel"
            :flag-url="props.flagUrl"
            :searcher="props.searcher"
            :countries="props.countries"
            :content-class="props.contentClass"
            :popover-class="props.popoverClass"
            :drawer-class="props.drawerClass"
          >
            <template v-if="$slots.trigger" #trigger="slotProps">
              <slot name="trigger" v-bind="slotProps" />
            </template>
            <template v-if="$slots.chevron" #chevron="slotProps">
              <slot name="chevron" v-bind="slotProps" />
            </template>
            <template v-if="$slots.flag" #flag="slotProps">
              <slot name="flag" v-bind="slotProps" />
            </template>
            <template v-if="$slots.item" #item="slotProps">
              <slot name="item" v-bind="slotProps" />
            </template>
            <template v-if="$slots['group-header']" #group-header="slotProps">
              <slot name="group-header" v-bind="slotProps" />
            </template>
            <template v-if="$slots.search" #search="slotProps">
              <slot name="search" v-bind="slotProps" />
            </template>
            <template v-if="$slots.loading" #loading>
              <slot name="loading" />
            </template>
            <template v-if="$slots.empty" #empty="slotProps">
              <slot name="empty" v-bind="slotProps" />
            </template>
          </ACountrySelect>
        </Transition>

        <slot name="suffix" :validation-state="validationState" :validation="validation" />
      </div>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        leave-active-class="transition duration-100 ease-in"
        enter-from-class="opacity-0 scale-90"
        leave-to-class="opacity-0 scale-90"
      >
        <slot v-if="validationState === 'valid'" name="valid-icon">
          <CheckCircle2 class="size-5 shrink-0 text-emerald-500" aria-hidden="true" />
        </slot>
        <slot
          v-else-if="validationState === 'error'"
          name="error-icon"
          :reason="validation.reason ?? ''"
        >
          <AlertCircle class="text-destructive size-5 shrink-0" aria-hidden="true" />
        </slot>
      </Transition>
    </div>

    <div :id="helperId" aria-live="polite">
      <slot
        v-if="showError"
        name="error"
        :message="errorMessage!"
        :reason="validation.reason ?? ''"
        :validation="validation"
      >
        <p
          data-slot="tell-input-error"
          :class="cn('text-destructive text-xs', props.errorClass)"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      </slot>
      <slot
        v-else-if="showHint"
        name="hint"
        :country="selectedIso2"
        :format-hint="required!.format_hint"
        :example="required!.example_e164"
      >
        <p
          data-slot="tell-input-hint"
          :class="cn('text-muted-foreground text-xs tabular-nums', props.hintClass)"
        >
          {{ required!.format_hint }}
        </p>
      </slot>
    </div>
  </div>
</template>
