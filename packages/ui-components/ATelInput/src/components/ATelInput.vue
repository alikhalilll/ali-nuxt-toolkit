<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { usePhoneValidation } from '../composables/usePhoneValidation';
import { detectCountry, type DetectCountryOptions } from '../composables/useCountryDetection';
import { useCountryMatching } from '../composables/useCountryMatching';
import { useTypingPhase } from '../composables/useTypingPhase';
import { useTelInputValidation } from '../composables/useTelInputValidation';
import { DEFAULT_SIZE } from '@alikhalilll/a-ui-base';
import { resolveMessages, type ATelInputProps, type ATelInputSlots } from '../types';
import { normalizeDigits } from '../utils/digits';
import ACountrySelect from './ACountrySelect.vue';
import { CheckCircleIcon, AlertCircleIcon, SpinnerIcon } from '../icons';

const props = withDefaults(defineProps<ATelInputProps>(), {
  placeholder: 'Phone number',
  size: DEFAULT_SIZE,
  detectCountry: 'auto',
  defaultCountry: '',
  ipEndpoint: 'https://ipapi.co/json/',
  detectFromInput: true,
  detectDebounceMs: 800,
  showValidationIcon: false,
});

defineSlots<ATelInputSlots>();

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
} = useTelInputValidation(
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
    :class="cn('a-tel-input', $attrs.class as string)"
    :data-size="props.size"
    :data-state="visibleValidationState"
    :data-show-validation="props.showValidation ? '' : undefined"
    data-slot="tel-input"
    :dir="dirAttr"
  >
    <!-- The field row is forced LTR so its pieces (dial prefix, digits, flag trigger) keep
         the same order regardless of page direction — phone numbers read left-to-right. -->
    <div class="a-tel-input__row" dir="ltr">
      <div
        :class="cn('a-tel-input__field', props.class, props.fieldClass)"
        :data-state="visibleValidationState"
      >
        <slot name="prefix" />

        <span
          v-if="selectedDialCode"
          data-slot="tel-input-dial"
          dir="ltr"
          aria-hidden="true"
          class="a-tel-input__dial"
        >
          {{ selectedDialCode }}
        </span>

        <input
          :value="displayValue"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          dir="ltr"
          data-slot="tel-input-field"
          :disabled="props.disabled || props.loading"
          :placeholder="effectivePlaceholder"
          :aria-label="messages.phoneInputLabel"
          :aria-invalid="visibleValidationState === 'error' || undefined"
          :aria-describedby="describedBy"
          :class="cn('a-tel-input__input', props.inputClass)"
          :data-has-dial="selectedDialCode ? '' : undefined"
          @input="handlePhoneInput"
          @change="handlePhoneChange"
        />

        <!-- Detection-in-flight spinner — shown only during the first debounce window,
             before the picker has appeared. Once the picker is visible (success OR a failed
             attempt that revealed the empty picker) we stop re-flashing on every keystroke. -->
        <Transition name="a-tell-detect">
          <div
            v-if="isDetecting && !selectedIso2 && !detectionAttempted"
            class="a-tel-input__detecting"
            aria-hidden="true"
            data-slot="tel-input-detecting"
          >
            <slot name="detecting">
              <SpinnerIcon class="a-tel-input__detecting-icon" />
            </slot>
          </div>
        </Transition>

        <Transition name="a-tell-country">
          <!-- Wrapper div gives the <Transition> a single element root to animate.
               ACountrySelect's root is the AResponsivePopover fragment (Popover/Drawer
               swap), which a Transition can't animate directly — without this wrapper
               Vue logs "Component inside <Transition> renders non-element root node". -->
          <div
            v-if="!props.detectFromInput || selectedIso2 || detectionAttempted"
            class="a-tel-input__country-wrapper"
            data-slot="tel-input-country-wrapper"
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

      <Transition v-if="props.showValidationIcon" name="a-tell-icon">
        <slot v-if="visibleValidationState === 'valid'" name="valid-icon">
          <CheckCircleIcon class="a-tel-input__icon a-tel-input__icon--valid" />
        </slot>
        <slot
          v-else-if="visibleValidationState === 'error'"
          name="error-icon"
          :reason="validation.reason ?? ''"
        >
          <AlertCircleIcon class="a-tel-input__icon a-tel-input__icon--error" />
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
          data-slot="tel-input-error"
          :class="cn('a-tel-input__error', props.errorClass)"
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
        <p data-slot="tel-input-hint" :class="cn('a-tel-input__hint', props.hintClass)">
          {{ required!.format_hint }}
        </p>
      </slot>
    </div>
  </div>
</template>

<style scoped>
/* ------------------------------------------------------------
 * ATelInput — scoped CSS. All colors map to the global
 * --ak-ui-* design tokens (defined in assets/styles.src.css) so
 * dark mode + consumer theme overrides keep working.
 * ---------------------------------------------------------- */
.a-tel-input {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.375rem;
}

.a-tel-input__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.a-tel-input__field {
  display: flex;
  width: 100%;
  align-items: center;
  overflow: hidden;
  border: 1px solid hsl(var(--ak-ui-input));
  background: hsl(var(--ak-ui-background));
  border-radius: calc(var(--ak-ui-radius) - 2px);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition:
    border-color 150ms,
    box-shadow 150ms;
}

.a-tel-input__field:focus-within {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ak-ui-ring) / 0.4);
}

.a-tel-input__field:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Validation field colors — opt-in via `data-show-validation` on the root. */
.a-tel-input[data-show-validation] .a-tel-input__field[data-state='valid'] {
  border-color: rgb(16 185 129 / 0.6);
  box-shadow: 0 0 0 1px rgb(16 185 129 / 0.2);
}
.a-tel-input[data-show-validation] .a-tel-input__field[data-state='valid']:focus-within {
  box-shadow: 0 0 0 2px rgb(16 185 129 / 0.4);
}
.a-tel-input[data-show-validation] .a-tel-input__field[data-state='error'] {
  border-color: hsl(var(--ak-ui-destructive) / 0.8);
  box-shadow: 0 0 0 1px hsl(var(--ak-ui-destructive) / 0.2);
}
.a-tel-input[data-show-validation] .a-tel-input__field[data-state='error']:focus-within {
  box-shadow: 0 0 0 2px hsl(var(--ak-ui-destructive) / 0.4);
}

/* Size variants — values mirror the shared Size scale (see utils/sizes.ts). */
.a-tel-input[data-size='xs'] .a-tel-input__field {
  height: 1.75rem;
  font-size: 0.75rem;
  line-height: 1rem;
}
.a-tel-input[data-size='sm'] .a-tel-input__field {
  height: 2.25rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.a-tel-input[data-size='md'] .a-tel-input__field {
  height: 43px;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.a-tel-input[data-size='lg'] .a-tel-input__field {
  height: 52px;
  font-size: 1rem;
  line-height: 1.5rem;
}
.a-tel-input[data-size='xl'] .a-tel-input__field {
  height: 60px;
  font-size: 1rem;
  line-height: 1.5rem;
}

.a-tel-input__dial {
  flex-shrink: 0;
  color: hsl(var(--ak-ui-muted-foreground));
  font-variant-numeric: tabular-nums;
  user-select: none;
  padding: 0 0.5rem;
}
.a-tel-input[data-size='xs'] .a-tel-input__dial {
  font-size: 0.75rem;
}
.a-tel-input[data-size='sm'] .a-tel-input__dial,
.a-tel-input[data-size='md'] .a-tel-input__dial {
  font-size: 0.875rem;
}
.a-tel-input[data-size='lg'] .a-tel-input__dial,
.a-tel-input[data-size='xl'] .a-tel-input__dial {
  font-size: 1rem;
}

.a-tel-input__input {
  height: 100%;
  width: 100%;
  min-width: 0;
  flex: 1;
  background: transparent;
  font-variant-numeric: tabular-nums;
  outline: none;
  border: 0;
  color: inherit;
  font: inherit;
}

.a-tel-input__input::placeholder {
  color: hsl(var(--ak-ui-muted-foreground));
}
.a-tel-input__input:disabled {
  cursor: not-allowed;
}
.a-tel-input__input[data-has-dial] {
  padding-inline-start: 0.25rem;
}

/* Per-size horizontal padding for the input itself. */
.a-tel-input[data-size='xs'] .a-tel-input__input {
  padding-inline: 0.5rem;
}
.a-tel-input[data-size='sm'] .a-tel-input__input {
  padding-inline: 0.625rem;
}
.a-tel-input[data-size='md'] .a-tel-input__input {
  padding-inline: 0.75rem;
}
.a-tel-input[data-size='lg'] .a-tel-input__input {
  padding-inline: 0.875rem;
}
.a-tel-input[data-size='xl'] .a-tel-input__input {
  padding-inline: 1rem;
}
/* When the dial prefix is present, the input already inherits ps-1 via [data-has-dial]; collapse start padding. */
.a-tel-input__input[data-has-dial] {
  padding-inline-start: 0.25rem;
}

.a-tel-input__detecting {
  display: inline-flex;
  height: 100%;
  flex-shrink: 0;
  align-items: center;
  padding: 0 0.5rem;
  color: hsl(var(--ak-ui-muted-foreground));
}
.a-tel-input__detecting-icon {
  width: 1rem;
  height: 1rem;
}

.a-tel-input__country-wrapper {
  display: inline-flex;
  height: 100%;
  flex-shrink: 0;
  align-items: center;
}

.a-tel-input__icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}
.a-tel-input__icon--valid {
  color: rgb(16 185 129);
}
.a-tel-input__icon--error {
  color: hsl(var(--ak-ui-destructive));
}

.a-tel-input__error {
  color: hsl(var(--ak-ui-destructive));
  font-size: 0.75rem;
  line-height: 1rem;
  margin: 0;
}

.a-tel-input__hint {
  color: hsl(var(--ak-ui-muted-foreground));
  font-size: 0.75rem;
  line-height: 1rem;
  font-variant-numeric: tabular-nums;
  margin: 0;
}

/* Detecting spinner transition (collapsible width + fade). */
.a-tell-detect-enter-active {
  transition:
    opacity 200ms ease-out,
    max-width 200ms ease-out;
  overflow: hidden;
}
.a-tell-detect-leave-active {
  transition:
    opacity 150ms ease-in,
    max-width 150ms ease-in;
  overflow: hidden;
}
.a-tell-detect-enter-from,
.a-tell-detect-leave-to {
  opacity: 0;
  max-width: 0;
}
.a-tell-detect-enter-to,
.a-tell-detect-leave-from {
  opacity: 1;
  max-width: 2.5rem;
}

/* Country picker reveal/hide transition. */
.a-tell-country-enter-active {
  transition:
    opacity 200ms ease-out,
    max-width 200ms ease-out;
  overflow: hidden;
}
.a-tell-country-leave-active {
  transition:
    opacity 150ms ease-in,
    max-width 150ms ease-in;
  overflow: hidden;
}
.a-tell-country-enter-from,
.a-tell-country-leave-to {
  opacity: 0;
  max-width: 0;
}
.a-tell-country-enter-to,
.a-tell-country-leave-from {
  opacity: 1;
  max-width: 12rem;
}

/* Validation icon swap. */
.a-tell-icon-enter-active {
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}
.a-tell-icon-leave-active {
  transition:
    opacity 100ms ease-in,
    transform 100ms ease-in;
}
.a-tell-icon-enter-from,
.a-tell-icon-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
