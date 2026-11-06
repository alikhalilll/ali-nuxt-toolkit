<script setup lang="ts">
// Mirrors muslim-academy-platform/app/features/community/components/Feed/PostCard.vue
// faithfully — same classes on every element, same sub-component split
// (Header → UserAvatar + ActionsMenu, body + MediaGrid, footer → Reactions +
// comment button). Differences from the real file: no NuxtLink / i18n / API /
// bidi parsing / body clamp measurement / Teleports for dialogs. Those live
// outside the layout the skeleton sees.
import Header from './Header.vue';
import MediaGrid from './MediaGrid.vue';
import Reactions from './Reactions.vue';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}
interface Post {
  id: string;
  author: { id: string; name: string; avatar?: string | null; verified?: boolean };
  created_at_relative: string;
  is_edited?: boolean;
  is_owner?: boolean;
  body: string;
  media?: MediaItem[];
  reactions_count: number;
  comments_count: number;
  is_reacted?: boolean;
}

defineProps<{
  post: Post;
  highlighted?: boolean;
}>();
</script>

<template>
  <article
    :id="`post-${post.id}`"
    class="border border-[#EDF0F3] rounded-[12px] bg-white flex flex-col w-full transition-shadow scroll-mt-24"
    :class="highlighted ? 'ring-2 ring-primary shadow-lg' : ''"
  >
    <!-- Header owns its own vertical padding so the footer's border-t sits
         flush with the body — matches the real card exactly. -->
    <Header :post="post" class="px-5 pb-4 pt-4" />

    <div class="px-5 pb-4 flex flex-col gap-3">
      <div>
        <p
          dir="auto"
          class="text-sm text-gray-800 leading-relaxed text-start whitespace-pre-wrap break-words"
        >
          {{ post.body }}
        </p>
      </div>
      <MediaGrid :media="post.media" />
    </div>

    <footer class="px-5 py-4 border-t border-[#EDF0F3] flex gap-4 items-center">
      <Reactions :count="post.reactions_count" :is-reacted="post.is_reacted" />
      <!--
        `data-ask-block` draws the whole comment button as one pill bone
        instead of fragmenting into an icon bone + a count bone. See the
        reactions button for the same pattern — matches the handcrafted
        `PostCardSkeleton.vue` footer pills.
      -->
      <button
        type="button"
        data-ask-block
        class="text-sm text-gray-600 rounded-lg flex gap-1.5 transition-colors items-center hover:text-primary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="size-4"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{{ post.comments_count.toLocaleString() }}</span>
      </button>
    </footer>
  </article>
</template>
