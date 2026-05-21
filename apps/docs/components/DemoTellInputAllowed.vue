<script setup lang="ts">
import { ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref<number | null>(null);

const source = `<script setup lang="ts">
import { ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref<number | null>(null);
\u003c/script>

<template>
  <ATellInput
    v-model:phone="phone"
    v-model:country="country"
    :allowed-dial-codes="['20', '966', '971']"
    default-country="20"
    show-validation
  />
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · allowed-dial-codes restriction
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Restricted to <code>['20', '966', '971']</code> — Egypt, Saudi Arabia, UAE. Open the picker —
      every other country is greyed out and unclickable.
    </p>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="max-w-sm">
          <ATellInput
            v-model:phone="phone"
            v-model:country="country"
            :allowed-dial-codes="['20', '966', '971']"
            default-country="20"
            show-validation
          />
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
