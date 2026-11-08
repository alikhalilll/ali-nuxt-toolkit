<script setup lang="ts">
/**
 * Minimal hero demo — just a feed + a Refresh button.
 *
 * Styled to match the other skeleton examples on the docs page
 * (DemoSkeletonDataDriven, DemoSkeletonStates, DemoSkeletonHints): wrapped
 * in `<DemoTabs :code="...">`, Tailwind utility classes only, header row
 * with a title + API chip on the left and a pulsing-dot reload button
 * on the right.
 *
 * The full interactive version (reveal modes, animation styles, theming)
 * lives in `<DemoSkeletonPostFeed>` under the page's "Customize" section.
 */
import { computed, onMounted, ref } from 'vue';
import PostCard from './PostCardDemo/PostCard.vue';
import { useColorMode } from '~/composables/useColorMode';

// --- Docs theme tracking ----------------------------------------------
// Reads from the SSR-aware `useColorMode()` composable, which pulls the
// resolved mode from the `ant-docs-resolved` cookie on the server (set by
// the pre-paint inline script in nuxt.config.ts) and from
// `useState` + localStorage on the client. Means the provider renders
// with the right mode on the first byte of the response — no flash on
// hard refresh, even before any JS runs.
const { isDark } = useColorMode();
const providerMode = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'));

const DEMO_THEME = {
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
};

// --- Data -------------------------------------------------------------
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
    id: 'mini-sample-1',
    author: {
      id: 'sample-1',
      name: 'Jamie Hartwell',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
      verified: true,
    },
    created_at_relative: '2 hours ago',
    is_owner: false,
    body: 'Rolled the chrome-capture change into production. Zero visible layout shift on the feed, and the cold-cache first paint now matches the real card footprint to the pixel.',
    media: [],
    reactions_count: 24,
    comments_count: 7,
    is_reacted: false,
  },
  {
    id: 'mini-sample-2',
    author: {
      id: 'sample-2',
      name: 'Jamie Hartwell',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    },
    created_at_relative: '2 hours ago',
    is_owner: false,
    body: "Confirmed the url(…) backgrounds are being filtered out — gradient rings still carry through, hero bitmaps don't.",
    media: [],
    reactions_count: 24,
    comments_count: 7,
    is_reacted: false,
  },
];

const REAL_POSTS: Post[] = [
  {
    id: 'mini-real-1',
    author: {
      id: 'u-elena',
      name: 'Elena Rostova',
      avatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
      verified: true,
    },
    created_at_relative: 'just now',
    is_owner: false,
    body: 'Rolled the chrome-capture change into production. Zero visible layout shift on the feed, and the cold-cache first paint now matches the real card footprint to the pixel.',
    media: [],
    reactions_count: 51,
    comments_count: 12,
    is_reacted: true,
  },
  {
    id: 'mini-real-2',
    author: {
      id: 'u-marcus',
      name: 'Marcus Lee',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    },
    created_at_relative: '4 min ago',
    is_owner: true,
    body: "Confirmed the url(…) backgrounds are being filtered out — gradient rings still carry through, hero bitmaps don't.",
    media: [],
    reactions_count: 18,
    comments_count: 3,
    is_reacted: false,
  },
];

// Start in the skeleton state so the hero lands on the measured placeholder
// first — then the auto-fetch below completes the capture → reveal arc
// without any interaction. Clicking Refresh replays the same arc.
const feed = ref<Post[] | null>(null);
const loading = ref(true);

// Delay a beat past hydration so the ghost tree has time to measure before
// `feed.value` flips. Otherwise `reveal="smart"` short-circuits to instant
// (content landed under 150 ms) and the viewer never sees the skeleton.
onMounted(() => {
  setTimeout(() => {
    feed.value = REAL_POSTS;
    loading.value = false;
  }, 1600);
});

function refreshFeed() {
  loading.value = true;
  feed.value = null;
  setTimeout(() => {
    feed.value = REAL_POSTS;
    loading.value = false;
  }, 1600);
}

const code = `<script setup lang="ts">
import { ref } from 'vue';
import PostCard from './PostCard.vue';

const SAMPLE_POSTS = [ /* ... two sample shapes ... */ ];

const feed = ref<Post[] | null>(SAMPLE_POSTS);
async function refreshFeed() {
  feed.value = null;
  feed.value = await $fetch('/api/community/posts');
}
\u003c/script>

<template>
  <!-- Provider sets the colour mode + theme and the default reveal
       animation for every skeleton inside; omit it to inherit the page's
       theme and \`smart\` as the default. -->
  <ASmartSkeletonProvider
    mode="system"
    :theme="{
      light: { base: '#d1d4dc', highlight: '#ffffff' },
      dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
    }"
    reveal="smart"
  >
    <ASmartSkeleton
      id="docs-hero-feed"
      :data="feed"
      :sample="SAMPLE_POSTS"
    >
      <template #default="{ data }">
        <div class="flex flex-col gap-3">
          <PostCard v-for="post in data" :key="post.id" :post="post" />
        </div>
      </template>
    </ASmartSkeleton>
  </ASmartSkeletonProvider>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- Header row — mirrors DemoSkeletonDataDriven etc. -->
        <div class="mb-5 flex items-center justify-between border-b border-border/60 pb-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-text">Social Feed</span>
            <span class="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-text-dim">
              <code>:data="feed" :sample="SAMPLE_POSTS"</code>
            </span>
          </div>

          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-sm transition-all hover:bg-surface-2 active:scale-95 disabled:opacity-50"
            :disabled="loading"
            @click="refreshFeed"
          >
            <span
              class="size-2 rounded-full"
              :class="loading ? 'bg-amber-400 animate-ping' : 'bg-primary'"
            />
            <span>{{ loading ? 'Fetching…' : 'Refresh feed' }}</span>
          </button>
        </div>

        <!-- Feed stage — same container pattern as the product-card demo -->
        <div class="pfm mx-auto max-w-md">
          <div class="overflow-hidden rounded-xl border border-border bg-surface/50 p-3">
            <ASmartSkeletonProvider :mode="providerMode" :theme="DEMO_THEME" reveal="smart">
              <ASmartSkeleton id="docs-hero-feed" :data="feed" :sample="SAMPLE_POSTS">
                <template #default="{ data }">
                  <div class="flex flex-col gap-3">
                    <PostCard v-for="post in data as Post[]" :key="post.id" :post="post" />
                  </div>
                </template>
              </ASmartSkeleton>
            </ASmartSkeletonProvider>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>

<style scoped>
/*
 * PostCardDemo mirrors the real production card (`bg-white` +
 * `border-[#EDF0F3]` + `text-gray-800`). We retint via `:deep()` to the
 * docs' own tokens so chrome capture snapshots the live docs palette —
 * flip the site theme and the skeleton's chrome bones follow.
 */
.pfm :deep(article) {
  background: var(--color-bg);
  border-color: var(--color-border) !important;
  color: var(--color-text);
}
.pfm :deep(article p),
.pfm :deep(article span),
.pfm :deep(article button) {
  color: inherit;
}
.pfm :deep(article .text-gray-900),
.pfm :deep(article .text-gray-800) {
  color: var(--color-text);
}
.pfm :deep(article .text-gray-500),
.pfm :deep(article .text-gray-600),
.pfm :deep(article .text-gray-400) {
  color: var(--color-text-dim);
}
.pfm :deep(article footer) {
  border-top-color: var(--color-border) !important;
}
.pfm :deep([ask-rect='text']),
.pfm :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
