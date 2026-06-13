<script setup lang="ts">
import { ref } from 'vue';

const loading = ref(true);

const source = `<template>
  <ASkeleton :loading="loading">
    <section class="relative overflow-hidden rounded-3xl
                    bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-600
                    px-6 pb-10 pt-16 md:px-12 md:pt-24">
      <!-- decorations — always rendered as chrome -->
      <svg data-skeleton-ignore class="absolute -left-16 -top-16
             h-80 w-80 text-white/15" viewBox="0 0 200 200"
             fill="currentColor" aria-hidden="true">
        <circle cx="100" cy="100" r="100" />
      </svg>
      <svg data-skeleton-ignore class="absolute -bottom-20 -right-16
             h-96 w-96 text-white/10" viewBox="0 0 200 200"
             fill="currentColor" aria-hidden="true">
        <circle cx="100" cy="100" r="100" />
      </svg>

      <div class="relative z-10 mx-auto max-w-3xl text-center">
        <span class="inline-block rounded-full bg-white/15
                     px-3 py-1 text-xs font-semibold text-white">NEW</span>

        <h1 class="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
          Build interfaces your users
          <span class="text-amber-300">actually love</span>
        </h1>

        <p class="mx-auto mt-5 max-w-xl text-sm leading-relaxed
                   text-white/85 md:text-base">
          Ship polished, accessible UI in days — not months. A starting
          point for every team, not a museum.
        </p>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button class="rounded-xl bg-white px-6 py-3 text-sm
                         font-semibold text-violet-700 shadow-lg">
            Start free trial
          </button>
          <button class="rounded-xl border border-white/60
                         bg-transparent px-6 py-3 text-sm
                         font-semibold text-white">
            Watch the demo
          </button>
        </div>

        <div class="mt-12 grid grid-cols-1 gap-4
                     text-sm text-white/90 md:grid-cols-3">
          <div class="flex items-center justify-center gap-2">
            <LucideIcon name="rocket" class="size-5" />
            <span>Setup in minutes</span>
          </div>
          <div class="flex items-center justify-center gap-2">
            <LucideIcon name="bar-chart-3" class="size-5" />
            <span>Used by 12,000+ teams</span>
          </div>
          <div class="flex items-center justify-center gap-2">
            <LucideIcon name="shield-check" class="size-5" />
            <span>SOC 2 compliant</span>
          </div>
        </div>

        <div class="mt-12 h-56 w-full rounded-2xl
                     bg-white/15 ring-1 ring-white/30 md:h-72" />
      </div>
    </section>
  </ASkeleton>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · complex hero
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-3 flex gap-2 text-xs">
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="loading = !loading"
          >
            {{ loading ? 'Show real hero' : 'Show skeleton' }}
          </button>
        </div>

        <ASkeleton :loading="loading">
          <section
            class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-600 px-6 pb-10 pt-16 md:px-12 md:pt-24"
          >
            <svg
              data-skeleton-ignore
              class="absolute -left-16 -top-16 h-80 w-80 text-white/15"
              viewBox="0 0 200 200"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="100" />
            </svg>
            <svg
              data-skeleton-ignore
              class="-right-16 absolute -bottom-20 h-96 w-96 text-white/10"
              viewBox="0 0 200 200"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="100" />
            </svg>

            <div class="relative z-10 mx-auto max-w-3xl text-center">
              <span
                class="inline-block rounded-full bg-white/15 px-3 py-1 text-xs text-white font-semibold"
              >
                NEW
              </span>

              <h1 class="mt-6 text-4xl text-white font-bold leading-tight md:text-5xl">
                Build interfaces your users
                <span class="text-amber-300">actually love</span>
              </h1>

              <p class="mx-auto mt-5 max-w-xl text-sm text-white/85 leading-relaxed md:text-base">
                Ship polished, accessible UI in days — not months. A starting point for every team,
                not a museum.
              </p>

              <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  class="rounded-xl bg-white px-6 py-3 text-sm text-violet-700 font-semibold"
                  style="box-shadow: 0 10px 30px -10px rgba(255, 255, 255, 0.55)"
                >
                  Start free trial
                </button>
                <button
                  class="rounded-xl border border-white/60 bg-transparent px-6 py-3 text-sm text-white font-semibold"
                >
                  Watch the demo
                </button>
              </div>

              <div class="mt-12 grid grid-cols-1 gap-4 text-sm text-white/90 md:grid-cols-3">
                <div class="flex items-center justify-center gap-2">
                  <LucideIcon name="rocket" class="size-5" />
                  <span>Setup in minutes</span>
                </div>
                <div class="flex items-center justify-center gap-2">
                  <LucideIcon name="bar-chart-3" class="size-5" />
                  <span>Used by 12,000+ teams</span>
                </div>
                <div class="flex items-center justify-center gap-2">
                  <LucideIcon name="shield-check" class="size-5" />
                  <span>SOC 2 compliant</span>
                </div>
              </div>

              <div class="mt-12 h-56 w-full rounded-2xl bg-white/15 ring-1 ring-white/30 md:h-72" />
            </div>
          </section>
        </ASkeleton>
      </div>
    </DemoTabs>
  </div>
</template>
