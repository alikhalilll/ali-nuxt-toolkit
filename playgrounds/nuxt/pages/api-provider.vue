<script setup lang="ts">
import {
  isApiError,
  type ApiProviderClient,
  type IError,
} from '@alikhalilll/nuxt-api-provider/types';

type PostError = IError<'title' | 'body', 'hint'>;

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

const { $apiProvider } = useNuxtApp();
const api: ApiProviderClient = $apiProvider;

type LogLevel = 'info' | 'success' | 'error';
const log = ref<Array<{ level: LogLevel; msg: string }>>([]);
const push = (msg: string, level: LogLevel = 'info') => log.value.unshift({ msg, level });

const post = ref<Post | null>(null);
const loadPost = async () => {
  push('GET /posts/1');
  try {
    post.value = (await api<Post>('/posts/1')) ?? null;
    push(`→ ok, post #${post.value?.id}`, 'success');
  } catch (e) {
    push(`→ ${(e as Error).message}`, 'error');
  }
};

const userPosts = ref<Post[]>([]);
const loadUserPosts = async () => {
  push('GET /posts?userId=1');
  userPosts.value = (await api<Post[]>('/posts', null, { userId: 1 })) ?? [];
  push(`→ ${userPosts.value.length} posts`, 'success');
};

const created = ref<Post | null>(null);
const createPost = async () => {
  push('POST /posts with JSON body');
  created.value =
    (await api<Post>('/posts', {
      method: 'POST',
      body: { userId: 42, title: 'Hello', body: 'From the playground' },
    })) ?? null;
  push(`→ created post #${created.value?.id}`, 'success');
};

const updatePost = async () => {
  push('PATCH /posts/1');
  const res = await api<Post>('/posts/1', {
    method: 'PATCH',
    body: { title: 'Updated title' },
  });
  push(`→ ${res?.title}`, 'success');
};

const deletePost = async () => {
  push('DELETE /posts/1');
  await api('/posts/1', { method: 'DELETE' });
  push('→ deleted', 'success');
};

const uploadForm = async () => {
  push('POST /posts with FormData');
  const form = new FormData();
  form.append('title', 'multipart');
  form.append('body', 'from FormData');
  const res = await api<Post>('/posts', { method: 'POST', body: form });
  push(`→ id ${res?.id}`, 'success');
};

const triggerError = async () => {
  push('GET /nope (will 404)');
  try {
    await api('/nope');
  } catch (e) {
    if (isApiError(e)) {
      const details = e.details as PostError['details'];
      const fieldCount = Object.keys(details.errors).length;
      push(`→ ApiError status=${e.status} msg="${e.message}" fields=${fieldCount}`, 'error');
    } else push(`→ ${(e as Error).message}`, 'error');
  }
};

const triggerTimeout = async () => {
  push('GET /posts with timeoutMs=1');
  try {
    await api('/posts', { timeoutMs: 1 });
  } catch (e) {
    if (isApiError(e)) push(`→ ApiError status=${e.status} msg="${e.message}"`, 'error');
  }
};

const triggerAbort = async () => {
  push('GET /posts with external AbortSignal');
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 5);
  try {
    await api('/posts', { signal: ctrl.signal });
  } catch (e) {
    if (isApiError(e)) push(`→ aborted: ${e.message}`, 'error');
  }
};

let unregister: (() => void) | null = null;
const interceptorActive = ref(false);
const toggleInterceptor = () => {
  if (unregister) {
    unregister();
    unregister = null;
    interceptorActive.value = false;
    push('request interceptor: off', 'info');
  } else {
    unregister = api.useRequest((ctx) => {
      ctx.headers['X-Playground'] = 'yes';
      push(`interceptor → injected X-Playground on ${ctx.endpoint}`, 'info');
    });
    interceptorActive.value = true;
    push('request interceptor: on', 'success');
  }
};

const retryDemo = async () => {
  push('GET /status/503 with retry.attempts=2');
  try {
    await api('https://httpbin.org/status/503', {
      retry: { attempts: 2, delayMs: 200, backoff: 2 },
      timeoutMs: 5000,
    });
  } catch (e) {
    if (isApiError(e)) push(`→ still failing after retries: status=${e.status}`, 'error');
  }
};

const uploadRatio = ref(0);
const downloadRatio = ref(0);
const uploadLoaded = ref(0);
const downloadLoaded = ref(0);
const progressRunning = ref(false);

const runProgress = async () => {
  uploadRatio.value = 0;
  downloadRatio.value = 0;
  uploadLoaded.value = 0;
  downloadLoaded.value = 0;
  progressRunning.value = true;

  const blob = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'application/octet-stream' });
  const form = new FormData();
  form.append('file', blob, 'dummy.bin');

  push('POST with onRequestProgress (~2 MB)');
  try {
    await api('https://httpbin.org/post', {
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
    push('→ progress demo complete', 'success');
  } catch (e) {
    push(`→ ${(e as Error).message}`, 'error');
  } finally {
    progressRunning.value = false;
  }
};

const fmtBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

const btnBase =
  'cursor-pointer rounded border border-border bg-surface-2 px-3.5 py-2 text-sm transition-colors hover:bg-border';
const btnPrimary =
  'cursor-pointer rounded border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'cursor-pointer rounded border border-danger bg-surface-2 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-border';
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">api-provider demo</h1>
    <p class="mb-6 text-text-dim">
      Every button below calls
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">$apiProvider</code>
      from
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">useNuxtApp()</code>,
      typed as
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">ApiProviderClient</code>.
    </p>

    <div class="mb-4 rounded-xl border border-border bg-surface p-5">
      <h2 class="mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold">Actions</h2>
      <div class="flex flex-wrap gap-2">
        <button :class="btnPrimary" @click="loadPost">GET /posts/1</button>
        <button :class="btnBase" @click="loadUserPosts">GET with queries</button>
        <button :class="btnBase" @click="createPost">POST JSON</button>
        <button :class="btnBase" @click="updatePost">PATCH</button>
        <button :class="btnDanger" @click="deletePost">DELETE</button>
        <button :class="btnBase" @click="uploadForm">POST FormData</button>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <button :class="btnBase" @click="triggerError">Trigger 404</button>
        <button :class="btnBase" @click="triggerTimeout">Trigger timeout</button>
        <button :class="btnBase" @click="triggerAbort">Abort manually</button>
        <button :class="btnBase" @click="retryDemo">Retry + backoff</button>
        <button :class="btnBase" @click="toggleInterceptor">
          Interceptor:
          <span
            class="ml-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            :class="
              interceptorActive ? 'border-success text-success' : 'border-border text-text-dim'
            "
          >
            {{ interceptorActive ? 'on' : 'off' }}
          </span>
        </button>
      </div>
    </div>

    <div class="mb-4 rounded-xl border border-border bg-surface p-5">
      <h2 class="mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold">
        Upload / download progress
      </h2>
      <p class="mb-3 text-sm text-text-dim">
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
          >onRequestProgress</code
        >
        receives
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
          >{ phase, loaded, total, ratio }</code
        >
        for both phases. The client auto-switches to
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">XMLHttpRequest</code>
        only when this option is set.
      </p>
      <button :class="btnPrimary" :disabled="progressRunning" @click="runProgress">
        {{ progressRunning ? 'Running…' : 'POST 2 MB and watch progress' }}
      </button>

      <div class="mt-4">
        <div class="mb-1 text-xs text-text-dim">upload · {{ fmtBytes(uploadLoaded) }}</div>
        <div class="h-2.5 overflow-hidden rounded-full border border-border bg-code-bg">
          <div
            class="h-full bg-accent transition-[width] duration-150 ease-linear"
            :style="{ width: (uploadRatio * 100).toFixed(1) + '%' }"
          />
        </div>
      </div>
      <div class="mt-3">
        <div class="mb-1 text-xs text-text-dim">download · {{ fmtBytes(downloadLoaded) }}</div>
        <div class="h-2.5 overflow-hidden rounded-full border border-border bg-code-bg">
          <div
            class="h-full bg-success transition-[width] duration-150 ease-linear"
            :style="{ width: (downloadRatio * 100).toFixed(1) + '%' }"
          />
        </div>
      </div>
    </div>

    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="rounded-xl border border-border bg-surface p-5">
        <h2 class="mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold">
          Last post fetched
        </h2>
        <pre
          class="overflow-x-auto rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text"
          >{{ post ?? '—' }}</pre
        >
      </div>
      <div class="rounded-xl border border-border bg-surface p-5">
        <h2 class="mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold">Log</h2>
        <div
          class="max-h-52 overflow-y-auto rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text-dim"
        >
          <div
            v-if="log.length === 0"
            class="border-b border-dashed border-border/50 py-0.5 last:border-b-0"
          >
            No activity yet — click an action.
          </div>
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
    </div>
  </section>
</template>
