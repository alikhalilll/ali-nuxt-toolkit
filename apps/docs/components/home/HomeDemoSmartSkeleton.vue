<script setup lang="ts">
/**
 * Homepage demo — a compact analytics overview: four metric tiles, a
 * this-period vs previous-period line chart, and a top-browsers
 * distribution list. One `<ASmartSkeleton>` wraps the whole thing.
 *
 * Click anywhere on the surface to reload (matches the per-card reload
 * pattern used throughout the site demos).
 */
import { computed, onUnmounted, ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';
import { useColorMode } from '~/composables/useColorMode';

const target = ref<HTMLElement | null>(null);

const { isDark } = useColorMode();
const providerMode = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'));

const DEMO_THEME = {
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
};

interface Metric {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}
interface Point {
  day: number;
  current: number;
  previous: number;
}
interface DistRow {
  label: string;
  value: string;
  share: number;
}
interface PageRow {
  path: string;
  sessions: string;
  bounce: string;
}
interface Overview {
  metrics: Metric[];
  series: Point[];
  distribution: DistRow[];
  pages: PageRow[];
}

const SAMPLE: Overview = {
  metrics: [
    { label: 'Visitors', value: '12,480', delta: '+14.3%', up: true },
    { label: 'Sessions', value: '18,206', delta: '+10.1%', up: true },
    { label: 'Page views', value: '41,372', delta: '-6.0%', up: false },
    { label: 'Engagement', value: '64.2%', delta: '+2.4 pts', up: true },
  ],
  series: [
    { day: 0, current: 430, previous: 540 },
    { day: 1, current: 480, previous: 520 },
    { day: 2, current: 560, previous: 580 },
    { day: 3, current: 610, previous: 610 },
    { day: 4, current: 680, previous: 700 },
    { day: 5, current: 750, previous: 760 },
    { day: 6, current: 800, previous: 790 },
  ],
  distribution: [
    { label: 'Chrome', value: '6,840', share: 0.55 },
    { label: 'Safari', value: '3,920', share: 0.31 },
    { label: 'Edge', value: '980', share: 0.08 },
    { label: 'Firefox', value: '420', share: 0.03 },
    { label: 'Other', value: '310', share: 0.03 },
  ],
  pages: [
    { path: '/', sessions: '8,420', bounce: '42%' },
    { path: '/pricing', sessions: '3,420', bounce: '51%' },
    { path: '/docs', sessions: '2,340', bounce: '38%' },
    { path: '/blog', sessions: '1,730', bounce: '62%' },
  ],
};

// Mildly different numbers from the sample so the reveal visibly ticks.
const REAL: Overview = {
  metrics: [
    { label: 'Visitors', value: '13,042', delta: '+19.3%', up: true },
    { label: 'Sessions', value: '19,018', delta: '+15.0%', up: true },
    { label: 'Page views', value: '40,814', delta: '-3.1%', up: false },
    { label: 'Engagement', value: '65.7%', delta: '+3.9 pts', up: true },
  ],
  series: [
    { day: 0, current: 460, previous: 550 },
    { day: 1, current: 510, previous: 540 },
    { day: 2, current: 580, previous: 570 },
    { day: 3, current: 640, previous: 620 },
    { day: 4, current: 710, previous: 690 },
    { day: 5, current: 780, previous: 740 },
    { day: 6, current: 830, previous: 800 },
  ],
  distribution: [
    { label: 'Chrome', value: '7,114', share: 0.56 },
    { label: 'Safari', value: '3,983', share: 0.31 },
    { label: 'Edge', value: '940', share: 0.07 },
    { label: 'Firefox', value: '451', share: 0.04 },
    { label: 'Other', value: '268', share: 0.02 },
  ],
  pages: [
    { path: '/', sessions: '8,804', bounce: '40%' },
    { path: '/pricing', sessions: '3,612', bounce: '49%' },
    { path: '/docs', sessions: '2,544', bounce: '36%' },
    { path: '/blog', sessions: '1,820', bounce: '59%' },
  ],
};

const overview = ref<Overview | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

// Skeleton stays on screen until the demo enters the viewport; three
// seconds later the real data drops in. Click to replay.
function load() {
  if (timer) clearTimeout(timer);
  overview.value = null;
  timer = setTimeout(() => {
    overview.value = REAL;
  }, 3000);
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

// Inline chart path helpers — one SVG keeps the demo self-contained.
const chartW = 520;
const chartH = 120;

const chartPath = (points: Point[], key: 'current' | 'previous') => {
  const values = points.flatMap((p) => [p.current, p.previous]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const dx = chartW / (points.length - 1);
  const scaleY = (v: number) => chartH - ((v - min) / (max - min || 1)) * (chartH - 12) - 6;
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * dx).toFixed(2)} ${scaleY(p[key]).toFixed(2)}`)
    .join(' ');
};
</script>

<template>
  <div
    ref="target"
    class="odd"
    role="button"
    tabindex="0"
    aria-label="Reload demo"
    @click="load"
    @keydown.enter="load"
    @keydown.space.prevent="load"
  >
    <ASmartSkeletonProvider :mode="providerMode" :theme="DEMO_THEME" reveal="smart">
      <ASmartSkeleton id="home-overview" :data="overview" :sample="SAMPLE" reveal="together">
        <template #default="{ data }">
          <div class="odd__layout">
            <!-- Metric tile row -->
            <div class="odd__tiles">
              <article v-for="m in (data as Overview).metrics" :key="m.label" class="odd__tile">
                <p class="odd__tile-label">{{ m.label }}</p>
                <p class="odd__tile-value">{{ m.value }}</p>
                <p class="odd__tile-delta" :class="m.up ? 'is-up' : 'is-down'">
                  {{ m.delta }}
                </p>
              </article>
            </div>

            <!-- Comparison line chart -->
            <section class="odd__chart">
              <header class="odd__chart-head">
                <h3>Visitors by day</h3>
                <span class="odd__legend">
                  <span class="odd__swatch odd__swatch--solid" aria-hidden="true" />
                  <span>This period</span>
                  <span class="odd__swatch odd__swatch--dash" aria-hidden="true" />
                  <span>Previous</span>
                </span>
              </header>
              <svg
                :viewBox="`0 0 ${chartW} ${chartH}`"
                class="odd__chart-svg"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  :d="chartPath((data as Overview).series, 'previous')"
                  class="odd__line odd__line--prev"
                />
                <path
                  :d="chartPath((data as Overview).series, 'current')"
                  class="odd__line odd__line--curr"
                />
              </svg>
            </section>

            <!-- Two-up: distribution list + top-pages table -->
            <div class="odd__two">
              <!-- Distribution list -->
              <section class="odd__dist">
                <header class="odd__dist-head">
                  <h3>Top browsers</h3>
                </header>
                <ul>
                  <li v-for="row in (data as Overview).distribution" :key="row.label">
                    <span class="odd__dist-label">{{ row.label }}</span>
                    <span class="odd__dist-value">{{ row.value }}</span>
                    <span class="odd__dist-share">{{ Math.round(row.share * 100) }}%</span>
                    <span class="odd__dist-track" aria-hidden="true">
                      <span class="odd__dist-fill" :style="{ width: `${row.share * 100}%` }" />
                    </span>
                  </li>
                </ul>
              </section>

              <!-- Top-pages table -->
              <section class="odd__table">
                <header class="odd__table-head">
                  <h3>Top pages</h3>
                </header>
                <table>
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Sessions</th>
                      <th>Bounce</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="page in (data as Overview).pages" :key="page.path">
                      <td class="odd__table-path">{{ page.path }}</td>
                      <td class="odd__table-num">{{ page.sessions }}</td>
                      <td class="odd__table-num">{{ page.bounce }}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        </template>
      </ASmartSkeleton>
    </ASmartSkeletonProvider>
  </div>
</template>

<style scoped>
.odd {
  cursor: pointer;
  user-select: none;
  outline: 0;
}
.odd:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
  border-radius: 0.5rem;
}

.odd__layout {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Metric tiles — 4-up grid, collapses on narrow surfaces. */
.odd__tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (max-width: 640px) {
  .odd__tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.odd__tile {
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.odd__tile-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin: 0;
}
.odd__tile-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  margin: 0;
}
.odd__tile-delta {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0;
}
.odd__tile-delta.is-up {
  color: #16a34a;
}
.odd__tile-delta.is-down {
  color: #dc2626;
}
:deep(html.dark) .odd__tile-delta.is-up {
  color: #4ade80;
}
:deep(html.dark) .odd__tile-delta.is-down {
  color: #f87171;
}

/* Chart card */
.odd__chart,
.odd__dist {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
}
.odd__chart-head,
.odd__dist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.odd__chart-head h3,
.odd__dist-head h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.odd__legend {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-dim);
}
.odd__swatch {
  display: inline-block;
  width: 1.125rem;
  height: 0;
  border-top-width: 2px;
  border-top-style: solid;
  border-top-color: currentColor;
  color: #6366f1;
}
.odd__swatch--dash {
  border-top-style: dashed;
  color: var(--color-text-dim);
}
.odd__chart-svg {
  width: 100%;
  height: 7.5rem;
  display: block;
}
.odd__line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.odd__line--curr {
  stroke: #6366f1;
}
.odd__line--prev {
  stroke: var(--color-text-dim);
  stroke-dasharray: 4 4;
  opacity: 0.6;
}

/* Distribution + table — side by side above 640px, stacked below. */
.odd__two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
@media (max-width: 640px) {
  .odd__two {
    grid-template-columns: 1fr;
  }
}

/* Distribution list */
.odd__dist ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.odd__dist li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-rows: auto auto;
  column-gap: 0.75rem;
  row-gap: 0.25rem;
  align-items: center;
  font-size: 0.8125rem;
}
.odd__dist-label {
  color: var(--color-text);
  font-weight: 500;
}
.odd__dist-value {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.odd__dist-share {
  color: var(--color-text-dim);
  font-variant-numeric: tabular-nums;
  width: 2.25rem;
  text-align: end;
}
.odd__dist-track {
  grid-column: 1 / -1;
  display: block;
  height: 0.25rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-text-dim) 20%, transparent);
  overflow: hidden;
}
.odd__dist-fill {
  display: block;
  height: 100%;
  background: #6366f1;
  border-radius: 9999px;
  transition: width 240ms ease-out;
}

/* Top-pages table */
.odd__table {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-bg);
}
.odd__table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.odd__table-head h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.odd__table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}
.odd__table th,
.odd__table td {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text-dim) 20%, transparent);
  text-align: start;
}
.odd__table th {
  color: var(--color-text-dim);
  font-weight: 500;
}
.odd__table-path {
  color: var(--color-text);
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
.odd__table-num {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  text-align: end;
  white-space: nowrap;
}

/* Skeleton bones get a subtle inset ring so they read against the demo's
   light-on-light surface. Same treatment as the post-feed demo. */
.odd :deep([ask-rect='text']),
.odd :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
