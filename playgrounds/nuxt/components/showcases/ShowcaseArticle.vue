<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-ghost-skeleton';

/**
 * **Loading article**
 *
 * Avatar (small circle) + author + 2–3 line title + "x min read" metadata.
 * Demonstrates: data-driven slot, text-bar line stacking, author avatar
 * rendered through the ghost without a separate `#prototype`.
 */
interface Article {
  avatar: string;
  author: string;
  title: string;
  readMins: number;
}

defineProps<{ reveal: RevealMode; nonce: number }>();

const SAMPLE: Article = {
  avatar: 'https://i.pravatar.cc/40?u=sample',
  author: 'Jane Doe',
  title: 'Designing for the wait: skeletons that keep perceived performance high',
  readMins: 4,
};

const { data } = useShowcaseData<Article>(() => ({
  avatar: 'https://i.pravatar.cc/40?u=lochie-article',
  author: 'John Doe',
  title: 'Designing for the wait',
  readMins: 4,
}));
</script>

<template>
  <AGhostSkeleton
    id="showcase-article"
    :key="`article-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="block"
  >
    <template #default="{ data }">
      <article class="flex items-start gap-3">
        <img
          :src="data?.avatar"
          :alt="data?.author ?? ''"
          class="size-10 shrink-0 rounded-full object-cover"
          width="40"
          height="40"
        />
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold leading-snug">{{ data?.title }}</h3>
          <p class="mt-1 text-sm text-text-dim">
            {{ data?.author }} · {{ data?.readMins }} min read
          </p>
        </div>
      </article>
    </template>
  </AGhostSkeleton>
</template>
