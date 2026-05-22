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
  <!-- Direction inherits from the page — no \`dir\` prop needed. -->
  <div dir="rtl">
    <ATellInput
      v-model:phone="phone"
      v-model:country="country"
      default-country="20"
      show-validation
    />
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · RTL layout
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Wrapped in <code>&lt;div dir="rtl"&gt;</code>. The phone field row keeps its LTR order — dial
      prefix, digits, then flag — while the helper text and the country picker follow RTL. Try
      typing the Arabic-Indic digits <code dir="rtl">٠١٠٦٦١٠٥٩٦٣</code> — they normalise to ASCII.
    </p>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="max-w-sm" dir="rtl">
          <ATellInput
            v-model:phone="phone"
            v-model:country="country"
            default-country="20"
            show-validation
          />
        </div>

        <pre
          class="mt-4 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-[12px] text-text-dim"
          >{{ JSON.stringify({ phone, country }, null, 2) }}</pre
        >
      </div>
    </DemoTabs>
  </div>
</template>
