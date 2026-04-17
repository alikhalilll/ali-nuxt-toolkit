<script setup lang="ts">
const { $apiProvider } = useNuxtApp();

const uploadRatio = ref(0);
const downloadRatio = ref(0);
const uploadLoaded = ref(0);
const downloadLoaded = ref(0);
const running = ref(false);
const message = ref('');

const fmt = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

const run = async () => {
  running.value = true;
  message.value = '';
  uploadRatio.value = 0;
  downloadRatio.value = 0;
  uploadLoaded.value = 0;
  downloadLoaded.value = 0;

  const blob = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'application/octet-stream' });
  const form = new FormData();
  form.append('file', blob, 'demo.bin');

  try {
    await $apiProvider('https://httpbin.org/post', {
      method: 'POST',
      body: form,
      timeoutMs: 60_000,
      retry: { attempts: 0 },
      onRequestProgress: (p) => {
        if (p.phase === 'upload') {
          uploadLoaded.value = p.loaded;
          if (p.ratio != null) uploadRatio.value = p.ratio;
        } else {
          downloadLoaded.value = p.loaded;
          if (p.ratio != null) downloadRatio.value = p.ratio;
        }
      },
    });
    message.value = 'done';
  } catch (e) {
    message.value = (e as Error).message;
  } finally {
    running.value = false;
  }
};
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · onRequestProgress (2 MB upload)
    </h4>
    <button
      :disabled="running"
      class="cursor-pointer rounded border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      @click="run"
    >
      {{ running ? 'Running…' : 'Start' }}
    </button>

    <div class="mt-4">
      <div class="mb-1 text-xs text-text-dim">upload · {{ fmt(uploadLoaded) }}</div>
      <div class="h-2 overflow-hidden rounded-full border border-border bg-code-bg">
        <div
          class="h-full bg-accent transition-[width] duration-150 ease-linear"
          :style="{ width: (uploadRatio * 100).toFixed(1) + '%' }"
        />
      </div>
    </div>

    <div class="mt-3">
      <div class="mb-1 text-xs text-text-dim">download · {{ fmt(downloadLoaded) }}</div>
      <div class="h-2 overflow-hidden rounded-full border border-border bg-code-bg">
        <div
          class="h-full bg-success transition-[width] duration-150 ease-linear"
          :style="{ width: (downloadRatio * 100).toFixed(1) + '%' }"
        />
      </div>
    </div>

    <div
      v-if="message"
      class="mt-3 rounded-md border border-border bg-code-bg p-3 font-mono text-[13px] text-text-dim"
    >
      {{ message }}
    </div>
  </div>
</template>
