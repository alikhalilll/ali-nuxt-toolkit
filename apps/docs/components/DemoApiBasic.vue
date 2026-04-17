<script setup lang="ts">
import { ApiError } from '@alikhalilll/nuxt-api-provider/types';

interface Post {
  id: number;
  title: string;
  body: string;
}

const { $apiProvider } = useNuxtApp();
const result = ref<string>('');
const loading = ref(false);

const run = async () => {
  loading.value = true;
  result.value = '';
  try {
    const post = await $apiProvider<Post>('/posts/1');
    result.value = JSON.stringify(post, null, 2);
  } catch (e) {
    result.value = e instanceof ApiError ? `ApiError ${e.status}: ${e.message}` : String(e);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · GET /posts/1
    </h4>
    <button
      :disabled="loading"
      class="cursor-pointer rounded border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      @click="run"
    >
      {{ loading ? 'Loading…' : 'Fetch' }}
    </button>
    <pre
      v-if="result"
      class="mt-3 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-[13px] text-text-dim"
      >{{ result }}</pre
    >
  </div>
</template>
