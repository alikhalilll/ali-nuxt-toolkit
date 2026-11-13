<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RevealMode } from '@alikhalilll/a-ghost-skeleton';

interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  tags: string[];
}

const SAMPLE_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  role: 'Lead UI Systems Architect',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces',
  bio: 'Specializing in headless design tokens, zero-shift loading architecture, and high-performance Vue component systems.',
  tags: ['Vue 3', 'Nuxt 4', 'Canvas 2D', 'CSS Architecture'],
};

const profileData = ref<UserProfile | null>(SAMPLE_PROFILE);
const revealMode = ref<RevealMode>('together');
const isSimulating = ref(false);

const currentState = ref<'loaded' | 'loading' | 'empty' | 'error'>('loaded');
const errorMessage = ref<string | null>(null);

function simulateFetch(targetState: 'loaded' | 'empty' | 'error' = 'loaded') {
  isSimulating.value = true;
  profileData.value = null;
  errorMessage.value = null;
  currentState.value = 'loading';

  setTimeout(() => {
    isSimulating.value = false;
    currentState.value = targetState;
    if (targetState === 'loaded') {
      profileData.value = {
        name: 'Elena Rostova',
        role: 'Principal Staff Engineer',
        avatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&crop=faces',
        bio: 'Engineered cross-platform design engines and zero-shift layout tracing algorithms. Based in Zurich.',
        tags: ['Performance', 'Micro-frontends', 'Design Tokens'],
      };
    } else if (targetState === 'empty') {
      profileData.value = null;
    } else if (targetState === 'error') {
      profileData.value = null;
      errorMessage.value = 'Failed to load user profile from edge replica (HTTP 503).';
    }
  }, 1200);
}

// Standalone boxes demo
const boxCount = ref(3);

// --- Demo 3 theming panel ----------------------------------------------------
// Drives an <AGhostSkeletonProvider> that wraps the PostCard feed below.
// Every control updates the provider reactively so you can verify end-to-end
// that `theme` / `mode` / `debug` propagate down to the bones at runtime.
type SkelMode = 'light' | 'dark' | 'system';
type SkelAnim = 'shimmer' | 'group-shimmer' | 'pulse' | 'none';
type SkelSpeed = 'slow' | 'fast';

const themeMode = ref<SkelMode>('light');
const themeAnimation = ref<SkelAnim>('shimmer');
const themeSpeed = ref<SkelSpeed>('slow');
const themeBaseLight = ref('#d1d4dc');
const themeHighlightLight = ref('#ffffff');
const themeBaseDark = ref('#31363f');
const themeHighlightDark = ref('rgba(255,255,255,0.08)');
const themeRadius = ref('6px');
const themeDebug = ref(false);

const demoTheme = computed(() => ({
  light: { base: themeBaseLight.value, highlight: themeHighlightLight.value },
  dark: { base: themeBaseDark.value, highlight: themeHighlightDark.value },
  animation: themeAnimation.value,
  speed: themeSpeed.value,
  radius: themeRadius.value,
}));

// --- PostCard demo (mirrors muslim-academy-platform's `PostCard`) -----------
// Uses the split SFCs under components/PostCardDemo/ so the ghost-skeleton
// walker has to cross component boundaries (PostCard → Header → UserAvatar +
// ActionsMenu, body + MediaGrid, footer → Reactions + comment button).
import PostCard from '~/components/PostCardDemo/PostCard.vue';

// Shape mirrors muslim-academy-platform's `IPost` (author / body / media /
// created_at / reactions_count / comments_count / is_reacted / is_owner).
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

// Sample posts' body lengths deliberately mirror the real-feed replacements
// 1:1 so each skeleton card lays out at the same height as its real
// counterpart on reveal — otherwise the plugin warns `layout jumped on
// reveal`, which is a correct diagnosis of a demo that swaps a 3-line sample
// for a 1-line real post.
const SAMPLE_POSTS: Post[] = [
  {
    id: 'ask-sample-1',
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
    id: 'ask-sample-2',
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
  {
    id: 'ask-sample-3',
    author: {
      id: 'sample-3',
      name: 'Jamie Hartwell',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    },
    created_at_relative: '2 hours ago',
    is_owner: false,
    body: 'Prefers-reduced-motion still honored. Chrome bones stay static, interior shimmer pauses, fade transitions collapse to instant.',
    media: [],
    reactions_count: 24,
    comments_count: 7,
    is_reacted: false,
  },
];

const feed = ref<Post[] | null>(SAMPLE_POSTS);
function refreshFeed() {
  feed.value = null;
  setTimeout(() => {
    feed.value = [
      {
        id: 'real-1',
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
        id: 'real-2',
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
      {
        id: 'real-3',
        author: {
          id: 'u-priya',
          name: 'Priya Natarajan',
          avatar:
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces',
        },
        created_at_relative: '12 min ago',
        is_owner: false,
        is_edited: true,
        body: 'Prefers-reduced-motion still honored. Chrome bones stay static, interior shimmer pauses, fade transitions collapse to instant.',
        media: [],
        reactions_count: 9,
        comments_count: 1,
        is_reacted: false,
      },
    ];
  }, 1600);
}
</script>

<template>
  <div class="min-h-screen bg-bg text-text">
    <div class="mx-auto max-w-5xl px-6 py-10">
      <AppNav />

      <!-- Hero Header -->
      <header class="mb-10">
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight">AGhostSkeleton Playground</h1>
          <span class="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            v0.1.0
          </span>
        </div>
        <p class="mt-2 text-text-dim max-w-2xl">
          Zero-shift, intelligent skeleton loaders for Vue 3 and Nuxt 3+. Real content is laid out
          unseen in normal DOM flow, measured with Canvas 2D font metric precision, and revealed
          smoothly without layout shifts.
        </p>
      </header>

      <!-- Interactive Controls Panel -->
      <div class="mb-8 rounded-xl border border-brand-border bg-surface p-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-text-dim"
              >Trigger State:</span
            >
            <button
              class="rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer"
              :class="
                currentState === 'loaded' && !isSimulating
                  ? 'bg-brand text-bg'
                  : 'bg-surface-2 text-text hover:bg-surface-3'
              "
              @click="simulateFetch('loaded')"
            >
              Fetch Content (1.2s)
            </button>
            <button
              class="rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer"
              :class="
                currentState === 'empty' && !isSimulating
                  ? 'bg-brand text-bg'
                  : 'bg-surface-2 text-text hover:bg-surface-3'
              "
              @click="simulateFetch('empty')"
            >
              Simulate Empty
            </button>
            <button
              class="rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer"
              :class="
                currentState === 'error' && !isSimulating
                  ? 'bg-red-500 text-white'
                  : 'bg-surface-2 text-text hover:bg-surface-3'
              "
              @click="simulateFetch('error')"
            >
              Simulate Error
            </button>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold uppercase tracking-wider text-text-dim"
              >Reveal Transition:</label
            >
            <select
              v-model="revealMode"
              class="rounded-lg border border-brand-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="together">together (crossfade)</option>
              <option value="sequence">sequence (staggered)</option>
              <option value="sweep">sweep (document-clock wave)</option>
              <option value="instant">instant (no fade)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Showcase Grid -->
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <!-- Demo 1: Full State Machine & Data Tracing -->
        <div class="rounded-xl border border-brand-border bg-surface p-6">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-text-dim">
              1 · Data-Driven Profile Card
            </h2>
            <span class="text-xs text-text-dim">Canvas 2D Font Metrics</span>
          </div>

          <AGhostSkeleton
            id="demo-profile-card"
            :data="profileData"
            :sample="SAMPLE_PROFILE"
            :empty="currentState === 'empty'"
            :error="errorMessage"
            :reveal="revealMode"
          >
            <!-- Loaded Slot -->
            <template #default="{ data }">
              <div class="rounded-xl border border-brand-border/60 bg-surface-2 p-6 shadow-sm">
                <div class="flex items-center gap-4">
                  <img
                    :src="(data as UserProfile)?.avatar"
                    alt="Avatar"
                    class="h-16 w-16 rounded-full object-cover ring-2 ring-brand/30"
                  />
                  <div>
                    <h3 class="text-lg font-bold text-text">{{ (data as UserProfile)?.name }}</h3>
                    <p class="text-xs font-medium text-brand">{{ (data as UserProfile)?.role }}</p>
                  </div>
                </div>
                <p class="mt-4 text-sm leading-relaxed text-text-dim">
                  {{ (data as UserProfile)?.bio }}
                </p>
                <div class="mt-4 flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in (data as UserProfile)?.tags"
                    :key="tag"
                    class="rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-text-dim border border-brand-border/40"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Empty Slot -->
            <template #empty>
              <div
                class="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-border py-12 text-center"
              >
                <span class="text-2xl mb-2">📭</span>
                <p class="text-sm font-semibold text-text">No Profile Found</p>
                <p class="mt-1 text-xs text-text-dim">
                  The requested profile data is currently empty.
                </p>
              </div>
            </template>

            <!-- Error Slot -->
            <template #error="{ error }">
              <div class="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm">Failed to load</span>
                </div>
                <p class="mt-1 text-xs">{{ error }}</p>
                <button
                  class="mt-3 rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 cursor-pointer"
                  @click="simulateFetch('loaded')"
                >
                  Retry Request
                </button>
              </div>
            </template>
          </AGhostSkeleton>
        </div>

        <!-- Demo 2: Document-Clock Synchronized Shimmer & Hints -->
        <div class="rounded-xl border border-brand-border bg-surface p-6">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-text-dim">
              2 · Layout Hints & Standalone Boxes
            </h2>
            <span class="text-xs text-text-dim">Global Document Clock</span>
          </div>

          <div class="space-y-4">
            <div class="rounded-xl border border-brand-border/60 bg-surface-2 p-5">
              <h4 class="text-xs font-bold uppercase tracking-wider text-brand mb-2">
                &lt;AGhostSkeletonBox&gt; Primitives
              </h4>
              <p class="text-xs text-text-dim mb-3">
                Standalone shimmering bars sharing the exact same global document-clock phase:
              </p>
              <div class="space-y-2">
                <AGhostSkeletonBox width="100%" height="20px" radius="6px" />
                <AGhostSkeletonBox width="75%" height="16px" radius="4px" />
                <AGhostSkeletonBox width="45%" height="16px" radius="4px" />
              </div>
            </div>

            <div class="rounded-xl border border-brand-border/60 bg-surface-2 p-5">
              <h4 class="text-xs font-bold uppercase tracking-wider text-brand mb-2">
                DOM Hints: data-ask-block & data-ask-ignore
              </h4>
              <p class="text-xs text-text-dim mb-3">
                Annotate badges or decorative icons to customize how the DOM engine reads them:
              </p>
              <AGhostSkeleton :loading="isSimulating" :reveal="revealMode">
                <div
                  class="flex items-center justify-between rounded-lg bg-surface p-3 border border-brand-border/40"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-text">Pro Subscription</span>
                    <span
                      data-ask-block
                      class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400"
                    >
                      ACTIVE
                    </span>
                  </div>
                  <span data-ask-ignore class="text-xs text-text-dim"> Renews in 12 days </span>
                </div>
              </AGhostSkeleton>
            </div>
          </div>
        </div>
      </div>

      <!-- Demo 3: PostCard feed (chrome capture + theming) -->
      <div class="demo-post-skeleton mt-8 rounded-xl border border-brand-border bg-surface p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold uppercase tracking-wider text-text-dim">
              3 · Social feed · chrome capture + theme panel
            </h2>
            <p class="mt-1 text-xs text-text-dim">
              All controls below drive an
              <code class="rounded bg-surface-2 px-1">&lt;AGhostSkeletonProvider&gt;</code> that
              wraps the feed. Change any value and click <strong>Refresh feed</strong> — the bones
              should pick up the new theme live. Chrome bones still carry the consumer's own card
              paint so toggling <strong>debug</strong> lets you see which bones came from which
              source.
            </p>
          </div>
          <button
            class="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-medium text-bg cursor-pointer hover:opacity-90"
            @click="refreshFeed"
          >
            Refresh feed (1.6s)
          </button>
        </div>

        <!-- Theme panel -->
        <div
          class="mb-5 rounded-lg border border-brand-border/60 bg-surface-2 p-4 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4"
        >
          <label class="flex flex-col gap-1 text-xs text-text-dim">
            <span class="font-semibold uppercase tracking-wider">Mode</span>
            <select
              v-model="themeMode"
              class="rounded-md border border-brand-border bg-surface px-2 py-1 text-xs text-text"
            >
              <option value="light">light</option>
              <option value="dark">dark</option>
              <option value="system">system</option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-xs text-text-dim">
            <span class="font-semibold uppercase tracking-wider">Animation</span>
            <select
              v-model="themeAnimation"
              class="rounded-md border border-brand-border bg-surface px-2 py-1 text-xs text-text"
            >
              <option value="shimmer">shimmer</option>
              <option value="group-shimmer">group-shimmer</option>
              <option value="pulse">pulse</option>
              <option value="none">none</option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-xs text-text-dim">
            <span class="font-semibold uppercase tracking-wider">Speed</span>
            <select
              v-model="themeSpeed"
              class="rounded-md border border-brand-border bg-surface px-2 py-1 text-xs text-text"
            >
              <option value="slow">slow</option>
              <option value="fast">fast</option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-xs text-text-dim">
            <span class="font-semibold uppercase tracking-wider">Radius</span>
            <input
              v-model="themeRadius"
              type="text"
              class="rounded-md border border-brand-border bg-surface px-2 py-1 text-xs text-text font-mono"
              placeholder="6px"
            />
          </label>

          <label class="flex flex-col gap-1 text-xs text-text-dim">
            <span class="font-semibold uppercase tracking-wider">Light · base</span>
            <input
              v-model="themeBaseLight"
              type="color"
              class="h-7 rounded border border-brand-border bg-surface"
            />
          </label>

          <label class="flex flex-col gap-1 text-xs text-text-dim">
            <span class="font-semibold uppercase tracking-wider">Light · highlight</span>
            <input
              v-model="themeHighlightLight"
              type="color"
              class="h-7 rounded border border-brand-border bg-surface"
            />
          </label>

          <label class="flex flex-col gap-1 text-xs text-text-dim">
            <span class="font-semibold uppercase tracking-wider">Dark · base</span>
            <input
              v-model="themeBaseDark"
              type="color"
              class="h-7 rounded border border-brand-border bg-surface"
            />
          </label>

          <label class="flex items-center gap-2 text-xs text-text-dim mt-auto">
            <input v-model="themeDebug" type="checkbox" class="rounded border-brand-border" />
            <span class="font-semibold uppercase tracking-wider">Debug outlines</span>
          </label>
        </div>

        <AGhostSkeletonProvider
          :mode="themeMode"
          :theme="demoTheme"
          :debug="themeDebug"
          :reveal="revealMode"
        >
          <AGhostSkeleton id="demo-social-feed" :data="feed" :sample="SAMPLE_POSTS">
            <template #default="{ data }">
              <div class="flex flex-col gap-4 p-4 bg-gray-100">
                <PostCard v-for="post in data as Post[]" :key="post.id" :post="post" />
              </div>
            </template>
          </AGhostSkeleton>
        </AGhostSkeletonProvider>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Bones mimic the look of @alikhalilll/a-skeleton's `ASkeletonBlock` as used
 * in muslim-academy-platform's `PostCardSkeleton.vue`:
 *   - fill   `#d1d4dc`        → set via `--ask-base` inline on the wrapper
 *   - ring   `#a9afbc59`      → inset box-shadow, text + box only (see below)
 *   - radius plugin-computed  → text bars stay as per-line pill, media/box
 *                                inherit the real element's border-radius
 *
 * `:deep()` strips Vue's scope attribute so the selectors still match bones
 * `drawSkeleton` creates at runtime (which Vue never touches at compile time).
 *
 * Why only text + box get the ring:
 *   - text bars read cleaner with a faint outline, same as `a-skel-text-content`
 *   - box bones are generic rectangles (buttons, chips) — the ring reads as
 *     a subtle border on them, matching how `ASkeletonBlock` looks
 *   - media bones stand for icons / images / avatars — the ring makes them
 *     look like bordered boxes instead of filled shapes, which doesn't match
 *     the real icon (a circle-with-dots SVG, say) at all
 *   - chrome bones already carry the consumer's own border verbatim from
 *     `captureChrome`; stacking a ring on top double-draws the outline
 */
.demo-post-skeleton :deep([ask-rect='text']),
.demo-post-skeleton :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px #a9afbc59;
}
</style>
