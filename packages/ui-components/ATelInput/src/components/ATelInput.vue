<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { cn } from '@alikhalilll/a-ui-base';
import { usePhoneValidation } from '../composables/usePhoneValidation';
import { detectCountry, type DetectCountryOptions } from '../composables/useCountryDetection';
import { useCountryMatching } from '../composables/useCountryMatching';
import { useTypingPhase } from '../composables/useTypingPhase';
import { useTelInputValidation } from '../composables/useTelInputValidation';
import { useCountrySelection } from '../composables/useCountrySelection';
import { useSyncedModel } from '../composables/useSyncedModel';
import { DEFAULT_SIZE } from '@alikhalilll/a-ui-base';
import {
  resolveMessages,
  type ATelInputProps,
  type ATelInputSlots,
  type ATelInputEmits,
} from '../types';
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
  validateOn: 'change',
});

const emit = defineEmits<ATelInputEmits>();

defineSlots<ATelInputSlots>();

const phone = defineModel<string>('phone', { default: '' });
/** Public `v-model:country` — the **dial number** (e.g. `20` for Egypt, `44` for the UK,
 *  `1` for the NANP block). `null` means no country selected. Internally the component
 *  tracks a richer ISO2 code (`selectedIso2`) because dial codes alone can't disambiguate
 *  NANP (`+1` covers 25+ countries) — the picker still needs an exact country. */
const country = defineModel<number | null>('country', { default: null });

/**
 * Default v-model — the canonical **E.164** string (e.g. `'+201066105963'`).
 *
 * Single-string contract for VeeValidate's `<Field v-slot="{ field }">` pattern
 * (`v-bind="field"`), native `<form>` submission, or any `v-model="phoneE164"`
 * consumer. Bind it with:
 *
 *   <ATelInput v-model="phoneE164" />
 *
 *   <VeeField v-slot="{ field, errors }" name="phone">
 *     <ATelInput v-bind="field" :error="errors[0]" />
 *   </VeeField>
 *
 * When set externally, the value is parsed via libphonenumber-js → the country
 * picker and the digits-only `phone` model are derived from it. When the user
 * types or picks a country, the composed E.164 is written back out. Stays in
 * sync with `v-model:phone` / `v-model:country` — you can use either contract.
 */
const modelValue = defineModel<string>({ default: '' });

/** The picker selection state machine — `iso2` is the internal source of truth, `source`
 *  records where the current selection came from, `detectionLocked` answers "should
 *  typed-input detection re-route the picker on the next burst?". Single mutator: `set`.
 *  Replaces the historical flag soup (`userPickedCountry` / `autoSettingCountry` /
 *  `inputDetectionApplied`). */
const selection = useCountrySelection();
const selectedIso2 = selection.iso2;

const { getCountries, validate, getRequiredInfo, getCountryByValue, getCountriesByDial } =
  usePhoneValidation();
// Pass the loaded lookups in — useCountryMatching can't call usePhoneValidation() itself
// because each invocation creates a fresh, empty country index.
const { resolveCountryIdentifier, dialNumberFor, matchLeadingDialCode } = useCountryMatching({
  getCountryByValue,
  getCountriesByDial,
});

void getCountries();

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
 * `detectionAttempted` and the debounce timer. `onSettle` decides — once
 * the user pauses — whether to re-route the picker based on what they
 * typed. The decision tree below is the entire detection policy:
 *
 *   1. `detectFromInput` opt-out → bail.
 *   2. `selection.detectionLocked` (user picked, or a previous input-driven
 *      match was already applied) → bail.
 *   3. Empty input → bail.
 *   4. A country is already selected from a *hint* source (`'default'` /
 *      `'env'` / `'external'`) AND the user did NOT type an explicit `+`
 *      prefix → bail. Local-format typing must not get re-routed by tier-3
 *      ambiguous prefix lookups (e.g. `055…` matching Brazil's `+55`).
 *   5. Run the matcher. If it lands on the same country we already have AND
 *      the same national number, only lock detection. Otherwise apply the
 *      new country + stripped national number and lock.
 * ------------------------------------------------------------- */
/** User explicitly picked a country from the picker — locks the selection so subsequent
 *  typed-input detection cannot churn the picker. */
function onPickerPick(iso2: string) {
  selection.set(iso2, 'picker');
}

const typing = useTypingPhase({
  debounceMs: computed(() => Math.max(0, props.detectDebounceMs)),
  onSettle: () => {
    if (!props.detectFromInput) return;
    if (selection.detectionLocked.value) return;
    const current = phone.value;
    if (!current) return;

    const typedInternational = (displayValue.value ?? '').trimStart().startsWith('+');
    if (selectedIso2.value && !typedInternational) return;

    typing.markDetectionAttempt();

    const match = tryMatchPhone(current);
    if (!match) return;

    if (match.country.value === selectedIso2.value && match.nationalNumber === phone.value) {
      // No-op except for the lock — the matcher confirmed our current state.
      selection.source.value = 'input';
      return;
    }
    selection.set(match.country.value, 'input');
    phone.value = match.nationalNumber;
  },
});
const { isDetecting, hasFinishedTyping, detectionAttempted } = typing;

onMounted(async () => {
  if (selectedIso2.value) return; // v-model:country or v-model has an initial value.

  // Explicit `defaultCountry` is the initial picker value (and a parsing hint). Accepts
  // an ISO2 code (`'EG'`) or a dial-digit string (`'20'`, `'+20'`).
  if (props.defaultCountry) {
    const seed = resolveCountryIdentifier(props.defaultCountry);
    if (seed) {
      inferredCountry.value = seed;
      selection.set(seed, 'default');
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
    // If the user typed something while detection was resolving, re-attempt the match
    // now that we have a hint country for libphonenumber's national-format parse.
    if (phone.value && !selection.detectionLocked.value && !selectedIso2.value) {
      const match = tryMatchPhone(phone.value);
      if (match) {
        selection.set(match.country.value, 'input');
        phone.value = match.nationalNumber;
      }
    }
    return;
  }
  if (!selectedIso2.value && iso2) {
    selection.set(iso2, 'env');
  }
});

/* ---------------------------------------------------------------
 * `country` (dial-number model) ↔ `selectedIso2` two-way sync.
 *
 * Replaces the historical pair of manual watchers + `autoSettingCountry` flag.
 * `useSyncedModel` handles the echo-loop guard internally: writes that originate
 * from `compose()` are stamped via `lastEmitted` so the corresponding `apply`
 * call (which fires when Vue's defineModel cascades the write back through the
 * reactivity graph) recognises and skips the echo.
 *
 * When the *caller* writes `v-model:country` from outside (a fresh dial number
 * not derived from us), `apply` runs with `source: 'external'`, leaving
 * `detectionLocked` false — typed-international input is still allowed to
 * override an externally-seeded selection.
 * ------------------------------------------------------------- */
useSyncedModel<number | null>({
  model: country,
  triggers: [selectedIso2],
  compose: () => (selectedIso2.value ? dialNumberFor(selectedIso2.value) : null),
  apply: (next) => {
    if (next == null) {
      selection.clear();
      return;
    }
    if (dialNumberFor(selectedIso2.value) === next) return; // already in sync
    const iso2 = resolveCountryIdentifier(String(next));
    if (iso2) selection.set(iso2, 'external');
  },
});

/** The string shown in the `<input>`. Deliberately decoupled from `phone` (the digits-only
 *  model) so the visible field is NOT rewritten mid-edit — non-digits / alternative numerals
 *  are normalized into `phone` immediately, but the displayed value is only cleaned up once
 *  the user finishes typing (on blur / change). */
const displayValue = ref<string>(String(phone.value ?? ''));

/** Set when the in-flight `phone` change came from the user typing — tells the `phone`
 *  watcher to leave `displayValue` alone (the user is still editing it). */
let phoneEditedByInput = false;

/* ---------------------------------------------------------------
 * Default v-model (E.164 string) ↔ `phone` + `selectedIso2` two-way sync.
 *
 * Single-string contract for VeeValidate's `<Field v-slot="{ field }">` pattern
 * (`v-bind="field"`), native `<form>` submission, or any `v-model="phoneE164"`
 * consumer. Implemented with the same `useSyncedModel` helper used for `country`
 * — one shared echo-loop guard, no hand-rolled flag pair.
 *
 * Crucially, `apply` does NOT write to `displayValue`. The existing `watch(phone)`
 * handler already updates `displayValue` when the change isn't user-driven (i.e.
 * `phoneEditedByInput === false`); and when the user IS mid-typing, it leaves
 * `displayValue` alone. Writing the parsed national number here would clobber
 * what the user just typed — that was the original "typing rewrites to '96610'"
 * bug.
 * ------------------------------------------------------------- */
useSyncedModel<string>({
  model: modelValue,
  triggers: [phone, selectedIso2],
  compose: () => {
    if (!selectedIso2.value || !phone.value) return '';
    return validate({ country: { iso2: selectedIso2.value }, phone: phone.value }).full_phone ?? '';
  },
  apply: (next) => {
    const trimmed = String(next ?? '').trim();
    if (!trimmed) {
      if (phone.value !== '') phone.value = '';
      if (selectedIso2.value !== '') selection.clear();
      return;
    }
    const e164 = trimmed.startsWith('+') ? trimmed : `+${trimmed.replace(/^\+/, '')}`;
    const parsed = parsePhoneNumberFromString(e164);
    if (!parsed || !parsed.country) return;
    if (selectedIso2.value !== parsed.country) {
      selection.set(parsed.country, 'external');
    }
    if (phone.value !== parsed.nationalNumber) phone.value = parsed.nationalNumber;
  },
});

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
    // picker + spinner hide the moment the input goes empty. `selection.clear()` drops
    // both `iso2` and `source` back to the empty/no-country state, re-arming detection.
    typing.reset();
    if (props.detectFromInput) selection.clear();
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
 * pause / blur, localised error message, conditional show flags,
 * external `error` override, etc.).
 * ------------------------------------------------------------- */
/** Set to `true` the first time the input is blurred. Drives `validateOn: 'blur'`. */
const hasBlurred = ref(false);

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
  { phone, selectedIso2, hasFinishedTyping, hasBlurred, messages },
  {
    locale: () => props.locale,
    showValidation: () => props.showValidation,
    errorMessages: () => props.errorMessages,
    validateOn: () => props.validateOn,
    externalError: () => props.error,
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

/* ---------------------------------------------------------------
 * Imperative API — form libraries (VeeValidate, etc.) need to focus
 * the offending field after a failed submit. `inputRef` is also used
 * by `handleBlur` / `handleFocus` to forward the native event.
 * ------------------------------------------------------------- */
const inputRef = ref<HTMLInputElement | null>(null);

function handleBlur(e: FocusEvent) {
  hasBlurred.value = true;
  emit('blur', e);
}
function handleFocus(e: FocusEvent) {
  emit('focus', e);
}

function focus(options?: FocusOptions) {
  inputRef.value?.focus(options);
}
function blur() {
  inputRef.value?.blur();
}
function select() {
  inputRef.value?.select();
}

defineExpose({
  validation,
  required,
  selectedDialCode,
  validationState,
  visibleValidationState,
  isDetecting,
  hasFinishedTyping,
  detectionAttempted,
  focus,
  blur,
  select,
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
          ref="inputRef"
          :value="displayValue"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          dir="ltr"
          data-slot="tel-input-field"
          :name="props.name"
          :disabled="props.disabled || props.loading"
          :placeholder="effectivePlaceholder"
          :aria-label="messages.phoneInputLabel"
          :aria-invalid="visibleValidationState === 'error' || undefined"
          :aria-describedby="describedBy"
          :aria-errormessage="visibleValidationState === 'error' ? helperId : undefined"
          :aria-busy="props.validating || undefined"
          :class="cn('a-tel-input__input', props.inputClass)"
          :data-has-dial="selectedDialCode ? '' : undefined"
          @input="handlePhoneInput"
          @change="handlePhoneChange"
          @blur="handleBlur"
          @focus="handleFocus"
        />

        <!-- Async-validation spinner (e.g. server-side "phone exists?" check). Independent
             of `isDetecting` (which is for country detection) so both can be shown without
             interfering. Lives next to the input and never disables it. -->
        <Transition name="a-tell-detect">
          <div
            v-if="props.validating"
            class="a-tel-input__validating"
            data-slot="tel-input-validating"
            aria-hidden="true"
          >
            <slot name="validating">
              <SpinnerIcon class="a-tel-input__detecting-icon" />
            </slot>
          </div>
        </Transition>

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
              :selected="selectedIso2"
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
              @update:selected="onPickerPick"
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

.a-tel-input__detecting,
.a-tel-input__validating {
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
