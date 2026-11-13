<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-ghost-skeleton';

/**
 * **Loading activity feed**
 *
 * 3 stacked notification rows (small avatar + username/timestamp + message).
 */
defineProps<{ reveal: RevealMode; nonce: number }>();

interface Entry {
  id: string;
  avatar: string;
  actor: string;
  action: string;
  when: string;
}

const SAMPLE: Entry[] = Array.from({ length: 3 }, (_, i) => ({
  id: `s-${i}`,
  avatar: `https://i.pravatar.cc/36?u=sample-activity-${i}`,
  actor: 'Someone',
  action: 'did a thing a while ago',
  when: 'just now',
}));

const { data } = useShowcaseData<Entry[]>(() => [
  {
    id: 'a0',
    avatar: 'https://i.pravatar.cc/36?u=lochie-activity',
    actor: 'Lochie',
    action: 'opened a pull request',
    when: '2m ago',
  },
  {
    id: 'a1',
    avatar: 'https://i.pravatar.cc/36?u=alex-activity',
    actor: 'Alex',
    action: 'approved pull request #42',
    when: '12m ago',
  },
  {
    id: 'a2',
    avatar: 'https://i.pravatar.cc/36?u=pugson-activity',
    actor: 'Pugson',
    action: 'commented on your post',
    when: '1h ago',
  },
]);
</script>

<template>
  <AGhostSkeleton
    id="showcase-activity"
    :key="`activity-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="flex flex-col gap-2"
  >
    <template #default="{ data }">
      <article
        v-for="entry in data ?? []"
        :key="entry.id"
        class="flex items-start gap-3 rounded-lg bg-surface-2 p-3"
      >
        <img
          :src="entry.avatar"
          alt=""
          class="size-9 shrink-0 rounded-full"
          width="36"
          height="36"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm">
            <span class="font-semibold">{{ entry.actor }}</span>
            <span class="text-text-dim"> {{ entry.action }}</span>
          </p>
          <p class="text-xs text-text-dim">{{ entry.when }}</p>
        </div>
      </article>
    </template>
  </AGhostSkeleton>
</template>
