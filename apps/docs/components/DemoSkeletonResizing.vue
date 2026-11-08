<script setup lang="ts">
/**
 * Resizing demo — showcases height continuity when the skeleton guessed the
 * wrong shape.
 *
 * The sample is a two-line placeholder post. When the viewer picks "Short",
 * "Medium", or "Tall", a real post with wildly different body length loads
 * in. The `<ASmartSkeleton>` parent eases its height between the outgoing
 * skeleton's measured box and the incoming content's live box over
 * `RESIZE_DURATION` (280 ms) with `cubic-bezier(0.2, 0, 0, 1)` — so the
 * frame around the swap never snaps, even when the two shapes disagree
 * by 400+ px.
 *
 * Mechanism (shared with every `<ASmartSkeleton>` surface):
 *   1. `fadeOut()` takes the skeleton pane out of flow with `position: absolute`.
 *   2. The incoming content pane claims the natural height for a tick.
 *   3. `resize(parent, box)` animates the parent's `height` from the
 *      skeleton's original box height to the new content height.
 *   4. `overflow: clip` prevents the shrinking frame from exposing the
 *      descending pane beneath; `box-sizing: border-box` keeps padding math
 *      consistent with any border.
 *
 * Reduced-motion visitors see a snap — the only gate on the height ease.
 */
import { computed, ref } from 'vue';
import { useColorMode } from '~/composables/useColorMode';

const { isDark } = useColorMode();
const providerMode = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'));

const DEMO_THEME = {
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
};

type Shape = 'short' | 'medium' | 'tall';

interface Note {
  id: string;
  author: string;
  body: string;
  tag: Shape;
}

const SAMPLE: Note = {
  id: 'sample',
  author: 'Sample author',
  tag: 'medium',
  body: 'This two-line sample is what the first skeleton measures from — one representative shape, no tricks.',
};

const REAL: Record<Shape, Note> = {
  short: {
    id: 'real-short',
    author: 'Mila Chen',
    tag: 'short',
    body: 'Shipped.',
  },
  medium: {
    id: 'real-medium',
    author: 'Mila Chen',
    tag: 'medium',
    body: 'Rolled the new tokens into the design system today. One migration file, zero visual regressions in the preview deploy, and the review PR is up — grab it when you have a moment.',
  },
  tall: {
    id: 'real-tall',
    author: 'Mila Chen',
    tag: 'tall',
    body: `A note from the retro, in case you missed it on Thursday. We agreed to pin the render-path refactor until after the mobile cut — the risk of touching layout code during a release freeze was the biggest objection on the call, and nobody argued the other side. The follow-up: move the three open PRs into a staging branch, keep CI green on it, and pick it back up the first Monday after the freeze lifts. If you want context, the thread in #platform-weekly has the timing argument + a link to Tobi's tracelog from the last attempt. Short version: the paint-blocking regressions we saw the last two times came from the same place, and we think we can land a fix for that first in isolation.`,
  },
};

// `data` is null while loading, an IPost shape once the shaped body arrives.
// `shape` tracks what the viewer last asked for, so the header chip stays
// in sync with the pending request.
const data = ref<Note | null>(null);
const shape = ref<Shape>('medium');
const loading = ref(false);

async function loadShape(next: Shape) {
  if (loading.value) return;
  shape.value = next;
  data.value = null;
  loading.value = true;
  // 450 ms is comfortably past `SKELETON_DELAY` (150 ms), so `smart` doesn't
  // treat the arrival as a flash and skip the content fade. The height
  // eases either way — reduced-motion is the only gate on it — but keeping
  // the content fade in play makes the demo read as a natural reveal.
  await new Promise((resolve) => setTimeout(resolve, 450));
  data.value = REAL[next];
  loading.value = false;
}

const activeShape = computed<Shape>(() => (data.value ? data.value.tag : shape.value));

const code = `<script setup lang="ts">
import { ref } from 'vue';

const data = ref<Note | null>(null);
const SAMPLE: Note = {
  id: 'sample',
  author: 'Sample author',
  body: 'This two-line sample is what the first skeleton measures from — one representative shape.',
};

async function loadShape(shape: 'short' | 'medium' | 'tall') {
  data.value = null;
  await fetchNote(shape).then((note) => (data.value = note));
}
\u003c/script>

<template>
  <!-- \`reveal\` left at the default (\`smart\`). Even when \`smart\` picks
       \`instant\` for a <150ms fetch, the parent's height still eases
       between the two shapes — continuity is independent of the fade. -->
  <ASmartSkeletonProvider
    mode="system"
    :theme="{
      light: { base: '#d1d4dc', highlight: '#ffffff' },
      dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
    }"
    reveal="smart"
  >
    <ASmartSkeleton id="docs-resizing" :data="data" :sample="SAMPLE">
      <template #default="{ data }">
        <article>
          <h3>{{ data.author }}</h3>
          <p>{{ data.body }}</p>
        </article>
      </template>
    </ASmartSkeleton>
  </ASmartSkeletonProvider>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- Header row -->
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold text-text">Resizing</span>
            <span class="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-text-dim">
              <code>:data="note" :sample="SAMPLE"</code>
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-text-dim">load:</span>
            <div class="inline-flex rounded-lg border border-border bg-surface p-0.5">
              <button
                v-for="opt in ['short', 'medium', 'tall'] as const"
                :key="opt"
                type="button"
                class="cursor-pointer rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  activeShape === opt && !loading
                    ? 'bg-primary text-white'
                    : 'text-text hover:bg-surface-2'
                "
                :disabled="loading"
                @click="loadShape(opt)"
              >
                {{ opt }}
              </button>
            </div>
            <span
              v-if="loading"
              class="inline-flex size-2 animate-ping rounded-full bg-amber-400"
            />
          </div>
        </div>

        <!-- Stage -->
        <div class="mx-auto max-w-md">
          <div class="dsr overflow-hidden rounded-xl border border-border bg-surface/50 p-3">
            <ASmartSkeletonProvider :mode="providerMode" :theme="DEMO_THEME" reveal="smart">
              <ASmartSkeleton id="docs-resizing" :data="data" :sample="SAMPLE">
                <template #default="{ data }">
                  <article class="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <h3 class="mb-2 text-sm font-semibold text-text">
                      {{ (data as Note).author }}
                    </h3>
                    <p class="text-sm leading-relaxed text-text-dim">
                      {{ (data as Note).body }}
                    </p>
                  </article>
                </template>
              </ASmartSkeleton>
            </ASmartSkeletonProvider>
          </div>
          <p class="mt-3 text-center text-[11px] text-text-dim">
            Watch the card frame: the height eases to the new body length instead of snapping, even
            when <code>short</code> swaps for <code>tall</code>.
          </p>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>

<style scoped>
.dsr :deep([ask-rect='text']),
.dsr :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
