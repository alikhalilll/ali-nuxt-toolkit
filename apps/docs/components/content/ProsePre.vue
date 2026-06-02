<script setup lang="ts">
/**
 * Override of @nuxtjs/mdc's `ProsePre` (the renderer for fenced code blocks in
 * Markdown). Wraps the Shiki output in our site-wide `DocCodeBlock` so prose
 * code blocks share the hero showcase's panel chrome (border + brand-tinted
 * bg + filename strip + copy button) instead of bare `<pre>`.
 *
 * Original signature (preserve so MDC's renderer still passes the right props):
 *   code:     raw source string (used by the copy button)
 *   language: shiki lang hint (e.g. `vue`, `ts`)
 *   filename: optional filename above the block (from ```ts [path] meta)
 *   highlights, meta, class: passed through but not consumed here
 */
defineProps<{
  code?: string;
  language?: string;
  filename?: string;
  highlights?: number[];
  meta?: string;
  class?: string;
}>();
</script>

<template>
  <DocCodeBlock
    :filename="filename || undefined"
    :lang="language || undefined"
    :code="code"
    :class="$props.class"
  >
    <pre><slot /></pre>
  </DocCodeBlock>
</template>
