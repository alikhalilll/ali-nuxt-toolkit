<script setup lang="ts">
// Mirrors Header.vue (feed variant) in muslim-academy-platform. Real impl
// uses NuxtLinkLocale + i18n + UiARelativeTime + verified-badge icon.
// Here: plain <a> for the links, inline time string, minimal verified SVG —
// every CLASS preserved so the ghost-skeleton walker sees an identical tree.
import UserAvatar from './UserAvatar.vue';
import ActionsMenu from './ActionsMenu.vue';

defineProps<{
  post: {
    author: { id: string; name: string; avatar?: string | null; verified?: boolean };
    created_at_relative: string;
    is_edited?: boolean;
    is_owner?: boolean;
  };
}>();
</script>

<template>
  <header class="flex gap-3 items-start">
    <a :href="`#/community/members/${post.author.id}`" class="shrink-0" @click.prevent>
      <UserAvatar :name="post.author.name" :src="post.author.avatar" size-class="size-10 text-sm" />
    </a>
    <div class="flex flex-1 flex-col min-w-0">
      <div class="flex gap-1.5 min-w-0 items-center">
        <a
          :href="`#/community/members/${post.author.id}`"
          class="text-sm text-gray-900 font-semibold truncate hover:underline"
          @click.prevent
        >
          {{ post.is_owner ? `${post.author.name} (you)` : post.author.name }}
        </a>
        <svg
          v-if="post.author.verified"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="text-primary shrink-0 size-4"
          aria-hidden="true"
        >
          <path
            d="M12 2l2.4 2.1 3.2-.3.9 3.1 2.9 1.4-.9 3.1 1.4 2.9-2.1 2.4.3 3.2-3.1.9-1.4 2.9-3.1-.9-2.9 1.4-2.4-2.1-3.2.3-.9-3.1-2.9-1.4.9-3.1L1 9.9l2.1-2.4-.3-3.2 3.1-.9L7.3 0.5l3.1.9z"
          />
        </svg>
      </div>
      <span class="text-xs text-gray-500">
        <time>{{ post.created_at_relative }}</time>
        <span v-if="post.is_edited" class="text-gray-400"> · edited</span>
      </span>
    </div>
    <ActionsMenu />
  </header>
</template>
