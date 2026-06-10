<script setup lang="ts">
import { ref } from 'vue';

const loading = ref(true);

const source = `<template>
  <div v-if="loading" class="flex items-start gap-4 p-4">
    <ASkeletonBlock type="circle" :w="64" :h="64" />
    <div class="flex-1 space-y-2">
      <ASkeletonBlock type="text" :w="160" :h="18" />
      <ASkeletonBlock type="text" :w="100" :h="12" />
      <ASkeletonBlock type="text" :lines="3" :h="14" class="!mt-3" />
    </div>
  </div>
  <div v-else class="flex items-start gap-4 p-4">
    <img src="…" class="size-16 shrink-0 rounded-full object-cover" />
    <div class="flex-1">
      <h3 class="text-base font-semibold">Sam Iqbal</h3>
      <!-- … -->
    </div>
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · ASkeletonBlock primitives
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-3">
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 text-xs hover:bg-surface"
            @click="loading = !loading"
          >
            Toggle loading
          </button>
        </div>

        <div v-if="loading" class="flex items-start gap-4 p-4">
          <ASkeletonBlock type="circle" :w="64" :h="64" />
          <div class="flex-1 space-y-2">
            <ASkeletonBlock type="text" :w="160" :h="18" />
            <ASkeletonBlock type="text" :w="100" :h="12" />
            <ASkeletonBlock type="text" :lines="3" :h="14" class="!mt-3" />
          </div>
        </div>
        <div v-else class="flex items-start gap-4 p-4">
          <img
            src="https://i.pravatar.cc/96?img=12"
            alt="Sam"
            class="size-16 shrink-0 rounded-full object-cover"
          />
          <div class="flex-1">
            <h3 class="text-base font-semibold">Sam Iqbal</h3>
            <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">Staff DX Engineer</p>
            <p class="mt-2 text-sm leading-relaxed">
              Maintains the component library and writes blog posts about skeleton loaders. Probably
              had too much coffee today.
            </p>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
