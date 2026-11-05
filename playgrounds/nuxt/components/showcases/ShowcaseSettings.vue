<script setup lang="ts">
import type { RevealMode } from '@alikhalilll/a-smart-skeleton';

/**
 * **Loading settings** — skullet.lochie.me showcase #5.
 *
 * Vertical list of 3 toggle rows (label + inline toggle control).
 */
defineProps<{ reveal: RevealMode; nonce: number }>();

interface Setting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const SAMPLE: Setting[] = [
  { id: 'mentions', label: 'Mentions', description: 'Someone @-s you', enabled: true },
  { id: 'prs', label: 'Pull requests', description: 'New PRs on your repos', enabled: true },
  { id: 'digest', label: 'Weekly digest', description: 'Summary every Monday', enabled: false },
];

const { data } = useShowcaseData<Setting[]>(() => [
  { id: 'mentions', label: 'Mentions', description: 'Someone @-s you', enabled: true },
  { id: 'prs', label: 'Pull requests', description: 'New PRs on your repos', enabled: false },
  { id: 'digest', label: 'Weekly digest', description: 'Summary every Monday', enabled: true },
]);
</script>

<template>
  <ASmartSkeleton
    id="showcase-settings"
    :key="`settings-${nonce}`"
    :reveal="reveal"
    :data="data"
    :sample="SAMPLE"
    class="flex flex-col gap-3"
  >
    <template #default="{ data }">
      <div
        v-for="setting in data ?? []"
        :key="setting.id"
        class="flex items-center justify-between gap-4 rounded-lg bg-surface-2 p-3"
      >
        <div class="min-w-0">
          <p class="text-sm font-semibold">{{ setting.label }}</p>
          <p class="text-xs text-text-dim">{{ setting.description }}</p>
        </div>
        <button
          type="button"
          class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          :class="setting.enabled ? 'bg-brand-accent' : 'bg-surface-3'"
          :aria-pressed="setting.enabled"
        >
          <span
            class="absolute top-0.5 size-5 rounded-full bg-white transition-transform"
            :class="setting.enabled ? 'translate-x-5' : 'translate-x-0.5'"
          />
        </button>
      </div>
    </template>
  </ASmartSkeleton>
</template>
