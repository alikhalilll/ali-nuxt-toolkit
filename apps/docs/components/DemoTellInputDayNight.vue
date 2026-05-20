<script setup lang="ts">
import { ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');
const mode = ref<'dark' | 'light'>('dark');

const source = `<script setup lang="ts">
import { ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');
const mode = ref<'dark' | 'light'>('dark');
\u003c/script>

<template>
  <!--
    The lib ships :root, .light {…} and .dark {…} blocks.
    Toggle one class on a wrapper (or on <html>) and every component swaps modes.
  -->
  <div :class="mode" class="text-foreground p-5 rounded-lg bg-background">
    <ATellInput
      v-model:phone="phone"
      v-model:country="country"
      default-country="SA"
      show-validation
    />
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Day / night toggle via the `.dark` class
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      No JS theme rewrites — the lib already ships
      <code class="rounded bg-code-bg px-1 py-0.5 text-xs text-accent-2">:root, .light {…}</code>
      and
      <code class="rounded bg-code-bg px-1 py-0.5 text-xs text-accent-2">.dark {…}</code>
      blocks. Flip the class on a wrapper and the whole component switches modes.
    </p>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-4 inline-flex rounded-md border border-border bg-surface-2 p-1 text-xs">
          <button
            type="button"
            class="rounded px-2.5 py-1 font-medium transition-colors"
            :class="
              mode === 'dark' ? 'bg-surface text-text shadow-sm' : 'text-text-dim hover:text-text'
            "
            @click="mode = 'dark'"
          >
            🌙 Dark
          </button>
          <button
            type="button"
            class="rounded px-2.5 py-1 font-medium transition-colors"
            :class="
              mode === 'light' ? 'bg-surface text-text shadow-sm' : 'text-text-dim hover:text-text'
            "
            @click="mode = 'light'"
          >
            ☀️ Light
          </button>
        </div>

        <div
          :class="mode"
          class="text-foreground rounded-lg border border-border bg-background p-5 transition-colors"
        >
          <div class="max-w-sm">
            <ATellInput
              v-model:phone="phone"
              v-model:country="country"
              default-country="SA"
              show-validation
            />
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
