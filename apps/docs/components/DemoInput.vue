<script setup lang="ts">
import { ref } from 'vue';
import { AInput, SIZES, controlHeightPx, type Size } from '@alikhalilll/ui';

interface Row {
  size: Size;
  value: string;
}

const rows = ref<Row[]>(SIZES.map((s) => ({ size: s, value: '' })));
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · AInput across all sizes
    </h4>

    <div class="flex flex-col gap-3">
      <div v-for="row in rows" :key="row.size" class="flex items-center gap-4">
        <div class="w-24 shrink-0 font-mono text-xs text-text-dim">
          {{ row.size }} · {{ controlHeightPx[row.size] }}px
        </div>
        <div class="max-w-sm flex-1">
          <AInput
            v-model="row.value"
            :size="row.size"
            :placeholder="`Type something (${row.size})`"
          />
        </div>
      </div>
    </div>
  </div>
</template>
