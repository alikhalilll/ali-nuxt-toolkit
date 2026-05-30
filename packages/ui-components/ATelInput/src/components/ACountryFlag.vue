<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { defaultFlagUrl } from '../utils/flag-url';
import type { ACountryFlagProps, ACountryFlagSlots } from '../types';

const props = withDefaults(defineProps<ACountryFlagProps>(), { width: 40 });
defineSlots<ACountryFlagSlots>();

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
    :class="cn('a-country-flag', props.class)"
    @error="failed = true"
  />
  <span
    v-else-if="iso2Label"
    data-slot="country-flag-fallback"
    :aria-label="props.alt ?? `${props.iso2} flag`"
    :class="cn('a-country-flag a-country-flag--fallback', props.class)"
  >
    {{ iso2Label }}
  </span>
  <slot v-else name="empty">
    <span
      data-slot="country-flag-empty"
      :class="cn('a-country-flag a-country-flag--empty', props.class)"
    />
  </slot>
</template>

<style scoped>
.a-country-flag {
  display: inline-block;
  width: 1.5rem;
  height: 1rem;
  border-radius: 0.125rem;
  object-fit: cover;
  box-shadow: 0 0 0 1px hsl(var(--ak-ui-border) / 0.4);
}

.a-country-flag--fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--ak-ui-muted));
  color: hsl(var(--ak-ui-muted-foreground));
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
}

.a-country-flag--empty {
  background: hsl(var(--ak-ui-muted));
  box-shadow: none;
}
</style>
