<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-smart-skeleton';

/**
 * **Loading dashboard metrics** — skullet.lochie.me showcase #4.
 *
 * 2 × 2 grid of metric cards (label + large number + ±% change).
 */
defineProps<{ reveal: RevealMode; nonce: number }>();

interface Metric {
  id: string;
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

const SAMPLE: Metric[] = [
  { id: 'visitors', label: 'Visitors', value: '00,000', delta: '+00%', up: true },
  { id: 'signups', label: 'Signups', value: '0,000', delta: '+0%', up: true },
  { id: 'churn', label: 'Churn', value: '0.0%', delta: '-0.0%', up: false },
  { id: 'revenue', label: 'Revenue', value: '$0.0k', delta: '+00%', up: true },
];

const { data } = useShowcaseData<Metric[]>(() => [
  { id: 'visitors', label: 'Visitors', value: '12,480', delta: '+12%', up: true },
  { id: 'signups', label: 'Signups', value: '1,204', delta: '+4%', up: true },
  { id: 'churn', label: 'Churn', value: '2.1%', delta: '-0.3%', up: false },
  { id: 'revenue', label: 'Revenue', value: '$9.6k', delta: '+18%', up: true },
]);
</script>

<template>
  <ASmartSkeleton
    id="showcase-dashboard"
    :key="`dashboard-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="grid grid-cols-2 gap-3"
  >
    <template #default="{ data }">
      <article v-for="metric in data ?? []" :key="metric.id" class="rounded-lg bg-surface-2 p-4">
        <p class="text-xs uppercase tracking-wide text-text-dim">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-bold leading-none">{{ metric.value }}</p>
        <p
          class="mt-2 text-xs font-semibold"
          :class="metric.up ? 'text-green-500' : 'text-red-500'"
        >
          {{ metric.delta }}
        </p>
      </article>
    </template>
  </ASmartSkeleton>
</template>
