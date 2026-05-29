<script setup lang="ts">
import { ref } from 'vue';
import {
  AResponsivePopover,
  AResponsivePopoverTrigger,
  AResponsivePopoverContent,
} from '@alikhalilll/a-responsive-popover';

const open = ref(false);
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · AResponsivePopover
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Same trigger renders a popover at ≥ 768 px and a vaul-vue drawer below. Try resizing the
      browser window through 768 px and toggling — same API, different UX per viewport.
    </p>

    <AResponsivePopover v-model:open="open">
      <AResponsivePopoverTrigger as-child>
        <button
          type="button"
          class="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-border"
        >
          {{ open ? 'Close' : 'Open (auto popover/drawer)' }}
        </button>
      </AResponsivePopoverTrigger>
      <AResponsivePopoverContent
        align="start"
        :popover-class="'w-72'"
        :drawer-class="'max-h-[60vh] pb-6'"
      >
        <div class="text-popover-foreground space-y-2 p-4 md:p-0">
          <p class="text-sm font-semibold">Responsive surface</p>
          <p class="text-muted-foreground text-sm">
            Desktop &ge; 768&thinsp;px: this is a popover. Mobile: a bottom drawer.
          </p>
        </div>
      </AResponsivePopoverContent>
    </AResponsivePopover>
  </div>
</template>
