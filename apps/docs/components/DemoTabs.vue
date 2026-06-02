<script setup lang="ts">
/**
 * Two-tab wrapper used across the docs' interactive demos.
 *   - Default slot = "Preview"
 *   - `code` prop  = the source string shown under the "Code" tab, with one-click copy
 *
 * Keeps every demo visually consistent and copy-paste friendly without each demo having
 * to re-implement tabs + clipboard handling.
 *
 * The Code pane renders Shiki dual-theme HTML so it visually matches the prose code
 * blocks emitted by Nuxt Content — `--shiki-light` / `--shiki-dark` token colours
 * swap on the `.dark` class toggle without a reload.
 */
import { ref, watch } from 'vue';
import { CheckIcon, CopyIcon } from '~/components/icons';
import { highlight } from '~/composables/useShiki';

const props = withDefaults(
  defineProps<{
    /** The source string rendered in the Code tab. */
    code: string;
    /** Shiki language hint — passed straight to the highlighter. */
    lang?: string;
  }>(),
  { lang: 'vue' }
);

const activeTab = ref<'preview' | 'code'>('preview');
const copied = ref(false);
const highlighted = ref<string>('');

watch(
  () => [props.code, props.lang] as const,
  async ([code, lang]) => {
    if (!code) {
      highlighted.value = '';
      return;
    }
    try {
      highlighted.value = await highlight(code, lang);
    } catch {
      // Shiki failed (lazy chunk missing, offline, etc.) — fall back to escaped plain
      // text so the user still sees the source.
      highlighted.value = `<pre class="shiki-fallback"><code>${escapeHtml(code)}</code></pre>`;
    }
  },
  { immediate: true }
);

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c]!
  );
}

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
          <CheckIcon v-if="copied" class="size-3" />
          <CopyIcon v-else class="size-3" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- Preview pane (kept mounted so v-models keep their state across tab switches) -->
    <div v-show="activeTab === 'preview'" class="bg-background/40">
      <slot />
    </div>

    <!-- Code pane — uses the shared DocCodeBlock so demo code matches both
         prose code blocks and the homepage hero showcase. The DemoTabs strip
         above already provides chrome (Preview/Code tabs + lang/copy), so
         we pass `flush` and skip the inner bar. -->
    <DocCodeBlock v-show="activeTab === 'code'" flush class="demo-tabs__code">
      <div v-html="highlighted" />
    </DocCodeBlock>
  </div>
</template>

<style scoped>
/* Tighten the inherited frame for the demo-tabs context — the tab strip above
   already provides the chrome, we just want a clean rounded body underneath. */
.demo-tabs__code :deep(.doc-code__body) {
  max-height: 480px;
}
</style>
