<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-vue-next';
import { cn } from '@/utils';
import {
  usePhoneValidation,
  type CountryOption,
  type PhoneValidationResult,
} from '../composables/usePhoneValidation';
import { detectCountry, type DetectCountryOptions } from '../composables/useCountryDetection';
import { useCountryMatching } from '../composables/useCountryMatching';
import { useTypingPhase } from '../composables/useTypingPhase';
import { useTellInputValidation } from '../composables/useTellInputValidation';
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
  /**
   * How page scroll is blocked while the country popover is open. Defaults to `'events'`
   * (sticky-safe document-level lock). Pass `'body'` for the legacy
   * `body { overflow: hidden }` lock, or `'none'` to leave page scrolling alone.
   */
  scrollLock?: 'events' | 'body' | 'none';
}

const props = withDefaults(defineProps<ExtendedProps>(), {
  placeholder: 'Phone number',
  size: DEFAULT_SIZE,
  detectCountry: 'auto',
  defaultCountry: '',
  ipEndpoint: 'https://ipapi.co/json/',
  detectFromInput: true,
  detectDebounceMs: 800,
  showValidationIcon: false,
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
  /** Replace the spinner shown in the picker slot during the debounce window. */
  detecting?: () => unknown;
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
// Pass the loaded lookups in — useCountryMatching can't call usePhoneValidation() itself
// because each invocation creates a fresh, empty country index.
const { resolveCountryIdentifier, dialNumberFor, matchLeadingDialCode } = useCountryMatching({
  getCountryByValue,
  getCountriesByDial,
});

void getCountries();

const userPickedCountry = ref(false);
const autoSettingCountry = ref(false);

/** Silently resolved via IP/timezone/locale when `detectFromInput` is on — used as a hint
 *  so local-format numbers (e.g. Egyptian `01066105963`) can be parsed without a `+` prefix.
 *  Seeded from `defaultCountry` so it has a usable value before async detection resolves. */
const inferredCountry = ref<string>(resolveCountryIdentifier(props.defaultCountry));

/** Closure passed everywhere the matcher needs typing context (hint country + current
 *  selection for tier-3 tie-breaks). Avoids re-reading `selectedIso2`/`inferredCountry`
 *  at every call site. */
function tryMatchPhone(digits: string) {
  return matchLeadingDialCode(digits, {
    hintCountry: inferredCountry.value,
    currentIso2: selectedIso2.value,
  });
}

/* ---------------------------------------------------------------
 * Typing-phase state machine — owns `isDetecting`, `hasFinishedTyping`,
 * `detectionAttempted` and the debounce timer. The `onSettle` callback
 * runs at the end of every debounce window: it short-circuits when
 * detection is disabled / the user already picked / input is empty,
 * otherwise marks a detection attempt and applies any match.
 * ------------------------------------------------------------- */
const typing = useTypingPhase({
  debounceMs: computed(() => Math.max(0, props.detectDebounceMs)),
  onSettle: () => {
    if (!props.detectFromInput) return;
    if (userPickedCountry.value || selectedIso2.value) return;
    const current = phone.value;
    if (!current) return;

    typing.markDetectionAttempt();

    const match = tryMatchPhone(current);
    if (!match) return;
    autoSettingCountry.value = true;
    selectedIso2.value = match.country.value;
    phone.value = match.nationalNumber;
  },
});
const { isDetecting, hasFinishedTyping, detectionAttempted } = typing;

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
      const match = tryMatchPhone(phone.value);
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

  if (!cleaned) {
    // Always reset on clear — even after a manual pick. Instant (not debounced) so the
    // picker + spinner hide the moment the input goes empty.
    typing.reset();
    if (props.detectFromInput) {
      autoSettingCountry.value = true;
      selectedIso2.value = '';
      userPickedCountry.value = false;
    }
    commitPhone('');
    return;
  }

  typing.markTyping();
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

/* ---------------------------------------------------------------
 * Validation facade — wraps the raw `usePhoneValidation` calls and
 * produces the view-layer surface (visible state gated by the typing
 * pause, localised error message, conditional show flags, etc.).
 * ------------------------------------------------------------- */
const {
  validation,
  required,
  validationState,
  visibleValidationState,
  errorMessage,
  showError,
  showHint,
  selectedDialCode,
} = useTellInputValidation(
  { validate, getRequiredInfo, getCountryByValue },
  { phone, selectedIso2, hasFinishedTyping, messages },
  {
    locale: () => props.locale,
    showValidation: () => props.showValidation,
    errorMessages: () => props.errorMessages,
  }
);

const effectivePlaceholder = computed(
  () => props.placeholder || required.value?.format_hint || messages.value.phoneInputLabel
);

const inputSizeClasses = computed(
  () => `${controlPaddingX[props.size]} ${controlTextSize[props.size]}`
);

/** Classes for the inline dial-code prefix — a tight `px-2` so it hugs the input digits. */
const dialPrefixClasses = computed(() => `px-2 ${controlTextSize[props.size]}`);

/* ---------------------------------------------------------------
 * Accessibility — the helper line (hint or error) lives in a single
 * `aria-live` region; the input's `aria-describedby` points at it
 * whenever it has content.
 * ------------------------------------------------------------- */
const helperId = useId();
const describedBy = computed(() => (showError.value || showHint.value ? helperId : undefined));

defineExpose({
  validation,
  required,
  selectedDialCode,
  validationState,
  visibleValidationState,
  isDetecting,
  hasFinishedTyping,
  detectionAttempted,
});
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
            // Validation field colors are an opt-in via `showValidation` — by default the
            // field stays neutral and the consumer drives error rendering from `validation`.
            (!props.showValidation || visibleValidationState === 'idle') &&
              'focus-within:ring-ring/40',
            props.showValidation &&
              visibleValidationState === 'valid' &&
              'border-emerald-500/60 ring-1 ring-emerald-500/20 focus-within:ring-emerald-500/40',
            props.showValidation &&
              visibleValidationState === 'error' &&
              'border-destructive/80 ring-1 ring-destructive/20 focus-within:ring-destructive/40',
            props.class,
            props.fieldClass
          )
        "
        :data-state="visibleValidationState"
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
          :aria-invalid="visibleValidationState === 'error' || undefined"
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

        <!-- Detection-in-flight spinner — shown only during the first debounce window,
             before the picker has appeared. Once the picker is visible (success OR a failed
             attempt that revealed the empty picker) we stop re-flashing on every keystroke. -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          enter-from-class="opacity-0 max-w-0"
          leave-to-class="opacity-0 max-w-0"
          enter-to-class="max-w-[2.5rem]"
          leave-from-class="max-w-[2.5rem]"
        >
          <div
            v-if="isDetecting && !selectedIso2 && !detectionAttempted"
            class="text-muted-foreground inline-flex h-full shrink-0 items-center px-2"
            aria-hidden="true"
            data-slot="tell-input-detecting"
          >
            <slot name="detecting">
              <Loader2 class="size-4 animate-spin" />
            </slot>
          </div>
        </Transition>

        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          enter-from-class="opacity-0 max-w-0"
          leave-to-class="opacity-0 max-w-0"
          enter-to-class="max-w-[12rem]"
          leave-from-class="max-w-[12rem]"
        >
          <!-- Wrapper div gives the <Transition> a single element root to animate.
               ACountrySelect's root is the AResponsivePopover fragment (Popover/Drawer
               swap), which a Transition can't animate directly — without this wrapper
               Vue logs "Component inside <Transition> renders non-element root node". -->
          <div
            v-if="!props.detectFromInput || selectedIso2 || detectionAttempted"
            class="inline-flex h-full shrink-0 items-center"
            data-slot="tell-input-country-wrapper"
          >
            <ACountrySelect
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
              :scroll-lock="props.scrollLock"
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
          </div>
        </Transition>

        <slot name="suffix" :validation-state="validationState" :validation="validation" />
      </div>

      <Transition
        v-if="props.showValidationIcon"
        enter-active-class="transition duration-150 ease-out"
        leave-active-class="transition duration-100 ease-in"
        enter-from-class="opacity-0 scale-90"
        leave-to-class="opacity-0 scale-90"
      >
        <slot v-if="visibleValidationState === 'valid'" name="valid-icon">
          <CheckCircle2 class="size-5 shrink-0 text-emerald-500" aria-hidden="true" />
        </slot>
        <slot
          v-else-if="visibleValidationState === 'error'"
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
