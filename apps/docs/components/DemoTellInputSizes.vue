<script setup lang="ts">
import { ref } from 'vue';
import { SIZES, controlHeightPx, type Size } from '@alikhalilll/a-ui-base';
import { ATelInput } from '@alikhalilll/a-tel-input';

interface Row {
  size: Size;
  phone: string;
  country: number | null;
}

const rows = ref<Row[]>(SIZES.map((s) => ({ size: s, phone: '', country: null })));

const source = `<script setup lang="ts">
import { SIZES, controlHeightPx, type Size } from '@alikhalilll/a-ui-base';
import { ATelInput } from '@alikhalilll/a-tel-input';
\u003c/script>

<template>
  <div v-for="size in SIZES" :key="size" class="flex items-start gap-4">
    <div class="w-24 pt-2 font-mono text-xs">
      {{ size }} · {{ controlHeightPx[size] }}px
    </div>
    <ATelInput :size="size" default-country="20" />
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · All five sizes
    </h4>

    <DemoTabs :code="source">
      <div class="flex flex-col gap-4 p-5">
        <div v-for="row in rows" :key="row.size" class="flex items-start gap-4">
          <div
            class="w-24 shrink-0 pt-2 font-mono text-xs text-text-dim"
            :title="`${controlHeightPx[row.size]}px tall`"
          >
            {{ row.size }} · {{ controlHeightPx[row.size] }}px
          </div>
          <div class="max-w-sm flex-1">
            <ATelInput
              v-model:phone="row.phone"
              v-model:country="row.country"
              :size="row.size"
              default-country="20"
            />
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
