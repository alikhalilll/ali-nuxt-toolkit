<script setup lang="ts">
import { reactive, ref } from 'vue';

interface Theme {
  label: string;
  vars: Record<string, string>;
}

const themes: Theme[] = [
  {
    label: 'Default',
    vars: {},
  },
  {
    label: 'Soft Sand',
    vars: {
      '--ak-skel-base': 'hsl(28 30% 86%)',
      '--ak-skel-highlight': 'hsl(28 60% 96% / 0.7)',
      '--ak-skel-radius': '0.75rem',
      '--ak-skel-duration': '1.8s',
    },
  },
  {
    label: 'Neon Pop',
    vars: {
      '--ak-skel-base': 'hsl(280 40% 22%)',
      '--ak-skel-highlight': 'hsl(180 100% 60% / 0.45)',
      '--ak-skel-radius': '1rem',
      '--ak-skel-duration': '1.1s',
    },
  },
  {
    label: 'Pulse · Slow',
    vars: {
      '--ak-skel-duration': '2.4s',
      '--ak-skel-pulse-min': '0.3',
    },
  },
];

const active = ref(0);
const loading = ref(true);

const styleVars = reactive<Record<string, string>>({});
function applyTheme(i: number) {
  const t = themes[i];
  if (!t) return;
  active.value = i;
  for (const k of Object.keys(styleVars)) delete styleVars[k];
  for (const [k, v] of Object.entries(t.vars)) styleVars[k] = v;
}
applyTheme(0);

const source = `<template>
  <ASkeleton
    :loading
    cache-key="themed-card"
    :animation="active === 3 ? 'pulse' : 'shimmer'"
    :style="{
      '--ak-skel-base': 'hsl(280 40% 22%)',
      '--ak-skel-highlight': 'hsl(180 100% 60% / 0.45)',
      '--ak-skel-radius': '1rem',
      '--ak-skel-duration': '1.1s',
    }"
  >
    <UserCard :data="user" />
  </ASkeleton>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Theming via CSS variables
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-3 flex flex-wrap gap-2 text-xs">
          <button
            v-for="(t, i) in themes"
            :key="t.label"
            :class="[
              'cursor-pointer rounded border px-3 py-1.5 transition',
              active === i
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-surface-2 hover:bg-surface',
            ]"
            @click="applyTheme(i)"
          >
            {{ t.label }}
          </button>

          <span class="ml-auto inline-flex items-center gap-2">
            <button
              class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
              @click="loading = !loading"
            >
              Toggle loading
            </button>
          </span>
        </div>

        <div :style="styleVars">
          <ASkeleton
            :loading="loading"
            cache-key="docs-themed-card"
            :animation="active === 3 ? 'pulse' : 'shimmer'"
          >
            <div class="flex items-start gap-4 p-4">
              <img
                src="https://i.pravatar.cc/96?img=32"
                class="size-16 shrink-0 rounded-full object-cover"
              />
              <div class="flex-1">
                <h3 class="text-base font-semibold">Riya Chen</h3>
                <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">Design Engineer</p>
                <p class="mt-2 text-sm leading-relaxed">
                  Spends her weekends tuning CSS variables. Bakes excellent sourdough.
                </p>
              </div>
            </div>
          </ASkeleton>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
