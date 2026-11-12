<script setup lang="ts">
/**
 * Direction-aware animation demo.
 *
 * Two identical cards sit side by side. The left card's wrapper is `dir="ltr"`,
 * the right card's wrapper is `dir="rtl"`. Both mount at the same instant and
 * draw from the same provider — so viewers can watch the shimmer flow in
 * opposite directions simultaneously while every other property (speed, phase,
 * theme, bone layout) stays constant.
 *
 * The skeleton reads `getComputedStyle(root).direction` at measurement time and
 * flips three things in RTL: the bg-position keyframes on each bone, the sweep
 * reveal front, and the horizontal component of the `byPosition` sequence order.
 * There's no prop and no new custom property — the browser's own inherited
 * `direction` is the single source of truth.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useColorMode } from '~/composables/useColorMode';

const { isDark } = useColorMode();
const providerMode = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'));

const DEMO_THEME = {
  light: { base: '#d1d4dc', highlight: '#ffffff' },
  dark: { base: '#31363f', highlight: 'rgba(255,255,255,0.08)' },
};

const mounted = ref(false);
const replaying = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

function clear() {
  if (timer) clearTimeout(timer);
  timer = null;
}

function replay() {
  if (replaying.value) return;
  clear();
  replaying.value = true;
  mounted.value = false;
  timer = setTimeout(() => {
    mounted.value = true;
    replaying.value = false;
  }, 60);
}

onMounted(replay);
onBeforeUnmount(clear);

const code = `<script setup lang="ts">
// Two identical trees, one LTR, one RTL — the skeleton reads the inherited
// \`direction\` and flips the shimmer sweep + reveal + cascade to match.
\u003c/script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <section dir="ltr">
      <ASmartSkeleton :data="post" :sample="SAMPLE_POST">
        <PostCard :post="post" />
      </ASmartSkeleton>
    </section>

    <section dir="rtl">
      <ASmartSkeleton :data="post" :sample="SAMPLE_POST">
        <PostCard :post="post" />
      </ASmartSkeleton>
    </section>
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
            <span class="font-semibold text-text">Direction-aware shimmer</span>
            <span class="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-text-dim">
              <code>dir="ltr"</code> vs <code>dir="rtl"</code>
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
            <span>{{ replaying ? 'Remounting…' : 'Replay' }}</span>
          </button>
        </div>

        <!-- Stage -->
        <div class="mx-auto max-w-3xl">
          <div class="dsd rounded-xl border border-border bg-surface/50 p-4">
            <ASmartSkeletonProvider :mode="providerMode" :theme="DEMO_THEME">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <section dir="ltr" class="min-w-0">
                  <header class="mb-2 flex items-center justify-between text-[11px] text-text-dim">
                    <code class="font-semibold">dir="ltr"</code>
                    <span>reads left-to-right</span>
                  </header>
                  <div
                    class="min-h-[164px] overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                  >
                    <ASmartSkeleton
                      v-if="mounted"
                      id="dsd-ltr"
                      :data="null"
                      :sample="{ title: 'Lorem ipsum', body: 'Dolor sit amet.' }"
                      label="Loading card"
                    >
                      <template #default>
                        <article class="flex flex-col gap-2 p-4">
                          <div class="size-10 rounded-full bg-primary/20" />
                          <h4 class="text-sm font-semibold text-text">Lorem ipsum</h4>
                          <p class="text-xs text-text-dim">
                            Dolor sit amet, consectetur adipiscing elit. Nunc viverra.
                          </p>
                        </article>
                      </template>
                    </ASmartSkeleton>
                  </div>
                </section>

                <section dir="rtl" class="min-w-0">
                  <header class="mb-2 flex items-center justify-between text-[11px] text-text-dim">
                    <code class="font-semibold">dir="rtl"</code>
                    <span>reads right-to-left</span>
                  </header>
                  <div
                    class="min-h-[164px] overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                  >
                    <ASmartSkeleton
                      v-if="mounted"
                      id="dsd-rtl"
                      :data="null"
                      :sample="{ title: 'لوريم إيبسوم', body: 'دولور سيت أميت.' }"
                      label="جاري التحميل"
                    >
                      <template #default>
                        <article class="flex flex-col gap-2 p-4">
                          <div class="size-10 rounded-full bg-primary/20" />
                          <h4 class="text-sm font-semibold text-text">لوريم إيبسوم</h4>
                          <p class="text-xs text-text-dim">
                            دولور سيت أميت، كونسيكتيتور أدايبايسكينج إيليت. نونك فيفيرا.
                          </p>
                        </article>
                      </template>
                    </ASmartSkeleton>
                  </div>
                </section>
              </div>
            </ASmartSkeletonProvider>
          </div>

          <p class="mt-3 text-center text-[11px] text-text-dim">
            Same skeleton, same document clock, same provider. The only difference is the
            <code>dir</code> on the wrapper — and the shimmer sweep flips to match.
          </p>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>

<style scoped>
.dsd :deep([ask-rect='text']),
.dsd :deep([ask-rect='box']) {
  box-shadow: inset 0 0 0 1px rgb(169 175 188 / 0.35);
}
</style>
