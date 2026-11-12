<script setup lang="ts">
/**
 * Four-state demo — loading / error / empty / content — on the overview
 * tile shape. Buttons at the top let you flip between states.
 */
import { onUnmounted, ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

interface Metric {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

const SAMPLE: Metric = { label: 'Visitors', value: '12,480', delta: '+14.3%', up: true };
const REAL: Metric = { label: 'Visitors', value: '13,042', delta: '+19.3%', up: true };

const target = ref<HTMLElement | null>(null);
const metric = ref<Metric | null>(null);
const fetchError = ref<Error | null>(null);
const isEmpty = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function reset() {
  if (timer) clearTimeout(timer);
  metric.value = null;
  fetchError.value = null;
  isEmpty.value = false;
}

function showContent() {
  reset();
  timer = setTimeout(() => {
    metric.value = REAL;
  }, 900);
}

function showEmpty() {
  reset();
  isEmpty.value = true;
}

function showError() {
  reset();
  fetchError.value = new Error("Couldn't load");
}

function showLoading() {
  reset();
  // Keeps metric.value = null — the loading state stays until reload.
}

// Initial content reveal waits for the demo to enter the viewport, then
// holds the skeleton for three seconds. The state buttons below bypass the
// viewport trigger — they're explicit user actions.
const { stop } = useIntersectionObserver(target, ([entry]) => {
  if (entry?.isIntersecting) {
    stop();
    showContent();
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

const code = `<script setup lang="ts">
import { ref } from 'vue';

const metric = ref(null);
const fetchError = ref(null);
const isEmpty = ref(false);
const SAMPLE = { label: 'Visitors', value: '12,480', delta: '+14.3%', up: true };
\u003c/script>

<template>
  <!-- The same skeleton owns all four states. Resolution order:
       loading → error → empty → content. -->
  <ASmartSkeleton
    id="four-state"
    :data="metric"
    :sample="SAMPLE"
    :error="fetchError"
    :empty="isEmpty"
  >
    <template #default="{ data }">
      <MetricTile :metric="data" />
    </template>

    <template #empty>
      <EmptyCard title="No data in this window" />
    </template>

    <template #error="{ error }">
      <ErrorCard :error="error" @retry="reload" />
    </template>
  </ASmartSkeleton>
</template>`;
</script>

<template>
  <DemoTabs :code="code">
    <div ref="target" class="ods">
      <div class="ods__controls" role="group" aria-label="Pick a state">
        <button type="button" @click="showLoading">Loading</button>
        <button type="button" @click="showContent">Content</button>
        <button type="button" @click="showEmpty">Empty</button>
        <button type="button" @click="showError">Error</button>
      </div>

      <ASmartSkeleton
        id="demo-four-state-tile"
        :data="metric"
        :sample="SAMPLE"
        :error="fetchError"
        :empty="isEmpty"
      >
        <template #default="{ data }">
          <article class="ods__tile">
            <p class="ods__label">{{ (data as Metric).label }}</p>
            <p class="ods__value">{{ (data as Metric).value }}</p>
            <p class="ods__delta" :class="(data as Metric).up ? 'is-up' : 'is-down'">
              {{ (data as Metric).delta }}
            </p>
          </article>
        </template>

        <template #empty>
          <article class="ods__state">
            <p class="ods__state-title">No data in this window</p>
            <p class="ods__state-hint">Pick another range.</p>
          </article>
        </template>

        <template #error="{ error }">
          <article class="ods__state ods__state--error">
            <p class="ods__state-title">Couldn't load the metric</p>
            <p class="ods__state-hint">{{ (error as Error)?.message ?? 'Try again.' }}</p>
            <button type="button" class="ods__retry" @click="showContent">Retry</button>
          </article>
        </template>
      </ASmartSkeleton>
    </div>
  </DemoTabs>
</template>

<style scoped>
.ods {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 18rem;
}
.ods__controls {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.ods__controls button {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
}
.ods__controls button:hover {
  background: color-mix(in srgb, var(--color-text-dim) 10%, var(--color-bg));
}
.ods__tile,
.ods__state {
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.ods__state {
  align-items: flex-start;
}
.ods__state--error {
  border-color: #dc2626;
}
.ods__label,
.ods__state-hint {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin: 0;
}
.ods__value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  margin: 0;
}
.ods__delta {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0;
}
.ods__delta.is-up {
  color: #16a34a;
}
.ods__delta.is-down {
  color: #dc2626;
}
.ods__state-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.ods__retry {
  margin-top: 0.25rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  border: 1px solid #dc2626;
  border-radius: 0.375rem;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
}
.ods :deep([ask-rect='text']),
.ods :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
