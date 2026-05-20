<script setup lang="ts">
import { ref } from 'vue';
import { ADrawer, ADrawerTrigger, ADrawerContent } from '@alikhalilll/ui';

const open = ref(false);
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · ADrawer (vaul-vue)
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Always opens as a bottom sheet — try grabbing the handle and dragging it down to dismiss.
    </p>

    <ADrawer v-model:open="open">
      <ADrawerTrigger as-child>
        <button
          type="button"
          class="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-border"
        >
          {{ open ? 'Close drawer' : 'Open drawer' }}
        </button>
      </ADrawerTrigger>
      <ADrawerContent class="p-6">
        <h3 class="text-popover-foreground mb-2 text-lg font-semibold">Drawer content</h3>
        <p class="text-muted-foreground text-sm">
          Drag down or tap the overlay to dismiss. The body scroll is locked while open.
        </p>
        <div class="text-popover-foreground mt-4 space-y-2 text-sm">
          <p>· vaul-vue handles the drag gesture + snap points natively</p>
          <p>· built on reka-ui's Dialog primitive — fully accessible</p>
          <p>· background scaling is on by default</p>
        </div>
      </ADrawerContent>
    </ADrawer>
  </div>
</template>
