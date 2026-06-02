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
    show-validation
  />
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · ATelInput
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="max-w-sm">
          <ATelInput
            ref="tellRef"
            v-model:phone="phone"
            v-model:country="country"
            show-validation
          />
        </div>

        <!-- Live state — Shiki-highlighted JSON via DocOutput so the panel
             shares the editor palette with prose code blocks instead of
             rendering as plain mono. -->
        <DocOutput
          class="mt-4"
          label="state"
          :value="{
            country,
            dialCode,
            phone,
            validation: validation && {
              ok: validation.ok,
              reason: validation.reason,
              full_phone: validation.full_phone,
            },
          }"
        />
      </div>
    </DemoTabs>
  </div>
</template>
