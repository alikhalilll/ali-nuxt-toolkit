<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-ghost-skeleton';

/**
 * **Loading thread**
 *
 * Circular avatar + username + 3 stacked comment blocks + send button.
 */
defineProps<{ reveal: RevealMode; nonce: number }>();

interface Comment {
  id: number;
  author: string;
  body: string;
  avatar: string;
}

interface Thread {
  avatar: string;
  author: string;
  comments: Comment[];
}

const SAMPLE: Thread = {
  avatar: 'https://i.pravatar.cc/44?u=sample-thread',
  author: 'Someone',
  comments: [
    {
      id: 0,
      author: 'Thread author',
      body: 'Opening the conversation with a reasonably long first message that wraps across two lines.',
      avatar: 'https://i.pravatar.cc/36?u=sample-c0',
    },
    {
      id: 1,
      author: 'A friend',
      body: 'A shorter reply.',
      avatar: 'https://i.pravatar.cc/36?u=sample-c1',
    },
    {
      id: 2,
      author: 'Someone else',
      body: 'And a third response wrapping across one line.',
      avatar: 'https://i.pravatar.cc/36?u=sample-c2',
    },
  ],
};

const { data } = useShowcaseData<Thread>(() => ({
  avatar: 'https://i.pravatar.cc/44?u=lochie',
  author: 'Lochie',
  comments: [
    {
      id: 0,
      author: 'Lochie',
      body: 'Just shipped the new skeleton library — pretty happy with how the reveal animations landed.',
      avatar: 'https://i.pravatar.cc/36?u=lochie-c0',
    },
    {
      id: 1,
      author: 'Pugson',
      body: 'nice work mate',
      avatar: 'https://i.pravatar.cc/36?u=pugson',
    },
    {
      id: 2,
      author: 'Alex',
      body: 'The design is beautiful.',
      avatar: 'https://i.pravatar.cc/36?u=alex',
    },
  ],
}));
</script>

<template>
  <AGhostSkeleton
    id="showcase-thread"
    :key="`thread-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="block"
  >
    <template #default="{ data }">
      <section class="flex flex-col gap-4">
        <header class="flex items-center gap-3">
          <img
            :src="data?.avatar"
            alt=""
            class="size-11 shrink-0 rounded-full"
            width="44"
            height="44"
          />
          <div>
            <p class="text-sm font-semibold">{{ data?.author }}</p>
            <p class="text-xs text-text-dim">just now</p>
          </div>
        </header>
        <ul class="flex flex-col gap-3">
          <li
            v-for="comment in data?.comments ?? []"
            :key="comment.id"
            class="flex items-start gap-3 rounded-lg bg-surface-2 p-3"
          >
            <img
              :src="comment.avatar"
              alt=""
              class="size-9 shrink-0 rounded-full"
              width="36"
              height="36"
            />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold">{{ comment.author }}</p>
              <p class="mt-0.5 text-sm leading-snug">{{ comment.body }}</p>
            </div>
          </li>
        </ul>
        <button
          type="button"
          class="self-end rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-white"
        >
          Send
        </button>
      </section>
    </template>
  </AGhostSkeleton>
</template>
