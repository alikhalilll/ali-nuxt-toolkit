<script setup lang="ts">
import { createApiClient, isApiError } from '@alikhalilll/nuxt-api-provider/core';
import type { ApiProviderClient } from '@alikhalilll/nuxt-api-provider/core';

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

const baseURL = ref('https://jsonplaceholder.typicode.com');
const traceId = ref(
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
);

let client: ApiProviderClient | null = null;
const clientReady = ref(false);

type LogLevel = 'info' | 'success' | 'error';
const log = ref<Array<{ level: LogLevel; msg: string }>>([]);
const push = (msg: string, level: LogLevel = 'info') => log.value.unshift({ msg, level });

const buildClient = () => {
  client = createApiClient({
    baseURL: baseURL.value,
    timeoutMs: 8_000,
    retry: { attempts: 1, delayMs: 200 },
    headers: { 'X-Demo': 'core' },
  });

  client.useRequest((ctx) => {
    ctx.headers['X-Trace-Id'] = traceId.value;
  });

  client.useError((err) => {
    push(`[onError] ${err.status} ${err.message}`, 'error');
  });

  clientReady.value = true;
  push(`client ready · baseURL=${baseURL.value}`, 'success');
};

const resetClient = () => {
  client = null;
  clientReady.value = false;
  log.value = [];
};

const post = ref<Post | null>(null);
const loadPost = async () => {
  if (!client) return;
  push('GET /posts/1');
  try {
    post.value = (await client<Post>('/posts/1')) ?? null;
    push(`ok · id=${post.value?.id}`, 'success');
  } catch (e) {
    if (isApiError(e)) push(`ApiError ${e.status}: ${e.message}`, 'error');
  }
};

const trigger404 = async () => {
  if (!client) return;
  push('GET /definitely-missing');
  try {
    await client('/definitely-missing');
  } catch (e) {
    if (isApiError(e)) push(`caught ApiError · status=${e.status}`, 'error');
  }
};

const serverPost = ref<Post | null>(null);
const loadFromNitro = async () => {
  push('GET /api/core/proxy?id=2  (Nitro handler uses createApiClient)');
  const res = await $fetch<
    { ok: true; post: Post } | { ok: false; status: number; message: string }
  >('/api/core/proxy', { query: { id: 2 } });
  if (res.ok) {
    serverPost.value = res.post;
    push(`Nitro → post #${res.post.id}`, 'success');
  } else {
    push(`Nitro → ApiError ${res.status}: ${res.message}`, 'error');
  }
};

const btnPrimary =
  'cursor-pointer rounded border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50';
const btnBase =
  'cursor-pointer rounded border border-border bg-surface-2 px-3.5 py-2 text-sm transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'cursor-pointer rounded border border-danger bg-surface-2 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50';
const input1 =
  'w-full rounded border border-border bg-code-bg px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none';
const label = 'mb-1 block text-xs uppercase tracking-wider text-text-dim';
const preBox =
  'overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text';
const card = 'mb-4 rounded-xl border border-border bg-surface p-5';
const cardH = 'mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold';
const codeChip = 'rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2';
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">api-provider · core demo</h1>
    <p class="mb-6 text-text-dim">
      This page never touches
      <code :class="codeChip">$apiProvider</code> or <code :class="codeChip">useNuxtApp</code>. It
      imports
      <code :class="codeChip">createApiClient</code>
      from
      <code :class="codeChip">@alikhalilll/nuxt-api-provider/core</code>
      and builds a client locally — the same code would run in Bun, Deno, a Web Worker, or a CLI.
    </p>

    <div :class="card">
      <h2 :class="cardH">1. Build a client</h2>
      <label :class="label">baseURL</label>
      <input v-model="baseURL" type="text" :class="input1" :disabled="clientReady" />
      <p class="mt-2 text-xs text-text-dim">
        Interceptors added below: request → inject <code :class="codeChip">X-Trace-Id</code>, error
        → log.
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button :class="btnPrimary" :disabled="clientReady" @click="buildClient">
          createApiClient(...)
        </button>
        <button :class="btnDanger" :disabled="!clientReady" @click="resetClient">reset</button>
      </div>
    </div>

    <div :class="card">
      <h2 :class="cardH">2. Call it (browser)</h2>
      <div class="flex flex-wrap gap-2">
        <button :class="btnPrimary" :disabled="!clientReady" @click="loadPost">GET /posts/1</button>
        <button :class="btnBase" :disabled="!clientReady" @click="trigger404">trigger 404</button>
      </div>
      <template v-if="post">
        <h3 class="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          result
        </h3>
        <pre :class="preBox">{{ post }}</pre>
      </template>
    </div>

    <div :class="card">
      <h2 :class="cardH">3. Same core, inside Nitro</h2>
      <p class="mb-3 text-sm text-text-dim">
        <code :class="codeChip">server/api/core/proxy.get.ts</code> creates its own
        <code :class="codeChip">createApiClient</code> instance and proxies a post. No Nuxt plugin,
        no request-scoped state — a single long-lived client reused across requests.
      </p>
      <button :class="btnPrimary" @click="loadFromNitro">call Nitro proxy</button>
      <template v-if="serverPost">
        <h3 class="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          result
        </h3>
        <pre :class="preBox">{{ serverPost }}</pre>
      </template>
    </div>

    <div :class="card">
      <h2 :class="cardH">Log</h2>
      <div
        class="max-h-52 overflow-y-auto rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text-dim"
      >
        <div v-if="log.length === 0">No activity yet — build a client and fire a request.</div>
        <div
          v-for="(line, i) in log"
          :key="i"
          class="border-b border-dashed border-border/50 py-0.5 last:border-b-0"
          :class="{
            'text-accent': line.level === 'info',
            'text-success': line.level === 'success',
            'text-danger': line.level === 'error',
          }"
        >
          {{ line.msg }}
        </div>
      </div>
    </div>
  </section>
</template>
