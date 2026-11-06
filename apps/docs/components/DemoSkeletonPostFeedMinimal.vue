<script setup lang="ts">
/**
 * Minimal hero demo — just a feed + a Refresh button.
 *
 * No controls, no advanced settings, no theme panel. The one job of this
 * demo is to show, in the smallest possible footprint, what ASmartSkeleton
 * does: real content lays out, invisible measurement runs, chrome-captured
 * bones appear during loading, real posts fade in.
 *
 * The full interactive version (reveal modes, animation styles, theming) is
 * a separate component — `<DemoSkeletonPostFeed>` — placed later on the
 * page under its own "Customize" heading.
 */
import { onBeforeUnmount, onMounted, ref, computed } from 'vue';
import PostCard from './PostCardDemo/PostCard.vue';

// --- Docs theme tracking (same pattern as the full demo) ---------------
const docsIsDark = ref(false);
let themeObserver: MutationObserver | null = null;
function syncDocsTheme() {
  if (typeof document === 'undefined') return;
  docsIsDark.value = document.documentElement.classList.contains('dark');
}
onMounted(() => {
  syncDocsTheme();
  themeObserver = new MutationObserver(syncDocsTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
});
onBeforeUnmount(() => {
  themeObserver?.disconnect();
  themeObserver = null;
});
const providerMode = computed<'light' | 'dark'>(() => (docsIsDark.value ? 'dark' : 'light'));

const DEMO_THEME = {
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
};

// --- Data ---------------------------------------------------------------
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

const feed = ref<Post[] | null>(SAMPLE_POSTS);
const isLoading = ref(false);
function refreshFeed() {
  isLoading.value = true;
  feed.value = null;
  setTimeout(() => {
    feed.value = [
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
    isLoading.value = false;
  }, 1600);
}
</script>

<template>
  <DemoStage :center="false">
    <div class="pfm">
      <!-- Single action — the only thing a visitor needs to do first -->
      <div class="pfm__bar">
        <span class="pfm__hint">Click <strong>Refresh</strong> to watch the skeleton phase:</span>
        <button
          type="button"
          class="pfm__cta"
          :disabled="isLoading"
          :aria-busy="isLoading"
          @click="refreshFeed"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            :class="{ 'pfm__cta-icon--spin': isLoading }"
          >
            <path
              d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ isLoading ? 'Loading' : 'Refresh feed' }}</span>
        </button>
      </div>

      <div class="pfm__stage">
        <ASmartSkeletonProvider :mode="providerMode" :theme="DEMO_THEME" reveal="smart">
          <ASmartSkeleton id="docs-hero-feed" :data="feed" :sample="SAMPLE_POSTS">
            <template #default="{ data }">
              <div class="pfm__list">
                <PostCard v-for="post in data as Post[]" :key="post.id" :post="post" />
              </div>
            </template>
          </ASmartSkeleton>
        </ASmartSkeletonProvider>
      </div>
    </div>
  </DemoStage>
</template>

<style scoped>
.pfm {
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

/* --- Top bar --------------------------------------------------------- */
.pfm__bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 1px 0 var(--color-border-soft);
}

.pfm__hint {
  flex: 1;
  font-size: 12.5px;
  color: var(--color-text-dim);
  min-width: 200px;
}
.pfm__hint strong {
  color: var(--color-text);
  font-weight: 600;
}

.pfm__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px 7px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-3) 100%);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  box-shadow:
    0 1px 0 rgb(0 0 0 / 0.08),
    0 6px 18px -10px color-mix(in oklab, var(--color-brand) 60%, transparent);
  transition:
    filter 0.12s,
    transform 0.08s;
}
.pfm__cta:hover {
  filter: brightness(1.05);
}
.pfm__cta:active {
  transform: translateY(1px);
}
.pfm__cta:disabled {
  opacity: 0.7;
  cursor: progress;
}
.pfm__cta svg {
  width: 14px;
  height: 14px;
}
.pfm__cta-icon--spin {
  animation: pfm-spin 0.9s linear infinite;
}
@keyframes pfm-spin {
  to {
    transform: rotate(360deg);
  }
}

/* --- Feed stage ------------------------------------------------------ */
.pfm__stage {
  padding: 16px;
  background: color-mix(in oklab, var(--color-surface-2) 70%, var(--color-bg));
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.pfm__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Same PostCard retint pattern as the full demo so chrome capture tracks
 * the docs palette on theme flip. */
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

/* Soft inset ring on text + box bones to echo the `ASkeletonBlock` look */
.pfm :deep([ask-rect='text']),
.pfm :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
