<script setup lang="ts">
/**
 * Comparison line chart — solid current period + dashed previous period.
 * Inline SVG so the demo has no chart-library dependency; the same pattern
 * works unchanged against nuxt-charts / unovis with `lineDashArray`.
 * Click anywhere on the card to reload.
 */
import { computed, onUnmounted, ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

interface Point {
  day: number;
  current: number;
  previous: number;
}

const SAMPLE: Point[] = [
  { day: 0, current: 430, previous: 540 },
  { day: 1, current: 480, previous: 520 },
  { day: 2, current: 560, previous: 580 },
  { day: 3, current: 610, previous: 610 },
  { day: 4, current: 680, previous: 700 },
  { day: 5, current: 750, previous: 760 },
  { day: 6, current: 800, previous: 790 },
];

const REAL: Point[] = [
  { day: 0, current: 460, previous: 550 },
  { day: 1, current: 510, previous: 540 },
  { day: 2, current: 580, previous: 570 },
  { day: 3, current: 640, previous: 620 },
  { day: 4, current: 710, previous: 690 },
  { day: 5, current: 780, previous: 740 },
  { day: 6, current: 830, previous: 800 },
];

const target = ref<HTMLElement | null>(null);
const series = ref<Point[] | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

function load() {
  if (timer) clearTimeout(timer);
  series.value = null;
  timer = setTimeout(() => {
    series.value = REAL;
  }, 900);
}

// Click bypasses the skeleton flash entirely — the viewer already saw it.
function reload() {
  if (timer) clearTimeout(timer);
  // Toggle between skeleton (null) and content (REAL) — lets the viewer
  // flip states without waiting, whichever side they currently see.
  series.value = series.value ? null : REAL;
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

const W = 520;
const H = 140;

const path = (points: Point[], key: 'current' | 'previous') => {
  const values = points.flatMap((p) => [p.current, p.previous]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const dx = W / (points.length - 1);
  const scaleY = (v: number) => H - ((v - min) / (max - min || 1)) * (H - 16) - 8;
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * dx).toFixed(2)} ${scaleY(p[key]).toFixed(2)}`)
    .join(' ');
};

const currentPath = computed(() => path((series.value ?? SAMPLE) as Point[], 'current'));
const previousPath = computed(() => path((series.value ?? SAMPLE) as Point[], 'previous'));

const code = `<script setup lang="ts">
import { ref } from 'vue';

const series = ref(null);
// First series solid, second series dashed — one entry per series.
const lineDashArray = [[], [4, 4]];
\u003c/script>

<template>
  <AGhostSkeleton id="comparison-chart" :data="series" :sample="[]">
    <template #default>
      <ClientOnly>
        <AreaChart
          :data="series ?? []"
          :line-dash-array="lineDashArray"
          :height="140"
          :curve-type="'monotoneX'"
        />
      </ClientOnly>
    </template>

    <template #skeleton>
      <!-- Hand-authored placeholder opts out of measurement. -->
      <div class="h-[140px]" ask-block>
        <AGhostSkeletonBox width="100%" height="100%" radius="8px" />
      </div>
    </template>
  </AGhostSkeleton>
</template>`;
</script>

<template>
  <DemoTabs :code="code">
    <div
      ref="target"
      class="odc"
      role="button"
      tabindex="0"
      aria-label="Reload demo"
      @click="reload"
      @keydown.enter="reload"
      @keydown.space.prevent="reload"
    >
      <AGhostSkeleton id="demo-comparison-chart" :data="series" :sample="SAMPLE">
        <template #default>
          <section class="odc__card">
            <header class="odc__head">
              <h3>Visitors by day</h3>
              <span class="odc__legend">
                <span class="odc__swatch odc__swatch--solid" aria-hidden="true" />
                <span>This period</span>
                <span class="odc__swatch odc__swatch--dash" aria-hidden="true" />
                <span>Previous</span>
              </span>
            </header>
            <svg
              :viewBox="`0 0 ${W} ${H}`"
              class="odc__svg"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path :d="previousPath" class="odc__line odc__line--prev" />
              <path :d="currentPath" class="odc__line odc__line--curr" />
            </svg>
          </section>
        </template>

        <template #skeleton>
          <div class="odc__card odc__card--skeleton" ask-block>
            <AGhostSkeletonBox width="100%" height="140px" radius="8px" />
          </div>
        </template>
      </AGhostSkeleton>
    </div>
  </DemoTabs>
</template>

<style scoped>
.odc {
  cursor: pointer;
  user-select: none;
  outline: 0;
}
.odc:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
  border-radius: 0.5rem;
}
.odc__card {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
}
.odc__card--skeleton {
  padding: 0;
  border: 0;
  background: transparent;
}
.odc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.odc__head h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.odc__legend {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-dim);
}
.odc__swatch {
  display: inline-block;
  width: 1.125rem;
  height: 0;
  border-top-width: 2px;
  border-top-style: solid;
  color: #6366f1;
  border-top-color: currentColor;
}
.odc__swatch--dash {
  border-top-style: dashed;
  color: var(--color-text-dim);
}
.odc__svg {
  width: 100%;
  height: 8.75rem;
  display: block;
}
.odc__line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.odc__line--curr {
  stroke: #6366f1;
}
.odc__line--prev {
  stroke: var(--color-text-dim);
  stroke-dasharray: 4 4;
  opacity: 0.6;
}
.odc :deep([ask-rect='text']),
.odc :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
