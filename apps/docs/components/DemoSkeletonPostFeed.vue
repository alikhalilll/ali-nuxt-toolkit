<script setup lang="ts">
/**
 * Main hero demo for ASmartSkeleton on the docs site.
 *
 * Layout:
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ ● state        feed metadata chips          [⚙] [⟲ Refresh]│  status strip
 *   ├───────────────────────────────────────────────────────────┤
 *   │ REVEAL  ( smart · together · sequence · sweep · instant )  │  primary pills
 *   │ MOTION  ( Shimmer · Group · Pulse · None )  ( slow · fast )│
 *   ├───────────────────────────────────────────────────────────┤  (expanded via ⚙)
 *   │ Radius [ 6px ]  Light [●] Highlight [●] Dark [●]  [Reset]  │
 *   │ ☐ Debug outlines                                           │
 *   ├───────────────────────────────────────────────────────────┤
 *   │ 〈 three PostCard instances — chrome-captured feed 〉       │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Mode is NOT a control: the demo tracks the docs' own `html.dark` toggle
 * via a MutationObserver so flipping the site theme retints the whole demo
 * (including the PostCards via scoped `:deep()` and the plugin's own bones
 * via the provider).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import PostCard from './PostCardDemo/PostCard.vue';

// --- Docs theme tracking -----------------------------------------------
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

// --- Data --------------------------------------------------------------
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
const isLoading = ref(false);
const revealCount = ref(0);

function refreshFeed() {
  isLoading.value = true;
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
    isLoading.value = false;
    revealCount.value++;
  }, 1600);
}

// --- Provider plumbing -------------------------------------------------
type Anim = 'shimmer' | 'group-shimmer' | 'pulse' | 'none';
type Speed = 'slow' | 'fast';
type Reveal = 'together' | 'sequence' | 'smart' | 'sweep' | 'instant';

const DEFAULTS = {
  animation: 'shimmer' as Anim,
  speed: 'slow' as Speed,
  reveal: 'smart' as Reveal,
  baseLight: '#d1d4dc',
  highlightLight: '#ffffff',
  baseDark: '#31363f',
  highlightDark: 'rgba(255,255,255,0.08)',
  debug: false,
};

const themeAnimation = ref<Anim>(DEFAULTS.animation);
const themeSpeed = ref<Speed>(DEFAULTS.speed);
const revealMode = ref<Reveal>(DEFAULTS.reveal);
const themeBaseLight = ref(DEFAULTS.baseLight);
const themeHighlightLight = ref(DEFAULTS.highlightLight);
const themeBaseDark = ref(DEFAULTS.baseDark);
const themeHighlightDark = ref(DEFAULTS.highlightDark);
const themeDebug = ref(DEFAULTS.debug);

const providerMode = computed<'light' | 'dark'>(() => (docsIsDark.value ? 'dark' : 'light'));

const demoTheme = computed(() => ({
  light: { base: themeBaseLight.value, highlight: themeHighlightLight.value },
  dark: { base: themeBaseDark.value, highlight: themeHighlightDark.value },
  animation: themeAnimation.value,
  speed: themeSpeed.value,
}));

function resetTheme() {
  themeAnimation.value = DEFAULTS.animation;
  themeSpeed.value = DEFAULTS.speed;
  revealMode.value = DEFAULTS.reveal;
  themeBaseLight.value = DEFAULTS.baseLight;
  themeHighlightLight.value = DEFAULTS.highlightLight;
  themeBaseDark.value = DEFAULTS.baseDark;
  themeHighlightDark.value = DEFAULTS.highlightDark;
  themeDebug.value = DEFAULTS.debug;
}

const ANIMS: Anim[] = ['shimmer', 'group-shimmer', 'pulse', 'none'];
const SPEEDS: Speed[] = ['slow', 'fast'];
const REVEALS: Reveal[] = ['smart', 'together', 'sequence', 'sweep', 'instant'];
const ANIM_LABEL: Record<Anim, string> = {
  shimmer: 'Shimmer',
  'group-shimmer': 'Group',
  pulse: 'Pulse',
  none: 'None',
};

// --- One-liner helpers describing the current pick --------------------
const REVEAL_HELP: Record<Reveal, string> = {
  smart: 'Instant if it loads fast, crossfade otherwise',
  together: 'Simple crossfade',
  sequence: 'Staggered top-to-bottom cascade',
  sweep: 'Highlight sweeps across as content takes over',
  instant: 'No transition, snap in',
};
const ANIM_HELP: Record<Anim, string> = {
  shimmer: 'A single sweep across the whole page',
  'group-shimmer': 'Each skeleton gets its own local sweep',
  pulse: 'Opacity fades in and out',
  none: 'Static — placeholders hold still',
};

const revealHelp = computed(() => REVEAL_HELP[revealMode.value]);
const animHelp = computed(() => ANIM_HELP[themeAnimation.value]);

// --- Status strip ------------------------------------------------------
const statusLabel = computed(() => {
  if (isLoading.value) return 'Measuring skeleton geometry…';
  if (revealCount.value === 0) return 'Ready — hit Refresh to see the capture';
  return 'Live feed · reveal complete';
});

const postCount = computed(() => feed.value?.length ?? 0);

// --- Advanced panel toggle --------------------------------------------
const showAdvanced = ref(false);
</script>

<template>
  <DemoStage caption="Chrome capture · split sub-components · live theming" :center="false">
    <div class="pf" :class="{ 'pf--busy': isLoading }">
      <!-- ========================================================= -->
      <!--  Status strip — state + metadata + primary actions        -->
      <!-- ========================================================= -->
      <header class="pf-head">
        <div class="pf-head__state">
          <span class="pf-head__dot" aria-hidden="true" />
          <span class="pf-head__label">{{ statusLabel }}</span>
          <span class="pf-head__meta">
            <span class="pf-chip">{{ postCount }} posts</span>
            <span class="pf-chip pf-chip--ghost">chrome-captured</span>
          </span>
        </div>

        <div class="pf-head__actions">
          <button
            type="button"
            class="pf-icon"
            :class="{ 'pf-icon--active': showAdvanced }"
            :aria-pressed="showAdvanced"
            :aria-expanded="showAdvanced"
            aria-controls="pf-advanced"
            title="Advanced settings"
            @click="showAdvanced = !showAdvanced"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.19.3.49.52.84.65a1.65 1.65 0 0 0 .67.11H21a2 2 0 0 1 0 4h-.09c-.67 0-1.28.4-1.51 1Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            class="pf-cta"
            :disabled="isLoading"
            :aria-busy="isLoading"
            @click="refreshFeed"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              :class="{ 'pf-cta__icon--spin': isLoading }"
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
            <kbd class="pf-cta__kbd">1.6s</kbd>
          </button>
        </div>
      </header>

      <!-- ========================================================= -->
      <!--  Primary controls — Reveal + Motion                       -->
      <!-- ========================================================= -->
      <div class="pf-ctrl">
        <div class="pf-ctrl__row">
          <span class="pf-ctrl__label">Reveal</span>
          <div class="pf-pills" role="group" aria-label="Reveal mode">
            <button
              v-for="opt in REVEALS"
              :key="opt"
              type="button"
              class="pf-pills__pill"
              :class="{ 'pf-pills__pill--active': revealMode === opt }"
              :aria-pressed="revealMode === opt"
              :title="REVEAL_HELP[opt]"
              @click="revealMode = opt"
            >
              {{ opt }}
            </button>
          </div>
          <span class="pf-ctrl__hint">{{ revealHelp }}</span>
        </div>

        <div class="pf-ctrl__row">
          <span class="pf-ctrl__label">Motion</span>
          <div class="pf-pills" role="group" aria-label="Animation">
            <button
              v-for="opt in ANIMS"
              :key="opt"
              type="button"
              class="pf-pills__pill"
              :class="{ 'pf-pills__pill--active': themeAnimation === opt }"
              :aria-pressed="themeAnimation === opt"
              :title="ANIM_HELP[opt]"
              @click="themeAnimation = opt"
            >
              {{ ANIM_LABEL[opt] }}
            </button>
          </div>
          <div class="pf-pills pf-pills--muted" role="group" aria-label="Speed">
            <button
              v-for="opt in SPEEDS"
              :key="opt"
              type="button"
              class="pf-pills__pill"
              :class="{ 'pf-pills__pill--active': themeSpeed === opt }"
              :aria-pressed="themeSpeed === opt"
              :title="`Loop at ${opt} tempo`"
              @click="themeSpeed = opt"
            >
              {{ opt }}
            </button>
          </div>
          <span class="pf-ctrl__hint">{{ animHelp }}</span>
        </div>
      </div>

      <!-- ========================================================= -->
      <!--  Advanced panel — opens from the ⚙ in the status strip    -->
      <!-- ========================================================= -->
      <Transition name="pf-accordion">
        <div v-if="showAdvanced" id="pf-advanced" class="pf-adv">
          <div class="pf-adv__row">
            <!-- Only colours live here now. Radius was removed — in this demo
                 it only retints text-bar corners (barely visible) and the
                 default already picks a sensible per-bar radius from the text
                 height. See Theming → CSS variables in the docs for the full
                 variable list. -->

            <div class="pf-field pf-field--swatch">
              <span>Light · base</span>
              <label class="pf-chip-color" :style="{ background: themeBaseLight }">
                <input v-model="themeBaseLight" type="color" aria-label="Light base" />
              </label>
              <input
                v-model="themeBaseLight"
                type="text"
                class="pf-field__input pf-field__input--mono pf-field__input--hex"
                aria-label="Light base hex"
              />
            </div>

            <div class="pf-field pf-field--swatch">
              <span>Highlight</span>
              <label class="pf-chip-color" :style="{ background: themeHighlightLight }">
                <input v-model="themeHighlightLight" type="color" aria-label="Highlight" />
              </label>
              <input
                v-model="themeHighlightLight"
                type="text"
                class="pf-field__input pf-field__input--mono pf-field__input--hex"
                aria-label="Highlight hex"
              />
            </div>

            <div class="pf-field pf-field--swatch">
              <span>Dark · base</span>
              <label class="pf-chip-color" :style="{ background: themeBaseDark }">
                <input v-model="themeBaseDark" type="color" aria-label="Dark base" />
              </label>
              <input
                v-model="themeBaseDark"
                type="text"
                class="pf-field__input pf-field__input--mono pf-field__input--hex"
                aria-label="Dark base hex"
              />
            </div>
          </div>

          <div class="pf-adv__row pf-adv__row--end">
            <label class="pf-check">
              <input v-model="themeDebug" type="checkbox" />
              <span>Debug outlines</span>
            </label>

            <button type="button" class="pf-btn-ghost" @click="resetTheme">Reset</button>
          </div>
        </div>
      </Transition>

      <!-- ========================================================= -->
      <!--  Feed stage                                               -->
      <!-- ========================================================= -->
      <div class="pf-stage">
        <ASmartSkeletonProvider
          :mode="providerMode"
          :theme="demoTheme"
          :debug="themeDebug"
          :reveal="revealMode"
        >
          <ASmartSkeleton id="docs-demo-social-feed" :data="feed" :sample="SAMPLE_POSTS">
            <template #default="{ data }">
              <div class="pf-stage__list">
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
/* ====================================================================
 * Shell
 * ================================================================ */
.pf {
  display: grid;
  gap: 10px;
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  font-size: 13px;
  color: var(--color-text);
}

/* ====================================================================
 * Status strip
 * ================================================================ */
.pf-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 1px 0 var(--color-border-soft);
}

.pf-head__state {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.pf-head__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-brand-2) 90%, transparent);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-brand-2) 20%, transparent);
  transition: background 0.2s;
}
.pf--busy .pf-head__dot {
  background: color-mix(in oklab, #f59e0b 90%, transparent);
  box-shadow: 0 0 0 4px color-mix(in oklab, #f59e0b 20%, transparent);
  animation: pf-pulse 1.1s ease-in-out infinite;
}
@keyframes pf-pulse {
  50% {
    transform: scale(1.3);
  }
}

.pf-head__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.pf-head__meta {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pf-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text-dim);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
}
.pf-chip--ghost {
  color: color-mix(in oklab, var(--color-brand) 85%, var(--color-text-dim));
  background: color-mix(in oklab, var(--color-brand) 8%, var(--color-bg));
  border-color: color-mix(in oklab, var(--color-brand) 30%, var(--color-border));
}

.pf-head__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* --- Primary CTA ---------------------------------------------------- */
.pf-cta {
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
    transform 0.08s,
    filter 0.12s;
}
.pf-cta:hover {
  filter: brightness(1.05);
}
.pf-cta:active {
  transform: translateY(1px);
}
.pf-cta:disabled {
  opacity: 0.7;
  cursor: progress;
}
.pf-cta svg {
  width: 14px;
  height: 14px;
}
.pf-cta__icon--spin {
  animation: pf-spin 0.9s linear infinite;
}
@keyframes pf-spin {
  to {
    transform: rotate(360deg);
  }
}
.pf-cta__kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 10px;
  color: rgb(255 255 255 / 0.85);
  background: rgb(255 255 255 / 0.18);
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 4px;
}

/* --- Icon button ---------------------------------------------------- */
.pf-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-dim);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s,
    border-color 0.12s;
}
.pf-icon:hover {
  color: var(--color-text);
  background: var(--color-surface);
}
.pf-icon--active {
  color: var(--color-brand);
  border-color: color-mix(in oklab, var(--color-brand) 40%, var(--color-border));
  background: color-mix(in oklab, var(--color-brand) 10%, var(--color-bg));
}
.pf-icon svg {
  width: 15px;
  height: 15px;
}

/* ====================================================================
 * Primary controls — Reveal + Motion rows
 * ================================================================ */
.pf-ctrl {
  display: grid;
  gap: 1px;
  padding: 0;
  background: var(--color-border);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 0 var(--color-border-soft);
}

.pf-ctrl__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  background: var(--color-surface);
  flex-wrap: wrap;
}

.pf-ctrl__label {
  flex: 0 0 70px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
}

/* One-liner describing the currently-selected option — updates on every
 * pill click so visitors immediately learn what each mode does without
 * digging into the docs. */
.pf-ctrl__hint {
  flex: 1 1 100%;
  order: 10;
  font-size: 11.5px;
  color: var(--color-text-dim);
  padding-left: 80px;
  font-style: italic;
  opacity: 0.85;
}
@media (min-width: 720px) {
  .pf-ctrl__hint {
    flex: 1 1 auto;
    order: unset;
    padding-left: 0;
    padding-right: 4px;
    text-align: right;
    font-style: normal;
  }
}

.pf-pills {
  display: inline-flex;
  padding: 3px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
}
.pf-pills--muted {
  padding: 2px;
}

.pf-pills__pill {
  appearance: none;
  padding: 4px 10px;
  font: inherit;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-text-dim);
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s;
  text-transform: capitalize;
}
.pf-pills__pill:hover {
  color: var(--color-text);
}
.pf-pills__pill--active {
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow:
    0 1px 0 var(--color-border-soft),
    inset 0 0 0 1px var(--color-border);
}
.pf-pills--muted .pf-pills__pill {
  padding: 3px 9px;
  font-size: 11px;
}

/* ====================================================================
 * Advanced panel — radius + colour swatches + debug + reset
 * ================================================================ */
.pf-adv {
  display: grid;
  gap: 12px;
  padding: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 1px 0 var(--color-border-soft);
}

.pf-adv__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.pf-adv__row--end {
  justify-content: space-between;
}

.pf-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  min-width: 0;
}
.pf-field > span {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
  white-space: nowrap;
}
.pf-field--swatch {
  padding-right: 8px;
}

.pf-field__input {
  min-width: 0;
  width: 100%;
  padding: 2px 4px;
  font: inherit;
  font-size: 12px;
  color: var(--color-text);
  background: transparent;
  border: 0;
  outline: none;
}
.pf-field__input--mono {
  font-family: var(--font-mono, ui-monospace, monospace);
  text-transform: lowercase;
}
.pf-field__input--hex {
  width: 88px;
}

.pf-chip-color {
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px var(--color-border),
    inset 0 0 0 2px var(--color-bg);
  overflow: hidden;
  flex: 0 0 auto;
}
.pf-chip-color input[type='color'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
}

.pf-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-dim);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
}
.pf-check:hover {
  color: var(--color-text);
}
.pf-check input {
  accent-color: var(--color-brand);
}

.pf-btn-ghost {
  padding: 6px 14px;
  font: inherit;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-dim);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s;
}
.pf-btn-ghost:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

/* Accordion transition on the advanced panel */
.pf-accordion-enter-active,
.pf-accordion-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.2s ease,
    max-height 0.22s ease;
  overflow: hidden;
}
.pf-accordion-enter-from,
.pf-accordion-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-4px);
}
.pf-accordion-enter-to,
.pf-accordion-leave-from {
  opacity: 1;
  max-height: 260px;
}

/* ====================================================================
 * Feed stage
 * ================================================================ */
.pf-stage {
  padding: 18px;
  background: color-mix(in oklab, var(--color-surface-2) 70%, var(--color-bg));
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.pf-stage__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* PostCardDemo mirrors the real production card (`bg-white` + `border-[#EDF0F3]`
 * + `text-gray-800`). We retint via `:deep()` so chrome capture snapshots the
 * live docs palette — flip the site theme and the skeleton's chrome bones
 * follow. */
.pf :deep(article) {
  background: var(--color-bg);
  border-color: var(--color-border) !important;
  color: var(--color-text);
}
.pf :deep(article p),
.pf :deep(article span),
.pf :deep(article button) {
  color: inherit;
}
.pf :deep(article .text-gray-900),
.pf :deep(article .text-gray-800) {
  color: var(--color-text);
}
.pf :deep(article .text-gray-500),
.pf :deep(article .text-gray-600),
.pf :deep(article .text-gray-400) {
  color: var(--color-text-dim);
}
.pf :deep(article footer) {
  border-top-color: var(--color-border) !important;
}

/* Bone styling — handcrafted ASkeletonBlock look on placeholder bones */
.pf :deep([ask-rect='text']),
.pf :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
