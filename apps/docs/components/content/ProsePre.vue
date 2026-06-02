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
    <!-- IMPORTANT: keep the `shiki` class on the inner `<pre>`. Nuxt Content
         generates per-token CSS rules that look like
           html pre.shiki code .sU953, html code.shiki .sU953
             { --shiki-default:#…; --shiki-dark:#… }
         For them to fire, EITHER the inner `<pre>` OR the inner `<code>` must
         carry the `shiki` class. DocCodeBlock applies the `$props.class` to
         its outer wrapper (for the `.shiki` background tokens), so we re-add
         the same `shiki` class here on the inner `<pre>` to satisfy the
         per-token selectors. Without this, every token in every prose code
         block renders in the page's default body colour. -->
    <pre class="shiki"><slot /></pre>
  </DocCodeBlock>
</template>
