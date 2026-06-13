<script setup lang="ts">
/**
 * Live demo for `<ASkeleton mode="clone">`.
 *
 * Design notes:
 *   - The card content is identical in shape to the existing pricing demo,
 *     but rendering is delegated to the clone engine — the slot mounts
 *     off-screen, the snapshot is taken once per re-render, and the replay
 *     paints over the (visibility-hidden) real mount.
 *   - The toggle flips `loading` only; no other state changes. The capture
 *     happens automatically on first mount and survives toggles.
 *   - The validator below this demo pairs every leaf in the real state with
 *     its replayed counterpart and asserts ±4 px on size + position.
 */
import { ref } from 'vue';

/* Start in the skeleton state so the docs lead with the loader, not the real
 * card. The clone engine still mounts the slot off-screen (visibility: hidden)
 * to capture geometry on first paint — the double-rAF in `<ASkeleton>` covers
 * the loading=true-on-mount case. */
const loading = ref(true);
const features = [
  'Unlimited projects + integrations',
  'Priority support, 4-hour SLA',
  'Team workspaces with SSO',
  'Audit log + advanced permissions',
];

const source = `<template>
  <ASkeleton mode="clone" :loading="loading">
    <div class="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
      <span class="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold
                   text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        RECOMMENDED
      </span>
      <h3 class="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Pro</h3>
      <p class="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        Everything in Starter, plus team workspaces, SSO, audit logs, and 4-hour support SLAs.
      </p>
      <div class="mt-6 flex items-baseline gap-1">
        <span class="text-4xl font-bold text-zinc-900 dark:text-zinc-50">$49</span>
        <span class="text-sm text-zinc-500 dark:text-zinc-400">/month</span>
      </div>
      <button class="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3
                     text-sm font-semibold text-white">Start free trial</button>
    </div>
  </ASkeleton>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · mode="clone" (comprehensive style capture)
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-3 flex gap-2 text-xs">
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="loading = !loading"
          >
            {{ loading ? 'Show real card' : 'Show skeleton' }}
          </button>
        </div>

        <div class="rounded-2xl bg-surface-2 p-6">
          <ASkeleton mode="clone" :loading="loading" cache-key="docs-clone-pricing">
            <div
              class="rounded-2xl bg-bg p-6 ring-1 ring-border"
              style="box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.18)"
            >
              <span
                class="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 font-semibold dark:bg-emerald-500/15 dark:text-emerald-300"
              >
                RECOMMENDED
              </span>
              <h3 class="mt-4 text-2xl font-bold text-text">Pro</h3>
              <p class="mt-1 text-sm leading-relaxed text-text-dim">
                Everything in Starter, plus team workspaces, SSO, audit logs, and 4-hour support
                SLAs.
              </p>
              <div class="mt-6 flex items-baseline gap-1">
                <span class="text-4xl font-bold text-text">$49</span>
                <span class="text-sm text-text-muted">/month</span>
              </div>
              <ul class="mt-6 text-sm space-y-2 text-text">
                <li v-for="f in features" :key="f" class="flex items-start gap-2">
                  <LucideIcon
                    name="check"
                    class="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400"
                  />
                  <span>{{ f }}</span>
                </li>
              </ul>
              <button
                class="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white font-semibold dark:bg-emerald-500"
                style="box-shadow: 0 8px 18px -8px rgba(5, 150, 105, 0.6)"
              >
                Start free trial
              </button>
            </div>
          </ASkeleton>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
