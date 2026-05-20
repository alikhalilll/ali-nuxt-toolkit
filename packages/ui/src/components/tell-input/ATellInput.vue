<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { CheckCircle2, AlertCircle } from 'lucide-vue-next';
import { cn } from '../../lib/utils';
import {
  usePhoneValidation,
  type CountryOption,
  type PhoneValidationResult,
} from '../../composables/usePhoneValidation';
import { detectCountry, type DetectCountryOptions } from '../../composables/useCountryDetection';
import { controlPaddingX, controlTextSize, DEFAULT_SIZE } from '../../lib/sizes';
import { aTellInputVariants, DEFAULT_ERROR_MESSAGES, type ATellInputProps } from './types';
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
  defaultCountry: 'US',
  ipEndpoint: 'https://ipapi.co/json/',
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
const country = defineModel<string>('country', { default: '' });

const { getCountries, validate, getRequiredInfo, getCountryByValue } = usePhoneValidation();

void getCountries();

onMounted(async () => {
  if (country.value) return;
  const detectOpts: DetectCountryOptions = {
    strategy: props.detectCountry,
    ipEndpoint: props.ipEndpoint,
    defaultCountry: props.defaultCountry,
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
  if (!country.value && detected) country.value = detected.toUpperCase();
});

watch(
  () => phone.value,
  (next, prev) => {
    const cleaned = String(next ?? '').replace(/\D/g, '');
    if (cleaned !== next && cleaned !== prev) phone.value = cleaned;
  },
  { flush: 'post' }
);

const required = computed(() => (country.value ? getRequiredInfo({ iso2: country.value }) : null));

const validation = computed<PhoneValidationResult>(() =>
  validate({
    country: country.value ? { iso2: country.value } : null,
    phone: phone.value ?? '',
  })
);

const effectivePlaceholder = computed(
  () => props.placeholder || required.value?.format_hint || 'Phone number'
);

const errorMessage = computed(() => {
  const v = validation.value;
  if (v.ok || !v.reason) return null;
  if (!phone.value) return null;
  return props.errorMessages?.[v.reason] ?? DEFAULT_ERROR_MESSAGES[v.reason];
});

const selectedDialCode = computed(() => {
  if (!country.value) return null;
  return getCountryByValue(country.value)?.raw_data.dial_code ?? null;
});

const inputSizeClasses = computed(
  () => `${controlPaddingX[props.size]} ${controlTextSize[props.size]}`
);

const validationState = computed<'idle' | 'valid' | 'error'>(() => {
  if (!phone.value) return 'idle';
  return validation.value.ok ? 'valid' : 'error';
});

defineExpose({ validation, required, selectedDialCode, validationState });
</script>

<template>
  <div :class="cn('flex w-full flex-col gap-1.5', $attrs.class as string)" data-slot="tell-input">
    <div class="flex items-center gap-2">
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
        dir="ltr"
      >
        <slot name="prefix" />

        <ACountrySelect
          v-model:selected="country"
          :allowed-dial-codes="props.allowedDialCodes"
          :disabled="props.disabled || props.loading"
          :size="props.size"
          :search-placeholder="props.searchPlaceholder"
          :empty-text="props.emptyText"
          :loading-text="props.loadingText"
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

        <input
          v-model="phone"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          data-slot="tell-input-field"
          :disabled="props.disabled || props.loading"
          :placeholder="effectivePlaceholder"
          :aria-invalid="validationState === 'error' || undefined"
          :class="
            cn(
              'placeholder:text-muted-foreground h-full w-full min-w-0 flex-1 bg-transparent tabular-nums outline-none disabled:cursor-not-allowed',
              inputSizeClasses,
              props.inputClass
            )
          "
          @input="
            (e) => {
              const target = e.target as HTMLInputElement;
              const cleaned = target.value.replace(/\D/g, '');
              if (cleaned !== target.value) target.value = cleaned;
              phone = cleaned;
            }
          "
        />

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

    <slot
      v-if="props.showValidation && errorMessage"
      name="error"
      :message="errorMessage"
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
      v-else-if="!phone && required?.format_hint"
      name="hint"
      :country="country"
      :format-hint="required.format_hint"
      :example="required.example_e164"
    >
      <p
        data-slot="tell-input-hint"
        :class="cn('text-muted-foreground text-xs tabular-nums', props.hintClass)"
      >
        {{ required.format_hint }}
      </p>
    </slot>
  </div>
</template>
