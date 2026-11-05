<script setup lang="ts">
/**
 * Author Hints Demo for ASmartSkeleton.
 *
 * Demonstrates:
 *   - ask-block / data-skeleton-block  (unifies complex inner markup into one solid bone)
 *   - ask-ignore / data-skeleton-ignore (preserves element layout while omitting skeleton bones)
 */
import { ref } from 'vue';

type HintOption = 'default' | 'block' | 'ignore';

const currentHint = ref<HintOption>('default');
const nonce = ref(0);

function pick(h: HintOption) {
  currentHint.value = h;
  nonce.value++;
}

const TAGS = ['TypeScript', 'Vue 3', 'Nuxt', 'Performance'];

const code = `<template>
  <ASmartSkeleton loading id="user-profile">
    <article class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-full bg-surface-2 font-bold">K</div>
          <div>
            <h4>Kai Takahashi</h4>
            <p>Lead UI Architect</p>
          </div>
        </div>

        <!-- ask-ignore: button space is reserved without an awkward bone -->
        <button class="btn" ask-ignore>
          Follow
        </button>
      </div>

      <!-- ask-block: renders the entire row of tags as one unified block -->
      <div class="flex gap-1.5" ask-block>
        <span v-for="t in TAGS" :key="t" class="tag">{{ t }}</span>
      </div>
    </article>
  </ASmartSkeleton>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- Hints selector toolbar -->
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="text-text-dim font-medium">Layout Hint:</span>
            <div class="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
              <button
                type="button"
                class="cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors"
                :class="
                  currentHint === 'default'
                    ? 'bg-surface font-semibold text-text shadow-sm'
                    : 'text-text-dim hover:text-text'
                "
                @click="pick('default')"
              >
                Default (Individual)
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors"
                :class="
                  currentHint === 'block'
                    ? 'bg-surface font-semibold text-text shadow-sm'
                    : 'text-text-dim hover:text-text'
                "
                @click="pick('block')"
              >
                ask-block
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors"
                :class="
                  currentHint === 'ignore'
                    ? 'bg-surface font-semibold text-text shadow-sm'
                    : 'text-text-dim hover:text-text'
                "
                @click="pick('ignore')"
              >
                ask-ignore
              </button>
            </div>
          </div>

          <span class="text-[11px] text-text-dim">
            {{
              currentHint === 'default'
                ? 'Each tag pill gets an individual measured bone.'
                : currentHint === 'block'
                  ? 'Tag group is drawn as one unified rectangular block.'
                  : 'Action button space is reserved with zero skeleton bones.'
            }}
          </span>
        </div>

        <!-- Live Card Stage -->
        <div class="mx-auto max-w-md">
          <div class="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <ASmartSkeleton
              :id="`demo-hints-${currentHint}`"
              :key="`hint-stage-${nonce}`"
              loading
              label="Loading author card"
            >
              <article class="flex flex-col gap-3.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold text-text"
                    >
                      K
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-text">Kai Takahashi</h4>
                      <p class="text-xs text-text-dim">Lead UI Architect</p>
                    </div>
                  </div>

                  <!-- Action button with potential ignore hint -->
                  <button
                    type="button"
                    class="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text"
                    :ask-ignore="currentHint === 'ignore' ? '' : undefined"
                    :data-skeleton-ignore="currentHint === 'ignore' ? '' : undefined"
                  >
                    Follow
                  </button>
                </div>

                <!-- Tags row with potential block hint -->
                <div
                  class="flex flex-wrap gap-1.5 pt-1"
                  :ask-block="currentHint === 'block' ? '' : undefined"
                  :data-skeleton-block="currentHint === 'block' ? '' : undefined"
                >
                  <span
                    v-for="t in TAGS"
                    :key="t"
                    class="rounded-full border border-border/80 bg-surface-2/60 px-2.5 py-1 text-[11px] font-medium text-text-dim"
                  >
                    {{ t }}
                  </span>
                </div>
              </article>
            </ASmartSkeleton>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
