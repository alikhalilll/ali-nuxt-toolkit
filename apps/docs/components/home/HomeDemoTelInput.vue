<script setup lang="ts">
/**
 * Homepage-only variant of DemoTelInputBasic — no Preview / Code tabs,
 * no live-state JSON panel. Just the input with its default validation
 * display, nothing else.
 */
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);
const tellRef = ref<InstanceType<typeof ATelInput> | null>(null);
</script>

<template>
  <div class="hdt">
    <ATelInput
      ref="tellRef"
      v-model:phone="phone"
      v-model:country="country"
      show-validation
      placeholder="+44 7911 123456"
    />
    <p class="hdt__hint">Try a dial code — the flag reveals when it matches.</p>
  </div>
</template>

<style scoped>
.hdt {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 24rem;
  margin: 0 auto;
}
.hdt__hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
