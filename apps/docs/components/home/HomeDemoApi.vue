<script setup lang="ts">
/**
 * Homepage-only variant of DemoApiBasic — no Preview / Code tabs, no
 * "Live · GET …" label strip. A single Fetch button that renders the
 * response as a compact pre block below.
 */
import { ref } from 'vue';
import { isApiError } from '@alikhalilll/nuxt-api-provider/types';

interface Post {
  id: number;
  title: string;
  body: string;
}

const { $apiProvider } = useNuxtApp();
const result = ref<string>('');
const loading = ref(false);

async function run() {
  loading.value = true;
  result.value = '';
  try {
    const post = await $apiProvider<Post>('/posts/1.json');
    result.value = JSON.stringify(post, null, 2);
  } catch (e) {
    if (isApiError(e)) {
      result.value = `ApiError ${e.status}: ${e.message}`;
    } else {
      result.value = String(e);
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="hda">
    <div class="hda__row">
      <button type="button" :disabled="loading" class="hda__btn" @click="run">
        <span v-if="!loading" class="hda__btn-dot" aria-hidden="true" />
        <span v-else class="hda__btn-spinner" aria-hidden="true" />
        {{ loading ? 'Fetching…' : 'Fetch /posts/1' }}
      </button>
      <span class="hda__hint">Typed <code>GET</code> + cache-dedupe</span>
    </div>

    <pre v-if="result" class="hda__out">{{ result }}</pre>
    <div v-else class="hda__placeholder">
      <span class="hda__placeholder-mark" aria-hidden="true" />
      Click <strong>Fetch</strong> to see the response.
    </div>
  </div>
</template>

<style scoped>
.hda {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hda__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
}
.hda__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--color-accent);
  color: #0a0a0a;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 150ms ease,
    transform 150ms ease;
}
.hda__btn:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-accent) 85%, white);
  transform: translateY(-1px);
}
.hda__btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.hda__btn-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #0a0a0a;
}
.hda__btn-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(10, 10, 10, 0.3);
  border-top-color: #0a0a0a;
  border-radius: 999px;
  animation: hda-spin 700ms linear infinite;
}
@keyframes hda-spin {
  to {
    transform: rotate(360deg);
  }
}
.hda__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.hda__hint code {
  font-family: var(--font-mono);
  color: var(--color-text-dim);
}
.hda__out {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: var(--color-code-bg);
  box-shadow: inset 0 0 0 1px var(--color-border);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--color-text);
  overflow-x: auto;
  max-height: 14rem;
  overflow-y: auto;
}
.hda__placeholder {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: inset 0 0 0 1px var(--color-border);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.hda__placeholder-mark {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--color-accent);
}
</style>
