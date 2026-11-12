<script setup lang="ts">
/**
 * A row of four metric tiles wrapped in one skeleton with reveal="together".
 * All four cards fade in as a single unit instead of staggering.
 * Click anywhere on the row to reload.
 */
import { onUnmounted, ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

interface Metric {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

const SAMPLE: Metric[] = [
  { label: 'Visitors', value: '12,480', delta: '+14.3%', up: true },
  { label: 'Sessions', value: '18,206', delta: '+10.1%', up: true },
  { label: 'Page views', value: '41,372', delta: '-6.0%', up: false },
  { label: 'Engagement', value: '64.2%', delta: '+2.4 pts', up: true },
];

const REAL: Metric[] = [
  { label: 'Visitors', value: '13,042', delta: '+19.3%', up: true },
  { label: 'Sessions', value: '19,018', delta: '+15.0%', up: true },
  { label: 'Page views', value: '40,814', delta: '-3.1%', up: false },
  { label: 'Engagement', value: '65.7%', delta: '+3.9 pts', up: true },
];

const target = ref<HTMLElement | null>(null);
const metrics = ref<Metric[] | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

function load() {
  if (timer) clearTimeout(timer);
  metrics.value = null;
  timer = setTimeout(() => {
    metrics.value = REAL;
  }, 900);
}

// Click bypasses the skeleton flash entirely — the viewer already saw it.
function reload() {
  if (timer) clearTimeout(timer);
  // Toggle between skeleton (null) and content (REAL) — lets the viewer
  // flip states without waiting, whichever side they currently see.
  metrics.value = metrics.value ? null : REAL;
}

const { stop } = useIntersectionObserver(target, ([entry]) => {
  if (entry?.isIntersecting) {
    stop();
    load();
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

const code = `<script setup lang="ts">
import { ref } from 'vue';

const metrics = ref(null);
const SAMPLE = [
  { label: 'Visitors',    value: '12,480', delta: '+14.3%', up: true  },
  { label: 'Sessions',    value: '18,206', delta: '+10.1%', up: true  },
  { label: 'Page views',  value: '41,372', delta: '-6.0%',  up: false },
  { label: 'Engagement',  value: '64.2%',  delta: '+2.4 pts', up: true },
];
\u003c/script>

<template>
  <!-- One skeleton wraps the whole row; reveal="together" collapses the
       four crossfades into a single pane fade. -->
  <ASmartSkeleton
    id="metrics-row"
    :data="metrics"
    :sample="SAMPLE"
    reveal="together"
  >
    <template #default="{ data }">
      <div class="grid grid-cols-4 gap-3">
        <article v-for="m in data" :key="m.label" class="tile">
          <p>{{ m.label }}</p>
          <p>{{ m.value }}</p>
          <p :class="m.up ? 'up' : 'down'">{{ m.delta }}</p>
        </article>
      </div>
    </template>
  </ASmartSkeleton>
</template>`;
</script>

<template>
  <DemoTabs :code="code">
    <div
      ref="target"
      class="odr"
      role="button"
      tabindex="0"
      aria-label="Reload demo"
      @click="reload"
      @keydown.enter="reload"
      @keydown.space.prevent="reload"
    >
      <ASmartSkeleton id="demo-metrics-row" :data="metrics" :sample="SAMPLE" reveal="together">
        <template #default="{ data }">
          <div class="odr__grid">
            <article v-for="m in data as Metric[]" :key="m.label" class="odr__tile">
              <p class="odr__label">{{ m.label }}</p>
              <p class="odr__value">{{ m.value }}</p>
              <p class="odr__delta" :class="m.up ? 'is-up' : 'is-down'">{{ m.delta }}</p>
            </article>
          </div>
        </template>
      </ASmartSkeleton>
    </div>
  </DemoTabs>
</template>

<style scoped>
.odr {
  cursor: pointer;
  user-select: none;
  outline: 0;
}
.odr:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
  border-radius: 0.5rem;
}
.odr__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (max-width: 640px) {
  .odr__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.odr__tile {
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.odr__label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin: 0;
}
.odr__value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  margin: 0;
}
.odr__delta {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0;
}
.odr__delta.is-up {
  color: #16a34a;
}
.odr__delta.is-down {
  color: #dc2626;
}
:deep(html.dark) .odr__delta.is-up {
  color: #4ade80;
}
:deep(html.dark) .odr__delta.is-down {
  color: #f87171;
}
.odr :deep([ask-rect='text']),
.odr :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
