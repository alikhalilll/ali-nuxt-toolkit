<script setup lang="ts">
/**
 * Homepage-only variant of DemoSkeletonPostFeedMinimal — no Preview / Code tabs,
 * no "Social Feed" header strip, no Refresh button. Pure live demo:
 * a short social feed that mounts as a skeleton and reveals after ~1.6s.
 *
 * Click anywhere on the surface to reload the demo (matches Skullet's pattern
 * where every card is a reload target).
 */
import { computed, onMounted, ref } from 'vue';
import PostCard from '~/components/PostCardDemo/PostCard.vue';
import { useColorMode } from '~/composables/useColorMode';

const { isDark } = useColorMode();
const providerMode = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'));

const DEMO_THEME = {
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
};

interface Post {
  id: string;
  author: { id: string; name: string; avatar?: string | null; verified?: boolean };
  created_at_relative: string;
  is_edited?: boolean;
  is_owner?: boolean;
  body: string;
  media?: { type: 'image' | 'video'; url: string }[];
  reactions_count: number;
  comments_count: number;
  is_reacted?: boolean;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: 's-1',
    author: {
      id: 'sample-1',
      name: 'Jamie Hartwell',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
      verified: true,
    },
    created_at_relative: '2 hours ago',
    body: 'Rolled the chrome-capture change into production. Zero visible layout shift on the feed.',
    media: [],
    reactions_count: 24,
    comments_count: 7,
  },
];

const REAL_POSTS: Post[] = [
  {
    id: 'r-1',
    author: {
      id: 'u-elena',
      name: 'Elena Rostova',
      avatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
      verified: true,
    },
    created_at_relative: 'just now',
    body: 'Rolled the chrome-capture change into production. Zero visible layout shift on the feed, and the cold-cache first paint now matches the real card footprint to the pixel.',
    media: [],
    reactions_count: 51,
    comments_count: 12,
    is_reacted: true,
  },
];

const feed = ref<Post[] | null>(null);

function load() {
  feed.value = null;
  setTimeout(() => {
    feed.value = REAL_POSTS;
  }, 1600);
}

onMounted(load);
</script>

<template>
  <div
    class="hds"
    role="button"
    tabindex="0"
    aria-label="Reload demo"
    @click="load"
    @keydown.enter="load"
    @keydown.space.prevent="load"
  >
    <ASmartSkeletonProvider :mode="providerMode" :theme="DEMO_THEME" reveal="smart">
      <ASmartSkeleton id="home-feed" :data="feed" :sample="SAMPLE_POSTS">
        <template #default="{ data }">
          <div class="hds__list">
            <PostCard v-for="post in data as Post[]" :key="post.id" :post="post" />
          </div>
        </template>
      </ASmartSkeleton>
    </ASmartSkeletonProvider>
  </div>
</template>

<style scoped>
.hds {
  cursor: pointer;
  user-select: none;
  outline: 0;
}
.hds:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
  border-radius: 0.5rem;
}
.hds__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hds :deep(article) {
  background: var(--color-bg);
  border-color: var(--color-border) !important;
  color: var(--color-text);
}
.hds :deep(article .text-gray-900),
.hds :deep(article .text-gray-800) {
  color: var(--color-text);
}
.hds :deep(article .text-gray-500),
.hds :deep(article .text-gray-600),
.hds :deep(article .text-gray-400) {
  color: var(--color-text-dim);
}
.hds :deep(article footer) {
  border-top-color: var(--color-border) !important;
}
.hds :deep([ask-rect='text']),
.hds :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
