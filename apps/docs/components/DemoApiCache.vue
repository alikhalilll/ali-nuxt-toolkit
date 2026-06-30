<script setup lang="ts">
import { isApiError } from '@alikhalilll/nuxt-api-provider/types';

interface Post {
  id: number;
  title: string;
  body: string;
}

const { $apiProvider } = useNuxtApp();
const config = $apiProvider.cache.getConfig();
const STALE_MS = config.staleTime;
const GC_MS = config.gcTime;

// -----------------------------------------------------------------------------
// Network counter — registers a response + error interceptor. The cache layer
// skips `executeOnce` entirely on a hit, so these interceptors only fire on
// actual network round-trips (including the background SWR refetch). Far more
// reliable than wrapping `globalThis.fetch`, which the api-provider plugin
// captures at boot — by the time the demo mounts it's too late.
// -----------------------------------------------------------------------------
const networkCalls = ref(0);
let _offResp: (() => void) | null = null;
let _offErr: (() => void) | null = null;
onMounted(() => {
  _offResp = $apiProvider.useResponse(() => {
    networkCalls.value++;
  });
  _offErr = $apiProvider.useError(() => {
    networkCalls.value++;
  });
});
onBeforeUnmount(() => {
  _offResp?.();
  _offErr?.();
});

// -----------------------------------------------------------------------------
// Live timeline — re-reads the tracked entry every 250ms so the staleness bar
// animates smoothly. `tick.value` is just a Date.now() snapshot we read in
// computed getters; the cache itself is the source of truth.
// -----------------------------------------------------------------------------
const tick = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => (tick.value = Date.now()), 250);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const trackedEntry = computed(() => {
  // The demo only ever caches GETs to /posts/1, so we scan rather than rebuild
  // the cache key (private to the lib). First entry wins.
  void tick.value; // dep
  for (const [key, entry] of $apiProvider.cache.entriesIter()) {
    if (key.startsWith('GET') && entry) return entry;
  }
  return null;
});

const entryCount = computed(() => {
  void tick.value;
  let n = 0;
  for (const _ of $apiProvider.cache.entriesIter()) n++;
  return n;
});

const entryAgeMs = computed(() => {
  const e = trackedEntry.value;
  if (!e) return 0;
  return Math.max(0, tick.value - e.storedAt);
});

type EntryState = 'empty' | 'fresh' | 'stale' | 'expired';
const entryState = computed<EntryState>(() => {
  const e = trackedEntry.value;
  if (!e) return 'empty';
  if (tick.value >= e.expiresAt) return 'expired';
  if (tick.value < e.staleAt) return 'fresh';
  return 'stale';
});

const stateLabel = computed(() => {
  switch (entryState.value) {
    case 'fresh':
      return 'Fresh';
    case 'stale':
      return 'Stale';
    case 'expired':
      return 'Expired';
    default:
      return 'Empty';
  }
});

const stateDescription = computed(() => {
  switch (entryState.value) {
    case 'fresh':
      return 'Repeats return cached data with no network call.';
    case 'stale':
      return 'Repeats return cached data and refresh in the background (SWR).';
    case 'expired':
      return 'Entry is past its GC horizon — next read will be a cold miss.';
    default:
      return 'No entry cached yet. Click First fetch to populate.';
  }
});

const stateTone = computed(() => {
  switch (entryState.value) {
    case 'fresh':
      return { dot: 'bg-success', text: 'text-success' };
    case 'stale':
      return { dot: 'bg-warning', text: 'text-warning' };
    case 'expired':
      return { dot: 'bg-danger', text: 'text-danger' };
    default:
      return { dot: 'bg-text-dim', text: 'text-text-dim' };
  }
});

// Fresh window: 0 → staleTime. Fills as the entry ages.
const freshProgress = computed(() => {
  if (!trackedEntry.value) return 0;
  return Math.min(100, (entryAgeMs.value / STALE_MS) * 100);
});

// Stale (SWR) window: starts AT staleTime, ends AT gcTime. Stays at 0% while
// the entry is fresh, then fills across the remaining (gcTime - staleTime)
// budget. This is the window where reads trigger background refetches.
const STALE_WINDOW = Math.max(0, GC_MS - STALE_MS);
const staleProgress = computed(() => {
  if (!trackedEntry.value || STALE_WINDOW === 0) return 0;
  const inStalePhase = Math.max(0, entryAgeMs.value - STALE_MS);
  return Math.min(100, (inStalePhase / STALE_WINDOW) * 100);
});

const fmtTime = (ms: number) => {
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
};

const freshLabel = computed(() =>
  trackedEntry.value
    ? `${fmtTime(Math.min(entryAgeMs.value, STALE_MS))} / ${fmtTime(STALE_MS)}`
    : `0 / ${fmtTime(STALE_MS)}`
);

const staleLabel = computed(() => {
  if (!trackedEntry.value || STALE_WINDOW === 0) {
    return `0 / ${fmtTime(STALE_WINDOW)}`;
  }
  const elapsed = Math.min(Math.max(0, entryAgeMs.value - STALE_MS), STALE_WINDOW);
  return `${fmtTime(elapsed)} / ${fmtTime(STALE_WINDOW)}`;
});

// -----------------------------------------------------------------------------
// Action runners
// -----------------------------------------------------------------------------
type LastResult = {
  kind: 'idle' | 'hit' | 'network' | 'dedupe' | 'invalidate' | 'clear' | 'error';
  label: string;
  detail: string;
};
const lastResult = ref<LastResult>({
  kind: 'idle',
  label: 'Ready',
  detail: 'Click any button below to see the cache in action.',
});

const busy = ref<string | null>(null);

const runGet = async (
  id: string,
  label: string,
  endpoint = '/posts/1',

  opts: any = null
) => {
  busy.value = id;
  const before = networkCalls.value;
  try {
    await $apiProvider<Post>(endpoint, opts);
    const delta = networkCalls.value - before;
    if (delta === 0) {
      lastResult.value = {
        kind: 'hit',
        label: 'Cache hit',
        detail: `${label} · 0 network calls · returned instantly from memory`,
      };
    } else {
      lastResult.value = {
        kind: 'network',
        label: 'Network call',
        detail: `${label} · ${delta} network call · entry stored at ${formatStored()}`,
      };
    }
  } catch (e) {
    lastResult.value = {
      kind: 'error',
      label: 'Request failed',
      detail: isApiError(e)
        ? `${label} · ApiError ${e.status} ${e.message}`
        : `${label} · ${(e as Error).message}`,
    };
  } finally {
    busy.value = null;
  }
};

const formatStored = () => {
  if (!trackedEntry.value) return '—';
  return new Date(trackedEntry.value.storedAt).toLocaleTimeString();
};

const firstFetch = () => runGet('first', 'GET /posts/1');
const cacheHit = () => runGet('hit', 'GET /posts/1');
const forceRefetch = () =>
  runGet('refetch', 'GET /posts/1 · cache.refetch=true', '/posts/1', {
    cache: { refetch: true },
  });
const bypass = () => runGet('bypass', 'GET /posts/1 · cache=false', '/posts/1', { cache: false });

const dedupeBurst = async () => {
  busy.value = 'burst';
  const before = networkCalls.value;
  try {
    await Promise.all(Array.from({ length: 5 }, () => $apiProvider<Post>('/posts/2')));
    const delta = networkCalls.value - before;
    lastResult.value = {
      kind: 'dedupe',
      label: delta <= 1 ? 'Deduped' : 'Partial dedupe',
      detail: `5 × GET /posts/2 fired concurrently → ${delta} network call(s)`,
    };
  } finally {
    busy.value = null;
  }
};

const invalidate = () => {
  const dropped = $apiProvider.cache.invalidate((key) => key.startsWith('GET'));
  lastResult.value = {
    kind: 'invalidate',
    label: 'Invalidated',
    detail: `cache.invalidate(GET) dropped ${dropped} entr${dropped === 1 ? 'y' : 'ies'}`,
  };
};

const clearAll = () => {
  const size = entryCount.value;
  $apiProvider.cache.clear();
  lastResult.value = {
    kind: 'clear',
    label: 'Cleared',
    detail: `cache.clear() removed ${size} entr${size === 1 ? 'y' : 'ies'}`,
  };
};

// -----------------------------------------------------------------------------
// Styling helpers
// -----------------------------------------------------------------------------
const resultTone = computed(() => {
  switch (lastResult.value.kind) {
    case 'hit':
      return 'border-success/40 bg-success/10 text-success';
    case 'network':
      return 'border-accent/40 bg-accent/10 text-accent';
    case 'dedupe':
      return 'border-info/40 bg-info/10 text-info';
    case 'invalidate':
    case 'clear':
      return 'border-warning/40 bg-warning/10 text-warning';
    case 'error':
      return 'border-danger/40 bg-danger/10 text-danger';
    default:
      return 'border-border bg-code-bg text-text-dim';
  }
});

const btnPrimary =
  'group inline-flex items-center gap-2 cursor-pointer rounded-lg border border-accent bg-accent px-4 py-2 text-xs font-semibold text-bg transition-[filter,opacity,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'group inline-flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-code-bg px-4 py-2 text-xs font-medium text-text transition-[colors,transform] hover:bg-border active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'group inline-flex items-center gap-2 cursor-pointer rounded-lg border border-danger/60 bg-code-bg px-4 py-2 text-xs font-medium text-danger transition-[colors,transform] hover:bg-border active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    style="margin: 2rem 0rem"
  >
    <!-- ────────────────────────────── Header ────────────────────────────── -->
    <div class="border-b border-border bg-code-bg p-4 rounded-lg">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h4 class="text-[11px] font-bold uppercase tracking-widest text-text-dim">
          Live · request cache
        </h4>
        <div class="flex flex-wrap items-center gap-3 text-[11px] text-text-dim">
          <span class="rounded-full border border-border bg-surface px-2.5 py-1">
            staleTime <strong class="text-text">{{ fmtTime(STALE_MS) }}</strong>
          </span>
          <span class="rounded-full border border-border bg-surface px-2.5 py-1">
            gcTime <strong class="text-text">{{ fmtTime(GC_MS) }}</strong>
          </span>
          <span
            class="rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-success"
          >
            SWR <strong>on</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- ──────────────────────────── Status panel ───────────────────────── -->
    <div class="border-b border-border p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span
            class="rounded-md border border-border bg-code-bg px-2.5 py-1 text-xs font-mono text-text-dim"
          >
            GET /posts/1
          </span>
          <span
            class="inline-flex items-center gap-2 rounded-full border border-border bg-code-bg px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
            :class="stateTone.text"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="stateTone.dot" />
            {{ stateLabel }}
          </span>
        </div>
        <div class="text-[11px] text-text-dim">
          stored
          <strong class="ml-1 rounded bg-code-bg px-1.5 py-0.5 font-mono text-text">{{
            formatStored()
          }}</strong>
        </div>
      </div>

      <p class="mb-5 text-sm leading-relaxed text-text-dim">{{ stateDescription }}</p>

      <!-- Timeline: fresh window -->
      <div class="space-y-2">
        <div class="flex items-baseline justify-between text-[10px] text-text-dim">
          <span class="font-semibold uppercase tracking-wider">Fresh window</span>
          <span class="font-mono">{{ freshLabel }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full border border-border bg-code-bg">
          <div
            class="h-full rounded-full bg-success transition-[width] duration-150 ease-linear"
            :style="{ width: freshProgress + '%' }"
          />
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <div class="flex items-baseline justify-between text-[10px] text-text-dim">
          <span class="font-semibold uppercase tracking-wider">
            Stale window
            <span class="ml-1 font-normal normal-case tracking-normal text-text-dim/80">
              (SWR — cached return + background refetch)
            </span>
          </span>
          <span class="font-mono">{{ staleLabel }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full border border-border bg-code-bg">
          <div
            class="h-full rounded-full bg-warning transition-[width] duration-150 ease-linear"
            :style="{ width: staleProgress + '%' }"
          />
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-lg border border-border bg-code-bg px-4 py-3">
          <div class="text-[10px] font-bold uppercase tracking-widest text-text-dim">
            Network calls
          </div>
          <div class="mt-1 font-mono text-lg font-semibold text-text">
            {{ networkCalls }}
          </div>
        </div>
        <div class="rounded-lg border border-border bg-code-bg px-4 py-3">
          <div class="text-[10px] font-bold uppercase tracking-widest text-text-dim">
            Cache entries
          </div>
          <div class="mt-1 font-mono text-lg font-semibold text-text">
            {{ entryCount }}
          </div>
        </div>
      </div>
    </div>

    <!-- ───────────────────────────── Controls ──────────────────────────── -->
    <div class="flex flex-col gap-4 p-4">
      <div>
        <div class="mb-3 flex items-center gap-3">
          <span class="text-[10px] font-bold uppercase tracking-widest text-text-dim">Try it</span>
          <span class="h-px flex-1 bg-border" />
        </div>
        <div class="flex flex-wrap gap-2.5">
          <button
            :disabled="busy !== null"
            :class="btnPrimary"
            title="Cold fetch — hits the network and stores the response"
            @click="firstFetch"
          >
            <span
              v-if="busy === 'first'"
              class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
            />
            First fetch
          </button>
          <button
            :disabled="busy !== null"
            :class="btnSecondary"
            title="Repeat — within staleTime returns cached data instantly with no network call"
            @click="cacheHit"
          >
            <span v-if="busy === 'hit'" class="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Repeat (hit)
          </button>
          <button
            :disabled="busy !== null"
            :class="btnSecondary"
            title="Force the network even if a fresh entry exists; replaces the cached entry"
            @click="forceRefetch"
          >
            <span
              v-if="busy === 'refetch'"
              class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
            />
            Force refetch
          </button>
          <button
            :disabled="busy !== null"
            :class="btnSecondary"
            title="Bypass the cache entirely for this single call"
            @click="bypass"
          >
            <span
              v-if="busy === 'bypass'"
              class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
            />
            Bypass cache
          </button>
          <button
            :disabled="busy !== null"
            :class="btnSecondary"
            title="Fire 5 identical GETs at once — dedupe collapses them into one network call"
            @click="dedupeBurst"
          >
            <span
              v-if="busy === 'burst'"
              class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
            />
            Burst ×5 (dedupe)
          </button>
        </div>
      </div>

      <div>
        <div class="mb-3 flex items-center gap-3">
          <span class="text-[10px] font-bold uppercase tracking-widest text-text-dim"
            >Cache controls</span
          >
          <span class="h-px flex-1 bg-border" />
        </div>
        <div class="flex flex-wrap gap-2.5">
          <button
            :disabled="busy !== null"
            :class="btnSecondary"
            title="Drop every entry whose key starts with GET"
            @click="invalidate"
          >
            Invalidate GET
          </button>
          <button
            :disabled="busy !== null"
            :class="btnDanger"
            title="Wipe every stored entry"
            @click="clearAll"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>

    <!-- ─────────────────────────── Latest result ───────────────────────── -->
    <div class="border-t border-border bg-code-bg/30 p-4">
      <div class="mb-3 text-[10px] font-bold uppercase tracking-widest text-text-dim">
        Latest event
      </div>
      <div
        class="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs transition-colors"
        :class="resultTone"
      >
        <span
          class="rounded-full border border-current/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
        >
          {{ lastResult.label }}
        </span>
        <span class="flex-1 font-mono text-[11px] leading-relaxed text-text">
          {{ lastResult.detail }}
        </span>
      </div>
    </div>
  </div>
</template>
