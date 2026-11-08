<script setup lang="ts">
/**
 * Multi-card shimmer-sync demo.
 *
 * Mounts a 3×2 grid of lightweight skeleton cards with staggered 180 ms
 * timers so each one appears a beat after the last. The wave running
 * across every bone is driven by the document clock (see `shimmer.ts` →
 * `startTime = 0`), so all six cards share one continuous sweep — a card
 * mounted at t=0 and another mounted at t=720 ms land at the exact same
 * phase in the next tick.
 *
 * The "Stagger mount" button re-plays the sequence so viewers can see
 * the sync hold up under fresh, out-of-phase mounts.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useColorMode } from '~/composables/useColorMode';

const { isDark } = useColorMode();
const providerMode = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'));

const DEMO_THEME = {
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
};

const CARD_COUNT = 6;
const STAGGER_MS = 180;

const mounted = ref<boolean[]>(Array(CARD_COUNT).fill(false));
const replaying = ref(false);
let timers: ReturnType<typeof setTimeout>[] = [];

function clear() {
  for (const t of timers) clearTimeout(t);
  timers = [];
}

function replay() {
  if (replaying.value) return;
  clear();
  replaying.value = true;
  mounted.value = Array(CARD_COUNT).fill(false);
  for (let i = 0; i < CARD_COUNT; i++) {
    timers.push(
      setTimeout(() => {
        mounted.value = mounted.value.map((v, index) => (index === i ? true : v));
        if (i === CARD_COUNT - 1) replaying.value = false;
      }, i * STAGGER_MS)
    );
  }
}

onMounted(replay);
onBeforeUnmount(clear);

const code = `<script setup lang="ts">
// Six cards mount 180 ms apart — each `<ASmartSkeleton>` draws its own
// bones, but every bone shares one document-clock sweep. The result:
// every skeleton on the page shimmers in phase, even as cards mount
// at different times (paginated feeds, async grid cells, etc.).
<\/script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    <ASmartSkeleton
      v-for="card in cards"
      :key="card.id"
      :id="\`grid-\${card.id}\`"
      :data="null"
      :sample="SAMPLE_CARD"
    >
      <template #default>
        <GridCard />
      </template>
    </ASmartSkeleton>
  </div>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- Header -->
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold text-text">Multi-card shimmer sync</span>
            <span class="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-text-dim">
              <code>mount stagger: {{ STAGGER_MS }} ms</code>
            </span>
          </div>

          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-sm transition-all hover:bg-surface-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="replaying"
            @click="replay"
          >
            <span
              class="size-2 rounded-full"
              :class="replaying ? 'bg-amber-400 animate-ping' : 'bg-primary'"
            />
            <span>{{ replaying ? 'Mounting…' : 'Stagger mount' }}</span>
          </button>
        </div>

        <!-- Stage -->
        <div class="mx-auto max-w-2xl">
          <div class="dss rounded-xl border border-border bg-surface/50 p-4">
            <ASmartSkeletonProvider :mode="providerMode" :theme="DEMO_THEME">
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div
                  v-for="(isMounted, i) in mounted"
                  :key="i"
                  class="min-h-[132px] overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                >
                  <ASmartSkeleton
                    v-if="isMounted"
                    :id="`dss-card-${i}`"
                    :data="null"
                    :sample="{ title: 'Lorem ipsum', note: 'Cards mount staggered.' }"
                    label="Loading card"
                  >
                    <template #default>
                      <article class="flex flex-col gap-2 p-4">
                        <div class="size-10 rounded-full bg-primary/20" />
                        <h4 class="text-sm font-semibold text-text">Lorem ipsum</h4>
                        <p class="text-xs text-text-dim">Cards mount staggered.</p>
                      </article>
                    </template>
                  </ASmartSkeleton>
                </div>
              </div>
            </ASmartSkeletonProvider>
          </div>

          <p class="mt-3 text-center text-[11px] text-text-dim">
            Six cards, mounted 180 ms apart. Every bone shares the same document-clock sweep —
            nothing resets, nothing pops in out of phase.
          </p>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>

<style scoped>
.dss :deep([ask-rect='text']),
.dss :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
