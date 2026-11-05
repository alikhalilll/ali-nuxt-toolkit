<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-smart-skeleton';

/**
 * **Loading gallery**
 *
 * 3 × 2 grid of image placeholders.
 */
defineProps<{ reveal: RevealMode; nonce: number }>();

interface Shot {
  id: number;
  src: string;
}

const SAMPLE: Shot[] = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  src: `https://picsum.photos/seed/gallery-s${i}/320/200`,
}));

const { data } = useShowcaseData<Shot[]>(
  () =>
    Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      src: `https://picsum.photos/seed/gallery-${i}-${Math.random()}/320/200`,
    })),
  1000
);
</script>

<template>
  <ASmartSkeleton
    id="showcase-gallery"
    :key="`gallery-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="grid grid-cols-3 gap-3"
  >
    <template #default="{ data }">
      <figure
        v-for="shot in data ?? []"
        :key="shot.id"
        class="aspect-[16/10] overflow-hidden rounded-lg bg-surface-2"
      >
        <img
          :src="shot.src"
          alt=""
          width="320"
          height="200"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </figure>
    </template>
  </ASmartSkeleton>
</template>
