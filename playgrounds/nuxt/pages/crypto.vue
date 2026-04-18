<script setup lang="ts">
const { $crypto } = useNuxtApp();

const input = ref('hello from the playground');
const ciphertext = ref('');
const plaintext = ref('');

const encryptNow = async () => {
  ciphertext.value = await $crypto.encrypt(input.value);
};
const decryptNow = async () => {
  plaintext.value = await $crypto.decrypt(ciphertext.value);
};

const jsonInput = ref('{"email":"a@b.com","token":"xyz"}');
const jsonCipher = ref('');
const jsonClear = ref<unknown>(null);
const encryptJson = async () => {
  const parsed = JSON.parse(jsonInput.value);
  jsonCipher.value = await $crypto.encrypt(JSON.stringify(parsed));
};
const decryptJson = async () => {
  jsonClear.value = JSON.parse(await $crypto.decrypt(jsonCipher.value));
};

const bulkCount = ref(50);
const bulkEncryptMs = ref<number | null>(null);
const bulkDecryptMs = ref<number | null>(null);
const bulkDecryptNoCacheMs = ref<number | null>(null);

async function bulkRun() {
  const items = Array.from({ length: bulkCount.value }, (_, i) => `item-${i}`);

  const t1 = performance.now();
  const payloads = await Promise.all(items.map((i) => $crypto.encrypt(i)));
  bulkEncryptMs.value = Math.round(performance.now() - t1);

  const t2 = performance.now();
  await Promise.all(payloads.map((p) => $crypto.decrypt(p)));
  bulkDecryptMs.value = Math.round(performance.now() - t2);

  $crypto.clearKeyCache();
  const t3 = performance.now();
  await Promise.all(payloads.map((p) => $crypto.decrypt(p)));
  bulkDecryptNoCacheMs.value = Math.round(performance.now() - t3);
}

const invalidError = ref('');
const decryptInvalid = async () => {
  try {
    await $crypto.decrypt('not-a-real-payload');
    invalidError.value = '(unexpectedly succeeded)';
  } catch (e) {
    invalidError.value = (e as Error).message;
  }
};

const fpInput = ref('bound-to-this-browser');
const fpToken = ref('');
const fpDecrypted = ref('');
const fpUnboundError = ref('');

const fpEncrypt = async () => {
  fpDecrypted.value = '';
  fpUnboundError.value = '';
  const res = await $fetch<{ token: string }>('/api/crypto/fingerprint-encrypt', {
    method: 'POST',
    body: { text: fpInput.value },
  });
  fpToken.value = res.token;
};

const fpDecrypt = async () => {
  const res = await $fetch<{ text: string }>('/api/crypto/fingerprint-decrypt', {
    method: 'POST',
    body: { token: fpToken.value },
  });
  fpDecrypted.value = res.text;
};

const fpDecryptUnbound = async () => {
  try {
    fpUnboundError.value = '';
    // Same ciphertext, but call the plain client-side $crypto.decrypt without a
    // fingerprint — a bound payload rejects this.
    await $crypto.decrypt(fpToken.value);
    fpUnboundError.value = '(unexpectedly succeeded)';
  } catch (e) {
    fpUnboundError.value = (e as Error).message || String(e);
  }
};

const payloadParts = computed(() => {
  if (!ciphertext.value) return null;
  const [version, salt, iv, cipher] = ciphertext.value.split('.');
  return { version, salt, iv, cipher };
});

onMounted(async () => {
  await encryptNow();
});

const input1 =
  'w-full rounded border border-border bg-code-bg px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none';
const btnPrimary =
  'cursor-pointer rounded border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50';
const btnBase =
  'cursor-pointer rounded border border-border bg-surface-2 px-3.5 py-2 text-sm text-text transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'cursor-pointer rounded border border-danger bg-surface-2 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-border';
const label = 'mb-1 block text-xs uppercase tracking-wider text-text-dim';
const preBox =
  'overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text';
const card = 'mb-4 rounded-xl border border-border bg-surface p-5';
const cardH = 'mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold';
const metric =
  'inline-flex min-w-[7rem] flex-col rounded-lg border border-border bg-surface-2 px-3 py-2';
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">crypto demo</h1>
    <p class="mb-6 text-text-dim">
      All operations use
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">$crypto</code>, typed as
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">CryptoService</code>. The
      passphrase and iterations come from
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">nuxt.config.ts</code>.
    </p>

    <div :class="card">
      <h2 :class="cardH">1. Round-trip</h2>
      <label :class="label">Plain text</label>
      <input v-model="input" type="text" :class="input1" />
      <div class="mt-3 flex gap-2">
        <button :class="btnPrimary" @click="encryptNow">encrypt</button>
        <button :class="btnBase" :disabled="!ciphertext" @click="decryptNow">decrypt</button>
      </div>
      <template v-if="ciphertext">
        <h3 class="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          payload
        </h3>
        <pre :class="preBox">{{ ciphertext }}</pre>
        <h3 class="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          parts
        </h3>
        <pre :class="preBox">{{ payloadParts }}</pre>
      </template>
      <template v-if="plaintext">
        <h3 class="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          decrypted
        </h3>
        <pre :class="preBox">{{ plaintext }}</pre>
      </template>
    </div>

    <div :class="card">
      <h2 :class="cardH">2. Encrypt a JSON object</h2>
      <p class="mb-2 text-sm text-text-dim">
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
          >CryptoService.encrypt</code
        >
        takes a string — serialise structured data via
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">JSON.stringify</code>
        first.
      </p>
      <label :class="label">JSON input</label>
      <input v-model="jsonInput" type="text" :class="input1" />
      <div class="mt-3 flex gap-2">
        <button :class="btnPrimary" @click="encryptJson">encrypt JSON</button>
        <button :class="btnBase" :disabled="!jsonCipher" @click="decryptJson">
          decrypt + parse
        </button>
      </div>
      <template v-if="jsonCipher">
        <h3 class="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          payload
        </h3>
        <pre :class="preBox">{{ jsonCipher }}</pre>
      </template>
      <template v-if="jsonClear">
        <h3 class="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          decrypted (parsed)
        </h3>
        <pre :class="preBox">{{ jsonClear }}</pre>
      </template>
    </div>

    <div :class="card">
      <h2 :class="cardH">3. Key cache impact</h2>
      <p class="mb-2 text-sm text-text-dim">
        Each encrypt uses a fresh salt, but all decrypts for the same set of payloads hit the cache
        if
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
          >keyCacheSize &gt; 0</code
        >. The third timing clears the cache first.
      </p>
      <label :class="label">Items</label>
      <input v-model.number="bulkCount" type="text" :class="input1" />
      <div class="mt-3">
        <button :class="btnPrimary" @click="bulkRun">run</button>
      </div>
      <div v-if="bulkEncryptMs !== null" class="mt-4 flex flex-wrap gap-2">
        <div :class="metric">
          <span class="text-[10px] uppercase tracking-wider text-text-dim">encrypt N</span>
          <span class="font-mono text-lg text-text">{{ bulkEncryptMs }}ms</span>
        </div>
        <div :class="metric">
          <span class="text-[10px] uppercase tracking-wider text-text-dim">
            decrypt (cache hot)
          </span>
          <span class="font-mono text-lg text-text">{{ bulkDecryptMs }}ms</span>
        </div>
        <div :class="metric">
          <span class="text-[10px] uppercase tracking-wider text-text-dim">
            decrypt (cache cleared)
          </span>
          <span class="font-mono text-lg text-text">{{ bulkDecryptNoCacheMs }}ms</span>
        </div>
      </div>
    </div>

    <div :class="card">
      <h2 :class="cardH">4. Invalid payload handling</h2>
      <button :class="btnDanger" @click="decryptInvalid">decrypt garbage</button>
      <pre v-if="invalidError" :class="'mt-3 ' + preBox">{{ invalidError }}</pre>
    </div>

    <div :class="card">
      <h2 :class="cardH">5. Device fingerprint (server-only)</h2>
      <p class="mb-2 text-sm text-text-dim">
        Encrypt / decrypt happen in
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
          >server/api/crypto/fingerprint-*.post.ts</code
        >. The first encrypt sets an HttpOnly cookie (<code
          class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
          >__nuxt_crypto_device</code
        >) and binds the payload to this browser. Copy the token into another browser and decrypt
        will fail.
      </p>
      <label :class="label">Plain text</label>
      <input v-model="fpInput" type="text" :class="input1" />
      <div class="mt-3 flex flex-wrap gap-2">
        <button :class="btnPrimary" @click="fpEncrypt">encrypt (server)</button>
        <button :class="btnBase" :disabled="!fpToken" @click="fpDecrypt">decrypt (server)</button>
        <button :class="btnDanger" :disabled="!fpToken" @click="fpDecryptUnbound">
          try decrypt without fingerprint
        </button>
      </div>
      <template v-if="fpToken">
        <h3 class="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          bound payload
        </h3>
        <pre :class="preBox">{{ fpToken }}</pre>
      </template>
      <template v-if="fpDecrypted">
        <h3 class="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          decrypted (same browser)
        </h3>
        <pre :class="preBox">{{ fpDecrypted }}</pre>
      </template>
      <template v-if="fpUnboundError">
        <h3 class="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          decrypt without fingerprint
        </h3>
        <pre :class="preBox">{{ fpUnboundError }}</pre>
      </template>
    </div>
  </section>
</template>
