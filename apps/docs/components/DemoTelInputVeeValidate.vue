<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';
import { useTelField } from '@alikhalilll/a-tel-input/vee-validate';
import { zPhone } from '@alikhalilll/a-tel-input/zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

// Demo "server" — pretends any number containing the digit run `123456789`
// is already registered. Simple to trigger: just type 123456789 anywhere.
function fakeServerCheck(value: string): Promise<{ exists: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const digits = (value ?? '').replace(/\D/g, '');
      resolve({ exists: digits.includes('123456789') });
    }, 700);
  });
}

const submitState = ref<'idle' | 'submitting' | 'done'>('idle');
const submittedValue = ref<string | null>(null);

// Server-side validation lives in the FORM SCHEMA (not in useField's `rules`) because
// vee-validate ignores field-level rules whenever `useForm` is given a `validationSchema`.
// Chaining `.refine(async)` onto `zPhone()` means the async server check runs as part of
// schema validation — which is what `handleSubmit` actually awaits before submitting, and
// which drives `meta.pending` (used by `useTelField`'s `validating` ref → field spinner).
const phoneSchema = zPhone().refine(
  async (value) => {
    if (!value) return true; // empty is handled by zPhone() itself
    const { exists } = await fakeServerCheck(value);
    return !exists;
  },
  { message: 'This phone number is already registered.' }
);

const { handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: phoneSchema })),
});

const { phone, country, error, handleBlur, fieldProps, validating } = useTelField('phone', {
  validateOn: 'blur',
  defaultCountry: 'SA',
});

const onSubmit = handleSubmit(async (values) => {
  submitState.value = 'submitting';
  await new Promise((r) => setTimeout(r, 400));
  submittedValue.value = String(values.phone ?? '');
  submitState.value = 'done';
});

function reset() {
  submitState.value = 'idle';
  submittedValue.value = null;
  resetForm();
}

const source = `<script setup lang="ts">
import { ATelInput } from '@alikhalilll/a-tel-input';
import { useTelField } from '@alikhalilll/a-tel-input/vee-validate';
import { zPhone } from '@alikhalilll/a-tel-input/zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

// Async server-side check lives inside the form schema via z.refine(async).
// vee-validate ignores field-level rules when the form has a validationSchema,
// so async validation MUST be part of the schema to actually run.
const phoneSchema = zPhone().refine(
  async (value) => {
    if (!value) return true;
    const { exists } = await $fetch('/api/phone/exists', { query: { phone: value } });
    return !exists;
  },
  { message: 'This phone number is already registered.' }
);

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(z.object({ phone: phoneSchema })),
});

const { phone, country, error, handleBlur, fieldProps, validating } = useTelField('phone', {
  validateOn: 'blur',
  defaultCountry: 'SA',
});

const onSubmit = handleSubmit((values) => {
  // values.phone is the E.164 string, validated client-side + server-side.
});
\u003c/script>

<template>
  <form @submit="onSubmit">
    <ATelInput
      v-model:phone="phone"
      v-model:country="country"
      v-bind="fieldProps"
      :error="error"
      :validating="validating"
      show-validation
      @blur="handleBlur"
    />
    <button type="submit">Submit</button>
  </form>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · VeeValidate + Zod + server-side check
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Type a number and blur the field. Any number containing <code>123456789</code> is rejected by
      the fake server (700 ms latency) — watch the spinner inside the field while the request is in
      flight. The form-level Zod schema catches malformed numbers before the network call.
    </p>

    <DemoTabs :code="source">
      <form class="p-5" novalidate @submit="onSubmit">
        <div class="max-w-sm space-y-3">
          <ATelInput
            v-model:phone="phone"
            v-model:country="country"
            v-bind="fieldProps"
            :error="error"
            :validating="validating"
            show-validation
            @blur="handleBlur"
          />

          <div class="flex items-center gap-2">
            <button
              type="submit"
              class="rounded-md border border-border bg-code-bg px-3 py-1.5 text-sm font-medium hover:bg-surface disabled:opacity-50"
              :disabled="submitState === 'submitting'"
            >
              {{ submitState === 'submitting' ? 'Submitting…' : 'Submit' }}
            </button>
            <button
              v-if="submitState === 'done'"
              type="button"
              class="rounded-md border border-border px-3 py-1.5 text-sm text-text-dim hover:bg-surface"
              @click="reset"
            >
              Reset
            </button>
          </div>

          <p
            v-if="submitState === 'done' && submittedValue"
            class="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
          >
            Submitted ✓ — server received <code>{{ submittedValue }}</code>
          </p>
        </div>
      </form>
    </DemoTabs>
  </div>
</template>
