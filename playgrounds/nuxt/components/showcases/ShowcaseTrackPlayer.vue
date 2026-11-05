<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-smart-skeleton';

/**
 * **Loading track player**
 *
 * Album art placeholder + play controls + time display.
 */
defineProps<{ reveal: RevealMode; nonce: number }>();

interface Track {
  artwork: string;
  title: string;
  artist: string;
  time: string;
  total: string;
}

const SAMPLE: Track = {
  artwork: 'https://picsum.photos/seed/sample-track/160/160',
  title: 'Loading…',
  artist: 'Loading…',
  time: '0:00',
  total: '0:00',
};

const { data } = useShowcaseData<Track>(() => ({
  artwork: 'https://picsum.photos/seed/skeletons-track/160/160',
  title: 'Skeletons',
  artist: 'The Layout Janks',
  time: '1:12',
  total: '3:24',
}));
</script>

<template>
  <ASmartSkeleton
    id="showcase-track"
    :key="`track-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="block"
  >
    <template #default="{ data }">
      <article class="flex items-center gap-4 rounded-xl bg-surface-2 p-4">
        <img
          :src="data?.artwork"
          alt=""
          class="size-20 shrink-0 rounded-lg object-cover"
          width="80"
          height="80"
        />
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold truncate">{{ data?.title }}</h3>
          <p class="text-sm text-text-dim truncate">{{ data?.artist }}</p>
          <div class="mt-3 flex items-center gap-3">
            <span class="text-xs text-text-dim tabular-nums">{{ data?.time }}</span>
            <div class="relative h-1 flex-1 rounded-full bg-surface-3">
              <span class="absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand-accent" />
            </div>
            <span class="text-xs text-text-dim tabular-nums">{{ data?.total }}</span>
          </div>
        </div>
        <button
          type="button"
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M5 3l8 5-8 5V3z" />
          </svg>
        </button>
      </article>
    </template>
  </ASmartSkeleton>
</template>
