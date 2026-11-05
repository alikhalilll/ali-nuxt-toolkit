<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RevealMode } from '@alikhalilll/a-smart-skeleton';
import AppNav from '~/components/AppNav.vue';
import ShowcaseArticle from '~/components/showcases/ShowcaseArticle.vue';
import ShowcaseGallery from '~/components/showcases/ShowcaseGallery.vue';
import ShowcaseThread from '~/components/showcases/ShowcaseThread.vue';
import ShowcaseDashboard from '~/components/showcases/ShowcaseDashboard.vue';
import ShowcaseSettings from '~/components/showcases/ShowcaseSettings.vue';
import ShowcaseActivity from '~/components/showcases/ShowcaseActivity.vue';
import ShowcaseTrackPlayer from '~/components/showcases/ShowcaseTrackPlayer.vue';
import ShowcasePortfolio from '~/components/showcases/ShowcasePortfolio.vue';

/**
 * `/showcases` — gallery of 8 real-world demos, each wrapped in `<ASmartSkeleton>`
 * with a shared reveal selector and global document-clock shimmer synchronization.
 */

type BuiltinReveal = 'together' | 'sequence' | 'smart' | 'sweep';

const reveal = ref<RevealMode>('together');
const nonce = ref(0);

function reloadAll(): void {
  nonce.value += 1;
}

const REVEALS: Array<{ value: BuiltinReveal; label: string }> = [
  { value: 'together', label: 'together (crossfade)' },
  { value: 'sequence', label: 'sequence (cascading rows)' },
  { value: 'sweep', label: 'sweep (document-clock wave)' },
  { value: 'smart', label: 'smart (adaptive hold)' },
];

const headline = computed(() => `reveal: ${reveal.value}`);
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10">
    <AppNav />

    <header class="mb-8 flex flex-col gap-3">
      <h1 class="text-3xl font-bold">ASmartSkeleton showcases</h1>
      <p class="text-text-dim max-w-prose">
        Eight real-world loading states, each wrapped in <code>&lt;ASmartSkeleton&gt;</code>. The
        reveal selector controls how content replaces the skeleton when data resolves. Hit
        <strong>Reload all</strong> to re-trigger the loading states simultaneously and see the
        synchronized document-clock shimmer.
      </p>
    </header>

    <div
      class="sticky top-0 z-10 mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-brand-border bg-surface p-4 backdrop-blur"
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold uppercase tracking-wide text-text-dim"
          >Reveal Transition</span
        >
        <select
          v-model="reveal"
          class="min-w-[16rem] rounded-md border border-brand-border bg-surface-2 px-3 py-2 text-sm"
        >
          <option v-for="r in REVEALS" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </label>
      <button
        type="button"
        class="rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white cursor-pointer"
        @click="reloadAll"
      >
        Reload all
      </button>
      <p class="ml-auto text-xs text-text-dim">
        Active: <code>{{ headline }}</code>
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <section class="showcase-card">
        <h2 class="showcase-title">Loading article</h2>
        <ShowcaseArticle :reveal="reveal" :nonce="nonce" />
      </section>
      <section class="showcase-card">
        <h2 class="showcase-title">Loading gallery</h2>
        <ShowcaseGallery :reveal="reveal" :nonce="nonce" />
      </section>
      <section class="showcase-card xl:col-span-1 md:col-span-2">
        <h2 class="showcase-title">Loading thread</h2>
        <ShowcaseThread :reveal="reveal" :nonce="nonce" />
      </section>
      <section class="showcase-card">
        <h2 class="showcase-title">Loading dashboard</h2>
        <ShowcaseDashboard :reveal="reveal" :nonce="nonce" />
      </section>
      <section class="showcase-card">
        <h2 class="showcase-title">Loading settings</h2>
        <ShowcaseSettings :reveal="reveal" :nonce="nonce" />
      </section>
      <section class="showcase-card">
        <h2 class="showcase-title">Loading activity feed</h2>
        <ShowcaseActivity :reveal="reveal" :nonce="nonce" />
      </section>
      <section class="showcase-card md:col-span-2 xl:col-span-2">
        <h2 class="showcase-title">Loading track player</h2>
        <ShowcaseTrackPlayer :reveal="reveal" :nonce="nonce" />
      </section>
      <section class="showcase-card">
        <h2 class="showcase-title">Loading portfolio</h2>
        <ShowcasePortfolio :reveal="reveal" :nonce="nonce" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.showcase-card {
  border-radius: 1rem;
  border: 1px solid var(--ak-ui-color-brand-border, hsl(220 13% 20%));
  background: var(--ak-ui-color-surface, hsl(220 13% 10%));
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 14rem;
}
.showcase-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ak-ui-color-text-dim, hsl(220 10% 60%));
  margin: 0;
}
</style>
