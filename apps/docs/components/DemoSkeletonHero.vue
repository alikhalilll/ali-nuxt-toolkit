<script setup lang="ts">
/**
 * Flagship Interactive Hero Demo for ASmartSkeleton.
 *
 * Demonstrates:
 *   - Automatic unseen content measurement (zero layout shift)
 *   - Reveal animation modes: `together`, `sequence`, `instant`, `sweep`
 *   - Synchronized document-clock shimmer
 *   - DemoTabs allowing code inspection with dual-theme Shiki syntax highlighting
 */
import { onMounted, onUnmounted, ref } from 'vue';
import type { RevealMode } from '@alikhalilll/a-smart-skeleton';

interface Deployment {
  name: string;
  repo: string;
  branch: string;
  commit: string;
  status: 'Ready' | 'Building' | 'Failed';
  url: string;
  uptime: string;
  latency: string;
  requests: string;
  updatedAt: string;
}

const SAMPLE: Deployment = {
  name: 'cloud-api-gateway',
  repo: 'acme-corp/api-gateway',
  branch: 'main',
  commit: '3f8a91b',
  status: 'Ready',
  url: 'https://gateway.acme-cloud.io',
  uptime: '99.98%',
  latency: '24ms',
  requests: '1.42M',
  updatedAt: '2 minutes ago',
};

const reveal = ref<RevealMode>('together');
const loading = ref(false);
const deployment = ref<Deployment | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;

function load() {
  if (timer) clearTimeout(timer);
  loading.value = true;
  deployment.value = null;

  timer = setTimeout(() => {
    deployment.value = { ...SAMPLE };
    loading.value = false;
  }, 750);
}

onMounted(load);
onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

const code = `<script setup lang="ts">
import { ref } from 'vue';
import { ASmartSkeleton } from '@alikhalilll/a-smart-skeleton';

const deployment = ref(null);

// Fetch your API data
async function fetchDeployment() {
  deployment.value = await api.getDeployment();
}
\u003c/script>

<template>
  <ASmartSkeleton
    :data="deployment"
    :sample="SAMPLE_DEPLOYMENT"
    reveal="together"
    id="deployment-card"
    label="Loading deployment overview"
  >
    <template #default="{ data }">
      <article class="flex flex-col gap-4 p-5 rounded-xl border bg-surface">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold">⚡</div>
            <div>
              <h3 class="font-bold text-base">{{ data?.name }}</h3>
              <p class="text-xs text-muted">{{ data?.repo }} · {{ data?.branch }}</p>
            </div>
          </div>
          <span class="badge text-emerald-500">{{ data?.status }}</span>
        </header>

        <div class="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface-2 text-center text-xs">
          <div><p class="text-muted">Uptime</p><strong>{{ data?.uptime }}</strong></div>
          <div><p class="text-muted">p95 Latency</p><strong>{{ data?.latency }}</strong></div>
          <div><p class="text-muted">Requests</p><strong>{{ data?.requests }}</strong></div>
        </div>
      </article>
    </template>
  </ASmartSkeleton>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- Toolbar Controls -->
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 text-xs"
        >
          <!-- Reveal Mode Selector -->
          <div class="flex items-center gap-2">
            <span class="text-text-dim font-medium">Reveal Animation:</span>
            <div class="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
              <button
                v-for="r in ['together', 'sequence', 'smart', 'sweep'] as const"
                :key="r"
                type="button"
                class="cursor-pointer rounded-md px-2.5 py-1 text-xs capitalize transition-colors"
                :class="
                  reveal === r
                    ? 'bg-surface font-semibold text-text shadow-sm'
                    : 'text-text-dim hover:text-text'
                "
                @click="
                  reveal = r;
                  load();
                "
              >
                {{ r }}
              </button>
            </div>
          </div>

          <!-- Reload button -->
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-sm transition-all hover:bg-surface-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="load"
          >
            <span
              class="inline-block size-2 rounded-full"
              :class="loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'"
            />
            <span>{{ loading ? 'Measuring...' : 'Replay Animation' }}</span>
          </button>
        </div>

        <!-- Live Card Stage -->
        <div class="mx-auto max-w-xl">
          <div class="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
            <ASmartSkeleton
              id="hero-deployment-card"
              :data="deployment"
              :sample="SAMPLE"
              :reveal="reveal"
              label="Loading deployment overview"
            >
              <template #default="{ data }">
                <article class="flex flex-col gap-4">
                  <!-- Header -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-base"
                      >
                        ⚡
                      </div>
                      <div>
                        <h3 class="text-base font-bold text-text leading-tight">
                          {{ data?.name }}
                        </h3>
                        <p class="text-xs text-text-dim mt-0.5">
                          {{ data?.repo }} ·
                          <span class="font-mono text-[11px]"
                            >{{ data?.branch }}@{{ data?.commit }}</span
                          >
                        </p>
                      </div>
                    </div>

                    <span
                      class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500"
                    >
                      <span class="size-1.5 rounded-full bg-emerald-500" />
                      {{ data?.status }}
                    </span>
                  </div>

                  <!-- Metrics row -->
                  <div
                    class="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-surface-2/40 p-3 text-center"
                  >
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-text-dim">Uptime</p>
                      <p class="mt-0.5 text-sm font-bold text-text tabular-nums">
                        {{ data?.uptime }}
                      </p>
                    </div>
                    <div class="border-x border-border/40">
                      <p class="text-[10px] uppercase tracking-wider text-text-dim">p95 Latency</p>
                      <p class="mt-0.5 text-sm font-bold text-text tabular-nums">
                        {{ data?.latency }}
                      </p>
                    </div>
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-text-dim">Req / Day</p>
                      <p class="mt-0.5 text-sm font-bold text-text tabular-nums">
                        {{ data?.requests }}
                      </p>
                    </div>
                  </div>

                  <!-- Footer with details & action -->
                  <div class="flex items-center justify-between pt-1 text-xs">
                    <span class="text-text-dim text-[11px]"> Updated {{ data?.updatedAt }} </span>

                    <div class="flex items-center gap-2">
                      <a
                        :href="data?.url"
                        target="_blank"
                        rel="noreferrer"
                        class="rounded-md border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-text hover:bg-surface transition-colors"
                      >
                        Visit Domain ↗
                      </a>
                      <button
                        type="button"
                        class="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-fg hover:opacity-90 transition-opacity"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </article>
              </template>
            </ASmartSkeleton>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
