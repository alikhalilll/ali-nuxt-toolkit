<script setup lang="ts">
/**
 * Distribution list — label / value / percent per row with a share bar
 * underneath. `reveal="together"` keeps the five rows from staggering.
 * Click anywhere to reload.
 */
import { onUnmounted, ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

interface Row {
  label: string;
  value: string;
  share: number;
}

const SAMPLE: Row[] = [
  { label: 'Chrome', value: '6,840', share: 0.55 },
  { label: 'Safari', value: '3,920', share: 0.31 },
  { label: 'Edge', value: '980', share: 0.08 },
  { label: 'Firefox', value: '420', share: 0.03 },
  { label: 'Other', value: '310', share: 0.03 },
];

const REAL: Row[] = [
  { label: 'Chrome', value: '7,114', share: 0.56 },
  { label: 'Safari', value: '3,983', share: 0.31 },
  { label: 'Edge', value: '940', share: 0.07 },
  { label: 'Firefox', value: '451', share: 0.04 },
  { label: 'Other', value: '268', share: 0.02 },
];

const target = ref<HTMLElement | null>(null);
const distribution = ref<Row[] | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

function load() {
  if (timer) clearTimeout(timer);
  distribution.value = null;
  timer = setTimeout(() => {
    distribution.value = REAL;
  }, 900);
}

// Click bypasses the skeleton flash entirely — the viewer already saw it.
function reload() {
  if (timer) clearTimeout(timer);
  // Toggle between skeleton (null) and content (REAL) — lets the viewer
  // flip states without waiting, whichever side they currently see.
  distribution.value = distribution.value ? null : REAL;
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

const distribution = ref(null);
const SAMPLE = [
  { label: 'Chrome',  value: '6,840', share: 0.55 },
  { label: 'Safari',  value: '3,920', share: 0.31 },
  { label: 'Edge',    value: '980',   share: 0.08 },
  { label: 'Firefox', value: '420',   share: 0.03 },
  { label: 'Other',   value: '310',   share: 0.03 },
];
\u003c/script>

<template>
  <ASmartSkeleton
    id="distribution"
    :data="distribution"
    :sample="SAMPLE"
    reveal="together"
  >
    <template #default="{ data }">
      <ul class="rows">
        <li v-for="row in data" :key="row.label">
          <span>{{ row.label }}</span>
          <span>{{ row.value }}</span>
          <span>{{ Math.round(row.share * 100) }}%</span>
          <span class="bar" :style="{ width: row.share * 100 + '%' }" />
        </li>
      </ul>
    </template>
  </ASmartSkeleton>
</template>`;
</script>

<template>
  <DemoTabs :code="code">
    <div
      ref="target"
      class="odd"
      role="button"
      tabindex="0"
      aria-label="Reload demo"
      @click="reload"
      @keydown.enter="reload"
      @keydown.space.prevent="reload"
    >
      <ASmartSkeleton
        id="demo-distribution"
        :data="distribution"
        :sample="SAMPLE"
        reveal="together"
      >
        <template #default="{ data }">
          <section class="odd__card">
            <header class="odd__head">
              <h3>Top browsers</h3>
            </header>
            <ul>
              <li v-for="row in data as Row[]" :key="row.label">
                <span class="odd__label">{{ row.label }}</span>
                <span class="odd__value">{{ row.value }}</span>
                <span class="odd__share">{{ Math.round(row.share * 100) }}%</span>
                <span class="odd__track" aria-hidden="true">
                  <span class="odd__fill" :style="{ width: `${row.share * 100}%` }" />
                </span>
              </li>
            </ul>
          </section>
        </template>
      </ASmartSkeleton>
    </div>
  </DemoTabs>
</template>

<style scoped>
.odd {
  cursor: pointer;
  user-select: none;
  outline: 0;
  max-width: 24rem;
}
.odd:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
  border-radius: 0.5rem;
}
.odd__card {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
}
.odd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.odd__head h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.odd ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.odd li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-rows: auto auto;
  column-gap: 0.75rem;
  row-gap: 0.25rem;
  align-items: center;
  font-size: 0.8125rem;
}
.odd__label {
  color: var(--color-text);
  font-weight: 500;
}
.odd__value {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.odd__share {
  color: var(--color-text-dim);
  font-variant-numeric: tabular-nums;
  width: 2.25rem;
  text-align: end;
}
.odd__track {
  grid-column: 1 / -1;
  display: block;
  height: 0.25rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-text-dim) 20%, transparent);
  overflow: hidden;
}
.odd__fill {
  display: block;
  height: 100%;
  background: #6366f1;
  border-radius: 9999px;
  transition: width 240ms ease-out;
}
.odd :deep([ask-rect='text']),
.odd :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
