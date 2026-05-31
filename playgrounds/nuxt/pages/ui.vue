<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { PhoneIcon, ShieldCheckIcon, ShieldXIcon, SparklesIcon } from '~/components/icons';
import {
  ATelInput,
  defaultFlagUrl,
  type CountryOption,
  type FlagUrlBuilder,
} from '@alikhalilll/a-tel-input';
import { useTelField } from '@alikhalilll/a-tel-input/vee-validate';
import { zPhone } from '@alikhalilll/a-tel-input/zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const phone = ref('');
const country = ref<number | null>(null);
const allowedOnly = ref<string[]>([]);
const allowOnlyEgypt = ref(false);
const showValidation = ref(true);
const showValidationIcon = ref(false);
const detectMode = ref<'auto' | 'locale' | 'none'>('auto');
const detectFromInput = ref(true);
const theme = ref<'dark' | 'light'>('dark');
const size = ref<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

/* Customization showcase — second instance demonstrating slots + override props. */
const customPhone = ref('');
const customCountry = ref<number | null>(null);

/* i18n showcase — Arabic locale, RTL, localized messages. */
const i18nPhone = ref('');
const i18nCountry = ref<number | null>(null);
const arabicMessages = {
  searchPlaceholder: 'ابحث عن دولة أو +رمز…',
  emptyText: 'لا توجد دول.',
  loadingText: 'جارٍ تحميل الدول…',
  suggestedLabel: 'مقترحة',
  allCountriesLabel: 'كل الدول',
  phoneInputLabel: 'رقم الهاتف',
  selectCountryLabel: 'اختر دولة',
  countryLabel: 'الدولة',
  errorMessages: {
    too_short: 'الرقم قصير جدًا',
    too_long: 'الرقم طويل جدًا',
    invalid_phone: 'الرقم غير صحيح',
  },
};

const curated: CountryOption[] = [
  mkCountry('EG', 'Egypt', '+20'),
  mkCountry('SA', 'Saudi Arabia', '+966'),
  mkCountry('AE', 'United Arab Emirates', '+971'),
  mkCountry('KW', 'Kuwait', '+965'),
  mkCountry('QA', 'Qatar', '+974'),
];

function mkCountry(iso2: string, name: string, dial: string): CountryOption {
  const dial_digits = dial.replace(/\D/g, '');
  return {
    label: `${name} (${dial})`,
    value: iso2,
    search_key: `${name.toLowerCase()} ${dial} ${iso2.toLowerCase()} ${dial_digits}`,
    raw_data: {
      iso2,
      dial_code: dial,
      dial_digits,
      name,
      flag: null,
      source: 'fallback',
      original: {},
    },
  };
}

const hiResFlag: FlagUrlBuilder = (iso2) => defaultFlagUrl(iso2, 80);

function startsWithSearcher(query: string, c: CountryOption) {
  const q = query.toLowerCase().trim();
  return (
    c.raw_data.name.toLowerCase().startsWith(q) ||
    c.raw_data.dial_digits.includes(q.replace(/^\+/, ''))
  );
}

async function alwaysEgypt() {
  return 'EG';
}

const tellRef = ref<InstanceType<typeof ATelInput> | null>(null);

const validation = computed(() => tellRef.value?.validation);
const required = computed(() => tellRef.value?.required);
const dialCode = computed(() => tellRef.value?.selectedDialCode);

function syncAllowed(on: boolean) {
  allowOnlyEgypt.value = on;
  allowedOnly.value = on ? ['20'] : [];
}

function applyTheme(next: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', next === 'dark');
  document.documentElement.classList.toggle('light', next === 'light');
}

onMounted(() => applyTheme(theme.value));
watch(theme, (t) => applyTheme(t));

/* ----------------------------------------------------------------------------
 * VeeValidate + Zod + server-side validation showcase
 * -------------------------------------------------------------------------- */
function fakePhoneExistsCheck(value: string): Promise<{ exists: boolean }> {
  return new Promise((resolve) => {
    // Pretend the network is slow. Reject any number whose digits contain "123456789".
    setTimeout(() => {
      const digits = (value ?? '').replace(/\D/g, '');
      resolve({ exists: digits.includes('123456789') });
    }, 700);
  });
}

const submitState = ref<'idle' | 'submitting' | 'done'>('idle');
const submittedValue = ref<string | null>(null);

const { handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: zPhone() })),
});

const {
  phone: formPhone,
  country: formCountry,
  error: formError,
  handleBlur: formHandleBlur,
  fieldProps: formFieldProps,
  validating: formValidating,
} = useTelField('phone', {
  rules: async (value: string) => {
    const sync = await zPhone().safeParseAsync(value);
    if (!sync.success) return sync.error.issues[0]!.message;
    const { exists } = await fakePhoneExistsCheck(value);
    return exists ? 'This phone number is already registered.' : true;
  },
  validateOn: 'blur',
  defaultCountry: 'SA',
});

const onFormSubmit = handleSubmit(async (values) => {
  submitState.value = 'submitting';
  await new Promise((r) => setTimeout(r, 400));
  submittedValue.value = String(values.phone ?? '');
  submitState.value = 'done';
});

function resetForm_() {
  submitState.value = 'idle';
  submittedValue.value = null;
  resetForm();
}
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">@alikhalilll/a-tel-input · ATelInput</h1>
    <p class="mb-8 text-text-dim">
      Tel input with automatic country detection (IP → timezone → locale → fallback). The country
      picker is a flag-only trigger at the end of the field — a popover on desktop, a vaul-vue
      drawer on mobile. RTL-aware, localisable via <code>locale</code> / <code>messages</code>, and
      it accepts alternative numerals (Arabic-Indic, Persian, …). Try resizing below 768px.
    </p>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- Live component -->
      <div class="rounded-xl border border-brand-border bg-surface p-5">
        <h2 class="mb-4 border-l-[3px] border-brand pl-2 text-lg font-semibold">Component</h2>

        <div class="max-w-sm">
          <ATelInput
            ref="tellRef"
            v-model:phone="phone"
            v-model:country="country"
            :allowed-dial-codes="allowedOnly.length ? allowedOnly : undefined"
            :show-validation="showValidation"
            :show-validation-icon="showValidationIcon"
            :detect-country="detectMode"
            :detect-from-input="detectFromInput"
            :size="size"
          />
        </div>

        <div class="mt-6 flex flex-col gap-3 text-sm">
          <label class="flex items-center gap-2">
            <input v-model="showValidation" type="checkbox" />
            <span>show-validation</span>
          </label>

          <label class="flex items-center gap-2">
            <input v-model="showValidationIcon" type="checkbox" />
            <span>show-validation-icon</span>
          </label>

          <label class="flex items-center gap-2">
            <input v-model="detectFromInput" type="checkbox" />
            <span
              >detect-from-input
              <span class="text-text-dim text-xs">
                — hide picker until input matches a dial code (try
                <code>+447911123456</code>)
              </span>
            </span>
          </label>

          <label class="flex items-center gap-2">
            <input
              :checked="allowOnlyEgypt"
              type="checkbox"
              @change="(e) => syncAllowed((e.target as HTMLInputElement).checked)"
            />
            <span>allowed-dial-codes: ['20'] (Egypt only)</span>
          </label>

          <label class="flex items-center gap-2">
            <span>size:</span>
            <select
              v-model="size"
              class="rounded border border-brand-border bg-surface-2 px-2 py-1"
            >
              <option value="xs">xs (28px)</option>
              <option value="sm">sm (36px)</option>
              <option value="md">md (43px) — default</option>
              <option value="lg">lg (52px)</option>
              <option value="xl">xl (60px)</option>
            </select>
          </label>

          <label class="flex items-center gap-2">
            <span>detect-country:</span>
            <select
              v-model="detectMode"
              class="rounded border border-brand-border bg-surface-2 px-2 py-1"
            >
              <option value="auto">auto (IP → timezone → locale)</option>
              <option value="locale">locale (no network)</option>
              <option value="none">none (use defaultCountry)</option>
            </select>
          </label>

          <label class="flex items-center gap-2">
            <span>theme:</span>
            <select
              v-model="theme"
              class="rounded border border-brand-border bg-surface-2 px-2 py-1"
            >
              <option value="dark">dark</option>
              <option value="light">light</option>
            </select>
            <span class="text-text-dim text-xs">
              Toggles the <code>.dark</code> / <code>.light</code> class on
              <code>&lt;html&gt;</code>. Lib variables cascade everywhere, including the popover
              portal.
            </span>
          </label>
        </div>
      </div>

      <!-- Live state -->
      <div class="rounded-xl border border-brand-border bg-surface p-5">
        <h2 class="mb-4 border-l-[3px] border-brand pl-2 text-lg font-semibold">Live state</h2>
        <pre class="text-xs">{{
          JSON.stringify(
            {
              phone,
              country,
              dialCode,
              validation: validation && {
                ok: validation.ok,
                reason: validation.reason,
                full_phone: validation.full_phone,
              },
              required: required && {
                iso2: required.iso2,
                dial_code: required.dial_code,
                example: required.example_e164,
                length: required.national_number_length,
              },
            },
            null,
            2
          )
        }}</pre>
      </div>
    </div>

    <h2 class="mt-10 mb-2 text-xl font-semibold tracking-tight">Full customization</h2>
    <p class="mb-4 text-sm text-text-dim">
      Curated country list, hi-res flags, custom searcher, custom detector, plus re-skinned slots
      for icons / hint / error / group header. Open the picker to see only Gulf countries; type a
      query to see starts-with matching.
    </p>

    <div class="rounded-xl border border-brand-border bg-surface p-5">
      <div class="max-w-sm">
        <ATelInput
          v-model:phone="customPhone"
          v-model:country="customCountry"
          default-country="20"
          show-validation
          :countries="curated"
          :flag-url="hiResFlag"
          :searcher="startsWithSearcher"
          :detector="alwaysEgypt"
        >
          <template #prefix>
            <PhoneIcon class="text-muted-foreground me-1 ms-2 size-4 shrink-0" />
          </template>
          <template #valid-icon>
            <SparklesIcon class="size-5 text-amber-400" />
          </template>
          <template #error-icon>
            <ShieldXIcon class="text-destructive size-5" />
          </template>
          <template #hint="{ formatHint }">
            <p class="text-muted-foreground flex items-center gap-1 text-xs">
              <ShieldCheckIcon class="size-3" />
              <span>Example · </span>
              <span class="tabular-nums">{{ formatHint }}</span>
            </p>
          </template>
          <template #error="{ message, reason }">
            <p class="text-destructive flex items-center gap-2 text-xs">
              <span
                class="bg-destructive/15 rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase"
                >{{ reason }}</span
              >
              <span>{{ message }}</span>
            </p>
          </template>
          <template #item-check>
            <SparklesIcon class="size-3.5 text-amber-400" />
          </template>
        </ATelInput>
      </div>
    </div>

    <h2 class="mt-10 mb-2 text-xl font-semibold tracking-tight">Internationalization · RTL</h2>
    <p class="mb-4 text-sm text-text-dim">
      Wrapped in <code>dir="rtl"</code> with <code>locale="ar"</code> and a localized
      <code>messages</code> bag. The phone field row keeps its LTR order; country names render in
      Arabic, the helper text and picker follow RTL, and typing the Arabic-Indic digits
      <code dir="rtl">٠١٠٦٦١٠٥٩٦٣</code> normalises to ASCII in <code>v-model:phone</code>.
    </p>

    <div class="rounded-xl border border-brand-border bg-surface p-5">
      <div class="max-w-sm" dir="rtl">
        <ATelInput
          v-model:phone="i18nPhone"
          v-model:country="i18nCountry"
          locale="ar"
          default-country="20"
          show-validation
          :messages="arabicMessages"
        />
      </div>
      <pre class="mt-4 text-xs">{{ JSON.stringify({ i18nPhone, i18nCountry }, null, 2) }}</pre>
    </div>

    <h2 class="mt-10 mb-2 text-xl font-semibold tracking-tight">
      Form integration · VeeValidate + Zod + server-side check
    </h2>
    <p class="mb-4 text-sm text-text-dim">
      The <code>@alikhalilll/a-tel-input/vee-validate</code> subpath ships
      <code>useTelField()</code> which wires both v-models into a single VeeValidate field, composes
      them into an E.164 string, and exposes a <code>fieldProps</code> bag plus
      <code>handleBlur</code>. The Zod schema (<code>zPhone()</code>) reuses the same libphonenumber
      engine the component uses. The async <code>rules</code> below adds a server-side uniqueness
      check — any number containing <code>123456789</code> is rejected after a 700 ms latency; the
      field shows a spinner while the check is in flight.
    </p>

    <div class="rounded-xl border border-brand-border bg-surface p-5">
      <form class="max-w-sm" novalidate @submit="onFormSubmit">
        <ATelInput
          v-model:phone="formPhone"
          v-model:country="formCountry"
          v-bind="formFieldProps"
          :error="formError"
          :validating="formValidating"
          show-validation
          @blur="formHandleBlur"
        />

        <div class="mt-3 flex items-center gap-2 text-sm">
          <button
            type="submit"
            class="rounded border border-brand-border bg-surface-2 px-3 py-1.5 hover:bg-brand-border/30 disabled:opacity-50"
            :disabled="submitState === 'submitting'"
          >
            {{ submitState === 'submitting' ? 'Submitting…' : 'Submit' }}
          </button>
          <button
            v-if="submitState === 'done'"
            type="button"
            class="rounded border border-brand-border px-3 py-1.5 text-text-dim hover:bg-surface-2"
            @click="resetForm_"
          >
            Reset
          </button>
        </div>

        <p
          v-if="submitState === 'done' && submittedValue"
          class="mt-3 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          Submitted ✓ — server received <code>{{ submittedValue }}</code>
        </p>
      </form>
    </div>

    <h2 class="mt-10 mb-2 text-xl font-semibold tracking-tight">Public API</h2>
    <p class="mb-4 text-sm text-text-dim">
      The component exposes <code>validation</code>, <code>required</code> and
      <code>selectedDialCode</code> via <code>defineExpose</code>. All primitives
      (<code>APopover*</code>, <code>ADrawer*</code>, <code>AResponsivePopover*</code>,
      <code>ACountrySelect</code>, <code>ACountryFlag</code>) plus the composables
      (<code>usePhoneValidation</code>, <code>useCountryDetection</code>,
      <code>detectCountry</code>) are exported so consumers can compose their own variants.
    </p>
  </section>
</template>
