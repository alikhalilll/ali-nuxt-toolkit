<script setup lang="ts">
import { computed } from 'vue';
import { renderEmojiToDataUrl } from '../core';
import { useEmojiFavicon } from './use-emoji-favicon';

const props = withDefaults(
  defineProps<{
    emoji: string;
    size?: number;
    background?: string;
  }>(),
  { size: 64 },
);

useEmojiFavicon(props.emoji, {
  size: props.size,
  background: props.background,
});

// Inline preview — small visual confirmation in templates.
const dataUrl = computed(() =>
  renderEmojiToDataUrl(props.emoji, {
    size: props.size,
    background: props.background,
  }),
);
</script>

<template>
  <img
    v-if="dataUrl"
    :src="dataUrl"
    :width="size"
    :height="size"
    alt=""
    class="emoji-favicon-preview"
  />
</template>

<style scoped>
.emoji-favicon-preview {
  display: inline-block;
  vertical-align: middle;
}
</style>
