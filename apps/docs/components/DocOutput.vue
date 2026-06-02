<script setup lang="ts">
/**
 * Reactive, syntax-highlighted runtime-state block.
 *
 * The dozen-odd interactive demos on the docs site each render their live
 * reactive state inside a `<pre class="bg-code-bg">` so the reader can see
 * the component's outputs change as they type. That `<pre>` was plain text
 * — black on dark surface — and visually distinct from the editor-style
 * panels every other code surface ships. `DocOutput` swaps that pattern in
 * place: hands the value to Shiki's `json` highlighter on every change and
 * wraps the output in the same `DocCodeBlock` chrome the prose code blocks
 * and DemoTabs Code panes use, so the demos no longer have a "lifeless"
 * grey region in the middle of a live preview.
 *
 *   <DocOutput :value="state" label="state.ts" />
 *   <DocOutput value="2 valid; 1 error" lang="text" />
 *
 * Props:
 *   value · reactive payload. Objects get `JSON.stringify(v, null, 2)`;
 *           strings render as-is.
 *   label · optional filename strip (`label="state"` → `state` shown in bar).
 *   lang  · Shiki language hint. Defaults to `'json'`. Pass `'text'` for
 *           plain string outputs that shouldn't trigger JSON colouring.
 */
import { ref, watch } from 'vue';
import { highlight } from '~/composables/useShiki';

const props = withDefaults(
  defineProps<{
    value: unknown;
    label?: string;
    lang?: string;
  }>(),
  { lang: 'json' }
);

const html = ref<string>('');
const raw = ref<string>('');

function serialize(v: unknown): string {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

watch(
  () => [props.value, props.lang] as const,
  async ([value, lang]) => {
    const text = serialize(value);
    raw.value = text;
    if (!text) {
      html.value = '';
      return;
    }
    try {
      html.value = await highlight(text, lang);
    } catch {
      html.value = `<pre class="shiki-fallback"><code>${escapeHtml(text)}</code></pre>`;
    }
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <DocCodeBlock :filename="label || undefined" :lang="lang" :code="raw">
    <div v-html="html" />
  </DocCodeBlock>
</template>
