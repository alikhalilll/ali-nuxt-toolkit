<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { cn } from '../../lib/utils';
import { defaultFlagUrl, type FlagUrlBuilder } from './flag-url';

const props = withDefaults(
  defineProps<{
    /** ISO 3166-1 alpha-2 country code, case-insensitive. */
    iso2: string;
    /** Pixel width served by flagcdn. 40 is crisp at retina up to ~24px wide. */
    width?: number;
    /** Optional explicit URL override. When set, `iso2` / `width` / `flagUrl` are ignored. */
    src?: string | null;
    /** Function `(iso2, width) => string` — fully replace the URL builder. */
    flagUrl?: FlagUrlBuilder;
    alt?: string;
    class?: HTMLAttributes['class'];
  }>(),
  { width: 40 }
);

const url = computed(() => {
  if (props.src) return props.src;
  if (!props.iso2) return null;
  return (props.flagUrl ?? defaultFlagUrl)(props.iso2, props.width);
});
</script>

<template>
  <img
    v-if="url"
    :src="url"
    :alt="props.alt ?? `${props.iso2} flag`"
    loading="lazy"
    data-slot="country-flag"
    :class="cn('ring-border/40 inline-block h-4 w-6 rounded-sm object-cover ring-1', props.class)"
  />
  <slot v-else name="empty">
    <span
      data-slot="country-flag-empty"
      :class="cn('bg-muted inline-block h-4 w-6 rounded-sm', props.class)"
    />
  </slot>
</template>
