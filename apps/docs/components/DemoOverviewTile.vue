<script setup lang="ts">
/**
 * One measured metric tile — the smallest useful AGhostSkeleton loader.
 * Click the tile to reload. Mirrors the first "Recipe" block in the docs.
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
let timer: ReturnType<typeof setTimeout> | undefined;

// Viewport-triggered: the skeleton stays until the demo enters the viewport,
// then holds for 3 seconds before revealing the real metric.
function load() {
  if (timer) clearTimeout(timer);
  metric.value = null;
  timer = setTimeout(() => {
    metric.value = REAL;
  }, 900);
}

// Click bypasses the skeleton flash entirely — the viewer already saw it.
function reload() {
  if (timer) clearTimeout(timer);
  // Toggle between skeleton (null) and content (REAL) — lets the viewer
  // flip states without waiting, whichever side they currently see.
  metric.value = metric.value ? null : REAL;
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

const metric = ref(null);
const SAMPLE = { label: 'Visitors', value: '12,480', delta: '+14.3%', up: true };

// fetch into metric later…
\u003c/script>

<template>
  <AGhostSkeleton id="metric-tile" :data="metric" :sample="SAMPLE">
    <template #default="{ data }">
      <article class="tile">
        <p class="label">{{ data.label }}</p>
        <p class="value">{{ data.value }}</p>
        <p class="delta" :class="data.up ? 'up' : 'down'">{{ data.delta }}</p>
      </article>
    </template>
  </AGhostSkeleton>
</template>`;
</script>

<template>
  <DemoTabs :code="code">
    <div
      ref="target"
      class="odt"
      role="button"
      tabindex="0"
      aria-label="Reload demo"
      @click="reload"
      @keydown.enter="reload"
      @keydown.space.prevent="reload"
    >
      <AGhostSkeleton id="demo-metric-tile" :data="metric" :sample="SAMPLE">
        <template #default="{ data }">
          <article class="odt__tile">
            <p class="odt__label">{{ (data as Metric).label }}</p>
            <p class="odt__value">{{ (data as Metric).value }}</p>
            <p class="odt__delta" :class="(data as Metric).up ? 'is-up' : 'is-down'">
              {{ (data as Metric).delta }}
            </p>
          </article>
        </template>
      </AGhostSkeleton>
    </div>
  </DemoTabs>
</template>

<style scoped>
.odt {
  cursor: pointer;
  user-select: none;
  outline: 0;
  max-width: 14rem;
}
.odt:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
  border-radius: 0.5rem;
}
.odt__tile {
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.odt__label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin: 0;
}
.odt__value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  margin: 0;
}
.odt__delta {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0;
}
.odt__delta.is-up {
  color: #16a34a;
}
.odt__delta.is-down {
  color: #dc2626;
}
:deep(html.dark) .odt__delta.is-up {
  color: #4ade80;
}
:deep(html.dark) .odt__delta.is-down {
  color: #f87171;
}
.odt :deep([ask-rect='text']),
.odt :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
