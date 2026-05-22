<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref<number | null>(null);

const tellRef = ref<InstanceType<typeof ATellInput> | null>(null);
const validation = computed(() => tellRef.value?.validation);
const dialCode = computed(() => tellRef.value?.selectedDialCode);

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref<number | null>(null);

const tellRef = ref<InstanceType<typeof ATellInput> | null>(null);
const validation = computed(() => tellRef.value?.validation);
const dialCode = computed(() => tellRef.value?.selectedDialCode);
\u003c/script>

<template>
  <ATellInput
    ref="tellRef"
    v-model:phone="phone"
    v-model:country="country"
    show-validation
  />
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · ATellInput
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="max-w-sm">
          <ATellInput
            ref="tellRef"
            v-model:phone="phone"
            v-model:country="country"
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
