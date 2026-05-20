<script setup lang="ts">
import { ref } from 'vue';
import { APopover, APopoverTrigger, APopoverContent } from '@alikhalilll/ui';

const open = ref(false);
const modal = ref(true);
const overlay = ref(false);
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · APopover
    </h4>

    <div class="mb-4 flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2">
        <input v-model="modal" type="checkbox" />
        <span>
          <code>modal</code>
          <span class="text-text-muted">(scroll-lock + click-outside-to-close)</span>
        </span>
      </label>

      <label class="flex items-center gap-2">
        <input v-model="overlay" type="checkbox" />
        <span>
          <code>overlay</code>
          <span class="text-text-muted">(dim backdrop)</span>
        </span>
      </label>
    </div>

    <APopover v-model:open="open" :modal="modal">
      <APopoverTrigger as-child>
        <button
          type="button"
          class="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-border"
        >
          {{ open ? 'Close popover' : 'Open popover' }}
        </button>
      </APopoverTrigger>
      <APopoverContent :overlay="overlay" align="start" class="w-72">
        <div class="space-y-2 text-popover-foreground">
          <p class="text-sm font-semibold">Popover content</p>
          <p class="text-sm text-muted-foreground">
            Click outside or hit
            <kbd class="rounded border border-border bg-surface px-1 py-0.5 text-[10px]">Esc</kbd>
            to close.
          </p>
        </div>
      </APopoverContent>
    </APopover>
  </div>
</template>
