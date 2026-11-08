<script setup lang="ts">
/**
 * Homepage-only variant of DemoCrypto — pure round-trip widget.
 * Input, two buttons, cipher output, decrypted output.
 */
import { ref } from 'vue';

const { $crypto } = useNuxtApp();
const input = ref('hello from the docs');
const cipher = ref('');
const clear = ref('');
const busy = ref(false);

async function encrypt() {
  busy.value = true;
  try {
    cipher.value = await $crypto.encrypt(input.value);
    clear.value = '';
  } finally {
    busy.value = false;
  }
}
async function decrypt() {
  if (!cipher.value) return;
  busy.value = true;
  try {
    clear.value = await $crypto.decrypt(cipher.value);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="hdc">
    <label class="hdc__label">
      <span>Plaintext</span>
      <input v-model="input" type="text" class="hdc__input" :disabled="busy" />
    </label>

    <div class="hdc__row">
      <button type="button" class="hdc__btn hdc__btn--primary" :disabled="busy" @click="encrypt">
        Encrypt
      </button>
      <button type="button" class="hdc__btn" :disabled="busy || !cipher" @click="decrypt">
        Decrypt
      </button>
    </div>

    <div v-if="cipher" class="hdc__out">
      <span class="hdc__out-label">cipher</span>
      <code class="hdc__out-value">{{ cipher }}</code>
    </div>
    <div v-if="clear" class="hdc__out hdc__out--ok">
      <span class="hdc__out-label">decrypted</span>
      <code class="hdc__out-value">{{ clear }}</code>
    </div>
  </div>
</template>

<style scoped>
.hdc {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hdc__label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}
.hdc__input {
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 0.375rem;
  background: var(--color-code-bg);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  transition: box-shadow 150ms ease;
}
.hdc__input:focus {
  outline: 0;
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.hdc__row {
  display: flex;
  gap: 0.5rem;
}
.hdc__btn {
  padding: 0.4375rem 0.875rem;
  border: 0;
  border-radius: 0.375rem;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 150ms ease,
    box-shadow 150ms ease;
}
.hdc__btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  box-shadow: inset 0 0 0 1px var(--border-strong);
}
.hdc__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hdc__btn--primary {
  background: var(--color-accent);
  color: #0a0a0a;
  box-shadow: none;
}
.hdc__btn--primary:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-accent) 85%, white);
  box-shadow: none;
}

.hdc__out {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.375rem;
  background: var(--color-code-bg);
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.hdc__out--ok {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--success) 60%, var(--color-border));
}
.hdc__out-label {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.hdc__out--ok .hdc__out-label {
  color: var(--success);
}
.hdc__out-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text);
  word-break: break-all;
  overflow-wrap: anywhere;
}
</style>
