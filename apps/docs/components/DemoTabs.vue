<script setup lang="ts">
/**
 * Two-tab wrapper used across the docs' interactive demos.
 *   - Default slot = "Preview"
 *   - `code` prop  = the source string shown under the "Code" tab, with one-click copy
 *
 * Keeps every demo visually consistent and copy-paste friendly without each demo having
 * to re-implement tabs + clipboard handling.
 */
import { ref } from 'vue';
import { Check, Copy } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    /** The source string rendered in the Code tab. */
    code: string;
    /** Shiki/HLJS-style language hint shown next to the Copy button. */
    lang?: string;
  }>(),
  { lang: 'vue' }
);

const activeTab = ref<'preview' | 'code'>('preview');
const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* clipboard unavailable — silently ignore */
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-border bg-surface-2/30">
    <!-- Tab strip -->
    <div class="flex items-center justify-between border-b border-border bg-surface-2/60 pr-2 pl-1">
      <div role="tablist" class="flex">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'preview'"
          class="relative inline-flex h-9 items-center px-3 text-[12px] font-medium transition-colors"
          :class="
            activeTab === 'preview'
              ? 'text-text after:absolute after:inset-x-3 after:bottom-[-1px] after:h-[2px] after:bg-brand'
              : 'text-text-dim hover:text-text'
          "
          @click="activeTab = 'preview'"
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'code'"
          class="relative inline-flex h-9 items-center px-3 text-[12px] font-medium transition-colors"
          :class="
            activeTab === 'code'
              ? 'text-text after:absolute after:inset-x-3 after:bottom-[-1px] after:h-[2px] after:bg-brand'
              : 'text-text-dim hover:text-text'
          "
          @click="activeTab = 'code'"
        >
          Code
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="activeTab === 'code'" class="font-mono text-[10px] text-text-muted">
          {{ lang }}
        </span>
        <button
          v-if="activeTab === 'code'"
          type="button"
          class="inline-flex h-7 items-center gap-1 rounded border border-border bg-surface px-2 text-[11px] font-medium text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
          :aria-label="copied ? 'Copied' : 'Copy code'"
          @click="copy"
        >
          <Check v-if="copied" class="size-3" />
          <Copy v-else class="size-3" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- Preview pane (kept mounted so v-models keep their state across tab switches) -->
    <div v-show="activeTab === 'preview'" class="bg-background/40">
      <slot />
    </div>

    <!-- Code pane -->
    <pre
      v-show="activeTab === 'code'"
      class="!m-0 max-h-[480px] overflow-auto bg-code-bg !p-4 font-mono text-[12px] leading-relaxed text-text"
    ><code>{{ code }}</code></pre>
  </div>
</template>
