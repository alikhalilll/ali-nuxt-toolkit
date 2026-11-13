<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-ghost-skeleton';

/**
 * **Loading portfolio**
 *
 * Header with title + total ± % + 3 asset rows (ticker + name + value).
 */
defineProps<{ reveal: RevealMode; nonce: number }>();

interface Asset {
  id: string;
  ticker: string;
  name: string;
  value: string;
  delta: string;
  up: boolean;
}

interface Portfolio {
  total: string;
  delta: string;
  up: boolean;
  assets: Asset[];
}

const SAMPLE: Portfolio = {
  total: '$0,000.00',
  delta: '+0.00%',
  up: true,
  assets: Array.from({ length: 3 }, (_, i) => ({
    id: `s-${i}`,
    ticker: '---',
    name: 'Sample asset',
    value: '$0.00',
    delta: '+0.0%',
    up: true,
  })),
};

const { data } = useShowcaseData<Portfolio>(() => ({
  total: '$4,077.19',
  delta: '+2.40%',
  up: true,
  assets: [
    { id: 'eth', ticker: 'ETH', name: 'Ethereum', value: '$2,480.00', delta: '+2.1%', up: true },
    { id: 'usdc', ticker: 'USDC', name: 'USD Coin', value: '$1,200.19', delta: '+0.0%', up: true },
    { id: 'aave', ticker: 'AAVE', name: 'Aave', value: '$397.00', delta: '+5.6%', up: true },
  ],
}));
</script>

<template>
  <AGhostSkeleton
    id="showcase-portfolio"
    :key="`portfolio-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="block"
  >
    <template #default="{ data }">
      <section class="flex flex-col gap-3">
        <header class="flex items-end justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-text-dim">Total</p>
            <p class="text-2xl font-bold leading-none tabular-nums">{{ data?.total }}</p>
          </div>
          <p
            class="text-sm font-semibold tabular-nums"
            :class="data?.up ? 'text-green-500' : 'text-red-500'"
          >
            {{ data?.delta }}
          </p>
        </header>
        <ul class="flex flex-col gap-2">
          <li
            v-for="asset in data?.assets ?? []"
            :key="asset.id"
            class="flex items-center justify-between gap-3 rounded-lg bg-surface-2 p-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-bold"
                >{{ asset.ticker }}</span
              >
              <div class="min-w-0">
                <p class="text-sm font-semibold">{{ asset.name }}</p>
                <p class="text-xs text-text-dim">{{ asset.ticker }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold tabular-nums">{{ asset.value }}</p>
              <p
                class="text-xs font-semibold tabular-nums"
                :class="asset.up ? 'text-green-500' : 'text-red-500'"
              >
                {{ asset.delta }}
              </p>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </AGhostSkeleton>
</template>
