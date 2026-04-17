<script setup lang="ts">
const { $crypto } = useNuxtApp();
const input = ref('hello from the docs');
const cipher = ref('');
const clear = ref('');

const encrypt = async () => {
  cipher.value = await $crypto.encrypt(input.value);
  clear.value = '';
};
const decrypt = async () => {
  clear.value = await $crypto.decrypt(cipher.value);
};
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · AES-GCM round-trip
    </h4>
    <input
      v-model="input"
      type="text"
      placeholder="plaintext"
      class="mb-2 w-full rounded border border-border bg-code-bg px-3 py-2 font-mono text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
    />
    <div class="flex gap-2">
      <button
        class="cursor-pointer rounded border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg transition-[filter] hover:brightness-110"
        @click="encrypt"
      >
        encrypt
      </button>
      <button
        :disabled="!cipher"
        class="cursor-pointer rounded border border-border bg-surface-2 px-3.5 py-1.5 text-sm text-text transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50"
        @click="decrypt"
      >
        decrypt
      </button>
    </div>
    <div
      v-if="cipher"
      class="mt-3 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-[13px] text-text-dim"
    >
      {{ cipher }}
    </div>
    <div
      v-if="clear"
      class="mt-2 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-[13px] text-text-dim"
    >
      decrypted → {{ clear }}
    </div>
  </div>
</template>
