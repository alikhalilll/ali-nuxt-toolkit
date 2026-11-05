<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RevealMode } from '@alikhalilll/a-smart-skeleton';

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
</script>

<template>
  <div class="min-h-screen bg-bg text-text">
    <div class="mx-auto max-w-5xl px-6 py-10">
      <AppNav />

      <!-- Hero Header -->
      <header class="mb-10">
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight">ASmartSkeleton Playground</h1>
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

          <ASmartSkeleton
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
          </ASmartSkeleton>
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
                &lt;ASmartSkeletonBox&gt; Primitives
              </h4>
              <p class="text-xs text-text-dim mb-3">
                Standalone shimmering bars sharing the exact same global document-clock phase:
              </p>
              <div class="space-y-2">
                <ASmartSkeletonBox width="100%" height="20px" radius="6px" />
                <ASmartSkeletonBox width="75%" height="16px" radius="4px" />
                <ASmartSkeletonBox width="45%" height="16px" radius="4px" />
              </div>
            </div>

            <div class="rounded-xl border border-brand-border/60 bg-surface-2 p-5">
              <h4 class="text-xs font-bold uppercase tracking-wider text-brand mb-2">
                DOM Hints: data-ask-block & data-ask-ignore
              </h4>
              <p class="text-xs text-text-dim mb-3">
                Annotate badges or decorative icons to customize how the DOM engine reads them:
              </p>
              <ASmartSkeleton :loading="isSimulating" :reveal="revealMode">
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
              </ASmartSkeleton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
