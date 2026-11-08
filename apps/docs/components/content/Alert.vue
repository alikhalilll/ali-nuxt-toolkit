<script setup lang="ts">
/**
 * `::alert{type="…" title="…"}` MDC component.
 *
 * In the minimal docs theme, the `type` prop is accepted (so existing markdown
 * doesn't break) but doesn't affect the rendered chrome — every callout is a
 * single thin-bordered box. The `title` prop is still rendered as a bold leading
 * line. That gives authors the hierarchy (title vs body) without the visual
 * variance (colour, icon, background) a traditional admonition palette implies.
 */
type AlertType = 'info' | 'warning' | 'danger' | 'success' | 'note' | 'tip';

withDefaults(
  defineProps<{
    type?: AlertType;
    title?: string;
  }>(),
  { type: 'info' }
);
</script>

<template>
  <div class="doc-callout" role="note">
    <div class="doc-callout__body">
      <p v-if="title" class="doc-callout__title">{{ title }}</p>
      <slot />
    </div>
  </div>
</template>
