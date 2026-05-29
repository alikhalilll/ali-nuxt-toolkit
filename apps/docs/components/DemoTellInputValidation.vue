<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const tellRef = ref<InstanceType<typeof ATelInput> | null>(null);
const validation = computed(() => tellRef.value?.validation);
const required = computed(() => tellRef.value?.required);

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const tellRef = ref<InstanceType<typeof ATelInput> | null>(null);

// Reactive validation result + country metadata
const validation = computed(() => tellRef.value?.validation);
const required   = computed(() => tellRef.value?.required);
\u003c/script>

<template>
  <ATelInput
    ref="tellRef"
    v-model:phone="phone"
    v-model:country="country"
    default-country="20"
    show-validation
  />
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Validation reasons
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Try: type a couple digits (<code>too_short</code>) · paste a letter
      (<code>phone_has_non_digits</code>) · type 15 digits (<code>too_long</code>) · type a real
      number to see the green ring + checkmark.
    </p>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="max-w-sm">
          <ATelInput
            ref="tellRef"
            v-model:phone="phone"
            v-model:country="country"
            default-country="20"
            show-validation
          />
        </div>

        <pre
          class="mt-4 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-[12px] text-text-dim"
          >{{
            JSON.stringify(
              {
                validation: validation && {
                  ok: validation.ok,
                  reason: validation.reason,
                  full_phone: validation.full_phone,
                },
                required: required && {
                  iso2: required.iso2,
                  dial_code: required.dial_code,
                  example_e164: required.example_e164,
                  national_number_length: required.national_number_length,
                },
              },
              null,
              2
            )
          }}</pre
        >
      </div>
    </DemoTabs>
  </div>
</template>
