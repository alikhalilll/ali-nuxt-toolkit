<script setup lang="ts">
/**
 * Staggered Grid & Synchronized Shimmer Demo for ASmartSkeleton.
 *
 * Demonstrates document-clock shimmer across multi-component layouts:
 * When different components or cards complete their asynchronous data requests
 * at different times, they all share a global document clock phase.
 * Newly mounted skeletons or late-arriving responses join the sweep without
 * flickering or resetting animation timelines.
 */
import { onMounted, onUnmounted, ref, type Ref } from 'vue';

interface Metric {
  id: string;
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  unit: string;
}

const METRICS: Metric[] = [
  {
    id: 'workspaces',
    label: 'Active Workspaces',
    value: '1,482',
    delta: '+8.4%',
    isPositive: true,
    unit: 'teams',
  },
  {
    id: 'latency',
    label: 'Average Latency',
    value: '28.4ms',
    delta: '-12.0%',
    isPositive: true,
    unit: 'p95',
  },
  {
    id: 'deploys',
    label: 'Cloud Deployments',
    value: '14,290',
    delta: '+22.1%',
    isPositive: true,
    unit: 'this month',
  },
  {
    id: 'success',
    label: 'Success Rate',
    value: '99.96%',
    delta: '+0.2%',
    isPositive: true,
    unit: 'uptime',
  },
];

interface MetricTile {
  sample: Metric;
  delay: number;
  data: Ref<Metric | null>;
}

const tiles: MetricTile[] = METRICS.map((item, idx) => ({
  sample: item,
  delay: 400 + idx * 300,
  data: ref<Metric | null>(null),
}));

const loading = ref(false);
const timers: Array<ReturnType<typeof setTimeout>> = [];

function loadStaggered() {
  for (const t of timers) clearTimeout(t);
  timers.length = 0;
  loading.value = true;

  // Reset all tiles to null (triggers skeletons simultaneously)
  for (const tile of tiles) {
    tile.data.value = null;
  }

  let completed = 0;
  for (const tile of tiles) {
    timers.push(
      setTimeout(() => {
        tile.data.value = tile.sample;
        completed++;
        if (completed === tiles.length) {
          loading.value = false;
        }
      }, tile.delay)
    );
  }
}

onMounted(loadStaggered);
onUnmounted(() => {
  for (const t of timers) clearTimeout(t);
});

const code = `<script setup lang="ts">
import { ref } from 'vue';
import { ASmartSkeleton } from '@alikhalilll/a-smart-skeleton';

// Each card resolves independently at its own delay (400ms, 700ms, 1000ms, 1300ms)
const tiles = [
  { id: 'workspaces', data: tile1, sample: SAMPLE_1 },
  { id: 'latency',    data: tile2, sample: SAMPLE_2 },
  { id: 'deploys',    data: tile3, sample: SAMPLE_3 },
  { id: 'success',    data: tile4, sample: SAMPLE_4 },
];
\u003c/script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <!-- All skeletons share the synchronized document clock shimmer sweep -->
    <div v-for="t in tiles" :key="t.id" class="tile-card">
      <ASmartSkeleton :data="t.data" :sample="t.sample" :id="t.id">
        <template #default="{ data }">
          <span class="label">{{ data?.label }}</span>
          <span class="value">{{ data?.value }}</span>
          <span class="delta">{{ data?.delta }}</span>
        </template>
      </ASmartSkeleton>
    </div>
  </div>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- Header with explanation and trigger -->
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 text-xs"
        >
          <div>
            <h4 class="font-bold text-text text-sm">Synchronized Staggered Shimmer</h4>
            <p class="text-xs text-text-dim mt-0.5">
              Tiles resolve at 400ms, 700ms, 1000ms, and 1300ms while sharing a single document
              clock.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-sm transition-all hover:bg-surface-2 active:scale-95 disabled:opacity-50"
            :disabled="loading"
            @click="loadStaggered"
          >
            <span
              class="size-2 rounded-full"
              :class="loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'"
            />
            <span>{{ loading ? 'Resolving...' : 'Simulate Staggered Load' }}</span>
          </button>
        </div>

        <!-- 4-Column Grid -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="tile in tiles"
            :key="tile.sample.id"
            class="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <ASmartSkeleton
              :id="`tile-${tile.sample.id}`"
              :data="tile.data.value"
              :sample="tile.sample"
              :label="`Loading ${tile.sample.label}`"
            >
              <template #default="{ data }">
                <article class="flex flex-col gap-1.5">
                  <span class="text-xs font-medium text-text-dim truncate">
                    {{ data?.label }}
                  </span>

                  <div class="flex items-baseline justify-between gap-2 mt-1">
                    <span class="text-xl font-bold text-text tabular-nums tracking-tight">
                      {{ data?.value }}
                    </span>
                    <span
                      class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      :class="
                        data?.isPositive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      "
                    >
                      {{ data?.delta }}
                    </span>
                  </div>

                  <span class="text-[10px] text-text-dim/80">
                    {{ data?.unit }}
                  </span>
                </article>
              </template>
            </ASmartSkeleton>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
