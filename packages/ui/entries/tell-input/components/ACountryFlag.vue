<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed, ref, watch } from 'vue';
import { cn } from '@/utils';
import { defaultFlagUrl, type FlagUrlBuilder } from '../utils/flag-url';

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

// Image load failure → fall back to the ISO2 text badge. The flag URL can change as the
// user switches country, so reset the error flag whenever the URL changes.
const failed = ref(false);
watch(url, () => {
  failed.value = false;
});

const iso2Label = computed(() => (props.iso2 ?? '').slice(0, 2).toUpperCase());
</script>

<template>
  <img
    v-if="url && !failed"
    :src="url"
    :alt="props.alt ?? `${props.iso2} flag`"
    loading="lazy"
    data-slot="country-flag"
    :class="cn('ring-border/40 inline-block h-4 w-6 rounded-sm object-cover ring-1', props.class)"
    @error="failed = true"
  />
  <span
    v-else-if="iso2Label"
    data-slot="country-flag-fallback"
    :aria-label="props.alt ?? `${props.iso2} flag`"
    :class="
      cn(
        'ring-border/40 bg-muted text-muted-foreground inline-flex h-4 w-6 items-center justify-center rounded-sm text-[8px] font-semibold leading-none tracking-tight ring-1',
        props.class
      )
    "
  >
    {{ iso2Label }}
  </span>
  <slot v-else name="empty">
    <span
      data-slot="country-flag-empty"
      :class="cn('bg-muted inline-block h-4 w-6 rounded-sm', props.class)"
    />
  </slot>
</template>
