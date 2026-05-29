<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const tellRef = ref<InstanceType<typeof ATelInput> | null>(null);
const validation = computed(() => tellRef.value?.validation);
const dialCode = computed(() => tellRef.value?.selectedDialCode);

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const tellRef = ref<InstanceType<typeof ATelInput> | null>(null);
const validation = computed(() => tellRef.value?.validation);
const dialCode = computed(() => tellRef.value?.selectedDialCode);
\u003c/script>

<template>
  <ATelInput
    ref="tellRef"
    v-model:phone="phone"
    v-model:country="country"
    detect-from-input
    show-validation
  />
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · ATelInput · detect-from-input
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <p class="mb-3 text-[12px] text-text-dim">
          Try typing or pasting <code>+447911123456</code>, <code>447911123456</code>,
          <code>201001234567</code>, or <code>16175551234</code> for international format. Or try a
          local-format Egyptian number like <code>01066105963</code> — the picker reveals once the
          digits form a valid number for your silently-detected region.
        </p>

        <div class="max-w-sm">
          <ATelInput
            ref="tellRef"
            v-model:phone="phone"
            v-model:country="country"
            detect-from-input
            show-validation
          />
        </div>

        <pre
          class="mt-4 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-[12px] text-text-dim"
          >{{
            JSON.stringify(
              {
                country,
                dialCode,
                phone,
                validation: validation && {
                  ok: validation.ok,
                  reason: validation.reason,
                  full_phone: validation.full_phone,
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
