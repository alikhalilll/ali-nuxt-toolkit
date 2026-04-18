<script setup lang="ts">
import { createCryptoService } from '@alikhalilll/nuxt-crypto/core';
import type { CryptoService } from '@alikhalilll/nuxt-crypto/core';

const passphrase = ref('correct-horse-battery-staple');
const iterations = ref(10_000);

let service: CryptoService | null = null;
const serviceReady = ref(false);

const buildService = async () => {
  service = await createCryptoService({
    passphrase: passphrase.value,
    iterations: iterations.value,
    keyCacheSize: 32,
  });
  serviceReady.value = true;
  plain.value = '';
  cipher.value = '';
  roundtrip.value = '';
  wrongPassError.value = '';
};

const resetService = () => {
  service?.clearKeyCache();
  service = null;
  serviceReady.value = false;
  plain.value = '';
  cipher.value = '';
  roundtrip.value = '';
  wrongPassError.value = '';
};

const plain = ref('hello from a framework-agnostic service');
const cipher = ref('');
const roundtrip = ref('');

const encrypt = async () => {
  if (!service) return;
  cipher.value = await service.encrypt(plain.value);
  roundtrip.value = '';
};

const decrypt = async () => {
  if (!service) return;
  roundtrip.value = await service.decrypt(cipher.value);
};

const wrongPassphrase = ref('a-different-passphrase');
const wrongPassError = ref('');

const decryptWithWrongPassphrase = async () => {
  if (!cipher.value) return;
  wrongPassError.value = '';
  try {
    const other = await createCryptoService({
      passphrase: wrongPassphrase.value,
      iterations: iterations.value,
    });
    const out = await other.decrypt(cipher.value);
    wrongPassError.value = `(unexpectedly decrypted to: ${out})`;
  } catch (e) {
    wrongPassError.value = (e as Error).message || String(e);
  }
};

const payloadParts = computed(() => {
  if (!cipher.value) return null;
  const [version, salt, iv, data] = cipher.value.split('.');
  return { version, salt, iv, cipher: data };
});

const btnPrimary =
  'cursor-pointer rounded border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50';
const btnBase =
  'cursor-pointer rounded border border-border bg-surface-2 px-3.5 py-2 text-sm transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'cursor-pointer rounded border border-danger bg-surface-2 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50';
const input1 =
  'w-full rounded border border-border bg-code-bg px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none disabled:opacity-60';
const label = 'mb-1 block text-xs uppercase tracking-wider text-text-dim';
const preBox =
  'overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text';
const card = 'mb-4 rounded-xl border border-border bg-surface p-5';
const cardH = 'mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold';
const codeChip = 'rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2';
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">crypto · core demo</h1>
    <p class="mb-6 text-text-dim">
      This page never uses
      <code :class="codeChip">$crypto</code>. It imports
      <code :class="codeChip">createCryptoService</code>
      from
      <code :class="codeChip">@alikhalilll/nuxt-crypto/core</code>
      and builds a service locally from a passphrase you control — the same code runs in Node 20+,
      Bun, Deno, or any browser where
      <code :class="codeChip">SubtleCrypto</code> exists.
    </p>

    <div :class="card">
      <h2 :class="cardH">1. Build a service</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <div>
          <label :class="label">passphrase</label>
          <input
            v-model="passphrase"
            type="text"
            :class="input1"
            :disabled="serviceReady"
            autocomplete="off"
          />
        </div>
        <div>
          <label :class="label">PBKDF2 iterations</label>
          <input
            v-model.number="iterations"
            type="number"
            :class="input1"
            :disabled="serviceReady"
          />
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button :class="btnPrimary" :disabled="serviceReady" @click="buildService">
          createCryptoService(...)
        </button>
        <button :class="btnDanger" :disabled="!serviceReady" @click="resetService">reset</button>
      </div>
    </div>

    <div :class="card">
      <h2 :class="cardH">2. Round-trip</h2>
      <label :class="label">plain text</label>
      <input v-model="plain" type="text" :class="input1" :disabled="!serviceReady" />
      <div class="mt-3 flex flex-wrap gap-2">
        <button :class="btnPrimary" :disabled="!serviceReady" @click="encrypt">encrypt</button>
        <button :class="btnBase" :disabled="!serviceReady || !cipher" @click="decrypt">
          decrypt
        </button>
      </div>
      <template v-if="cipher">
        <h3 class="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          payload
        </h3>
        <pre :class="preBox">{{ cipher }}</pre>
        <h3 class="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          parts
        </h3>
        <pre :class="preBox">{{ payloadParts }}</pre>
      </template>
      <template v-if="roundtrip">
        <h3 class="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          decrypted
        </h3>
        <pre :class="preBox">{{ roundtrip }}</pre>
      </template>
    </div>

    <div :class="card">
      <h2 :class="cardH">3. Different passphrase → decrypt fails</h2>
      <p class="mb-3 text-sm text-text-dim">
        Build a <em>second</em>, independent service with a different passphrase and try to decrypt
        the payload above. AES-GCM authentication rejects it.
      </p>
      <label :class="label">second passphrase</label>
      <input v-model="wrongPassphrase" type="text" :class="input1" />
      <div class="mt-3">
        <button :class="btnDanger" :disabled="!cipher" @click="decryptWithWrongPassphrase">
          decrypt with wrong passphrase
        </button>
      </div>
      <pre v-if="wrongPassError" :class="'mt-3 ' + preBox">{{ wrongPassError }}</pre>
    </div>

    <div :class="card">
      <h2 :class="cardH">Why this works anywhere</h2>
      <p class="text-sm text-text-dim">
        <code :class="codeChip">createCryptoService</code> depends only on
        <code :class="codeChip">SubtleCrypto</code>. In Node 20+ that's
        <code :class="codeChip">globalThis.crypto.subtle</code>; in a browser it's
        <code :class="codeChip">window.crypto.subtle</code>. You can inject your own implementation
        via the <code :class="codeChip">subtle</code> config field for tests.
      </p>
    </div>
  </section>
</template>
