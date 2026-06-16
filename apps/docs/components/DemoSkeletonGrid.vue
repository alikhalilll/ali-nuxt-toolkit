<script setup lang="ts">
/**
 * Live demo for the `v-for + #prototype + :repeat` pattern.
 *
 * The cards mimic a "Featured Plans" tile: bold pastel surface, top-left
 * category caps, large title, body line, divider, then a big metric on the
 * bottom-left and a dark circular arrow button on the bottom-right. One card
 * in the rotation flips to a dark surface for visual rhythm — matches the
 * reference design.
 *
 * The skeleton still needs to:
 *   - capture only ONE card as the shape source, not iterate the v-for
 *   - render N copies during loading (`:repeat`) so the grid fills out 1:1
 *   - keep the grid utilities working in both states (class on `<ASkeleton>`)
 *   - leave NO skeleton classes / wrappers in the DOM after loading completes
 */
import { computed, ref } from 'vue';

interface RoleCard {
  id: number;
  category: string;
  name: string;
  description: string;
  users_count: number;
  metric_label: string;
  accent: 'emerald' | 'violet' | 'amber' | 'rose' | 'sky' | 'dark';
}

interface AccentTheme {
  card: string;
  label: string;
  title: string;
  body: string;
  divider: string;
  button: string;
  buttonIcon: string;
}

const loading = ref(true);
const repeat = ref(4);
const roles = ref<RoleCard[]>([]);

const allRoles: RoleCard[] = [
  {
    id: 1,
    category: 'Access',
    name: 'Admin',
    description: 'Full access to billing, members, and audit logs.',
    users_count: 12,
    metric_label: 'members',
    accent: 'emerald',
  },
  {
    id: 2,
    category: 'Workflow',
    name: 'Operations',
    description: 'Manages day-to-day campaign rollouts and approvals.',
    users_count: 4,
    metric_label: 'members',
    accent: 'dark',
  },
  {
    id: 3,
    category: 'Content',
    name: 'Editor',
    description: 'Drafts, edits, and publishes content across surfaces.',
    users_count: 8,
    metric_label: 'members',
    accent: 'violet',
  },
  {
    id: 4,
    category: 'Finance',
    name: 'Auditor',
    description: 'Reviews ledgers, exports reports, audits transactions.',
    users_count: 2,
    metric_label: 'members',
    accent: 'amber',
  },
];

/* Five pastel accents + one always-dark accent. Every card carries an
 * explicit background AND text colour for BOTH light and dark mode, plus a
 * hairline border that matches the surface in each theme.
 *
 * Light mode: saturated mid-tone pastel (`{accent}-300`) with deep
 *   accent-coloured text (`{accent}-950`) and a near-black button.
 * Dark mode:  deep accent surface (`{accent}-900`) with light accent text
 *   (`{accent}-50`) and a white button. The accent identity is preserved in
 *   both modes — the same colour, just dialled up or down for the theme.
 *
 * WCAG sRGB contrast (rounded), light → dark:
 *   - title `{accent}-950` on `{accent}-300`  →  9-11:1   (AAA)
 *   - title `{accent}-50`  on `{accent}-900`  → 11-13:1   (AAA)
 *   - body  `{accent}-950/80` / `{accent}-100` on their surfaces → 6-9:1
 *   - label `{accent}-900` / `{accent}-200`  on their surfaces → 5-8:1
 *   - button: pure black/white pair on the accent surface → strong contrast
 *
 * The `dark` accent is the rhythm-breaker. Surface stays `bg-zinc-950` in
 * both modes (that's its identity). The border switches from `zinc-300` in
 * light (so the card edge picks up the same hairline as the pastels) to
 * `zinc-700` in dark (lifted just enough to read against `bg-surface-2`).
 * Text and button are always light because the surface is always black. */
const ACCENTS: Record<RoleCard['accent'], AccentTheme> = {
  emerald: {
    card: 'border border-emerald-400 bg-emerald-300 dark:border-emerald-700 dark:bg-emerald-900',
    label: 'text-emerald-900 dark:text-emerald-200',
    title: 'text-emerald-950 dark:text-emerald-50',
    body: 'text-emerald-950/80 dark:text-emerald-100',
    divider: 'bg-emerald-950/15 dark:bg-emerald-50/15',
    button: 'bg-zinc-900 dark:bg-zinc-50',
    buttonIcon: 'text-zinc-50 dark:text-zinc-950',
  },
  violet: {
    card: 'border border-violet-400 bg-violet-300 dark:border-violet-700 dark:bg-violet-900',
    label: 'text-violet-900 dark:text-violet-200',
    title: 'text-violet-950 dark:text-violet-50',
    body: 'text-violet-950/80 dark:text-violet-100',
    divider: 'bg-violet-950/15 dark:bg-violet-50/15',
    button: 'bg-zinc-900 dark:bg-zinc-50',
    buttonIcon: 'text-zinc-50 dark:text-zinc-950',
  },
  amber: {
    card: 'border border-amber-400 bg-amber-300 dark:border-amber-700 dark:bg-amber-900',
    label: 'text-amber-900 dark:text-amber-200',
    title: 'text-amber-950 dark:text-amber-50',
    body: 'text-amber-950/80 dark:text-amber-100',
    divider: 'bg-amber-950/15 dark:bg-amber-50/15',
    button: 'bg-zinc-900 dark:bg-zinc-50',
    buttonIcon: 'text-zinc-50 dark:text-zinc-950',
  },
  rose: {
    card: 'border border-rose-400 bg-rose-300 dark:border-rose-700 dark:bg-rose-900',
    label: 'text-rose-900 dark:text-rose-200',
    title: 'text-rose-950 dark:text-rose-50',
    body: 'text-rose-950/80 dark:text-rose-100',
    divider: 'bg-rose-950/15 dark:bg-rose-50/15',
    button: 'bg-zinc-900 dark:bg-zinc-50',
    buttonIcon: 'text-zinc-50 dark:text-zinc-950',
  },
  sky: {
    card: 'border border-sky-400 bg-sky-300 dark:border-sky-700 dark:bg-sky-900',
    label: 'text-sky-900 dark:text-sky-200',
    title: 'text-sky-950 dark:text-sky-50',
    body: 'text-sky-950/80 dark:text-sky-100',
    divider: 'bg-sky-950/15 dark:bg-sky-50/15',
    button: 'bg-zinc-900 dark:bg-zinc-50',
    buttonIcon: 'text-zinc-50 dark:text-zinc-950',
  },
  dark: {
    /* The lone "always-dark" tile. `bg-zinc-950` carries in both themes —
     * dark is its identity, not a mode swap. Border picks up the same
     * light-zinc hairline the other cards use in light mode, and a
     * slightly lifted zinc-700 edge in dark so the card sits visibly
     * against `bg-surface-2`. Text + button stay unconditionally light
     * (the surface is always black, so no `dark:` flips needed). */
    card: 'border border-zinc-300 bg-zinc-950 dark:border-zinc-700',
    label: 'text-zinc-300',
    title: 'text-zinc-50',
    body: 'text-zinc-300',
    divider: 'bg-zinc-50/15',
    button: 'bg-zinc-50',
    buttonIcon: 'text-zinc-950',
  },
};

async function resolve() {
  loading.value = true;
  roles.value = [];
  await new Promise((r) => setTimeout(r, 700));
  roles.value = allRoles;
  loading.value = false;
}

function reset() {
  loading.value = true;
  roles.value = [];
}

resolve();

const buttonLabel = computed(() => (loading.value ? 'Resolve data' : 'Reset to loading'));

const source = `<template>
  <ASkeleton :loading="loading" :repeat="4" class="grid grid-cols-2 gap-2">
    <!-- Prototype: same padding + border + structure as the real card so
         the captured shape matches the eventual loaded layout 1:1. -->
    <template #prototype>
      <article
        class="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <span class="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          Category
        </span>
        <h3 class="text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
          Role name
        </h3>
        <p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Description placeholder line that wraps to two lines for shape capture.
        </p>
        <div class="my-2 h-px w-full bg-zinc-900/15 dark:bg-zinc-50/15" />
        <div class="flex items-end justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">members</p>
            <p class="text-3xl font-bold text-zinc-900 dark:text-zinc-50">00</p>
          </div>
          <div class="size-12 rounded-2xl bg-zinc-900 dark:bg-zinc-50" />
        </div>
      </article>
    </template>

    <!-- Real cards: per-role accent palette with explicit light + dark bg. -->
    <article
      v-for="role in roles"
      :key="role.id"
      class="flex flex-col gap-4 rounded-3xl p-6"
      :class="ACCENTS[role.accent].card"
    >
      <!-- …content driven by ACCENTS[role.accent] … -->
    </article>
  </ASkeleton>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · v-for + #prototype + :repeat
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 text-text hover:bg-surface"
            @click="loading ? resolve() : reset()"
          >
            {{ buttonLabel }}
          </button>
          <label class="flex items-center gap-2 text-text-dim">
            <span>repeat:</span>
            <input
              v-model.number="repeat"
              type="range"
              min="1"
              max="12"
              step="1"
              class="cursor-pointer"
            />
            <span class="w-6 text-right tabular-nums text-text">{{ repeat }}</span>
          </label>
          <span class="text-text-dim">
            loading = <code>{{ loading }}</code> · roles.length = <code>{{ roles.length }}</code>
          </span>
        </div>

        <div class="rounded-2xl bg-surface-2 p-6">
          <!-- Fixed 2-column grid with gap-2 — four cards lay out as 2×2
               in both skeleton and loaded states. Internal article spacing
               stays gap-4 so cards still breathe. -->
          <ASkeleton
            :loading="loading"
            :repeat="repeat"
            :max-nodes="10000"
            class="grid grid-cols-2 gap-2 p-1"
          >
            <!-- Prototype: same padding + border + structure as the real
                 cards (so the captured shape matches the loaded layout
                 1:1, no shift when data arrives). Surface is pure white in
                 light mode and a soft `zinc-900` (a "light black", between
                 the page's `bg-surface-2` and the dark accent's `zinc-950`)
                 in dark mode so the skeleton tiles read clearly in both
                 themes. -->
            <template #prototype>
              <article
                class="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <span
                  class="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400"
                >
                  Category
                </span>
                <h3 class="text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                  Role name placeholder
                </h3>
                <p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Description placeholder line that wraps to two lines so the skeleton captures both
                  rows.
                </p>
                <div class="my-2 h-px w-full bg-zinc-900/15 dark:bg-zinc-50/15" />
                <div class="flex items-end justify-between">
                  <div>
                    <p class="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      members
                    </p>
                    <p class="text-3xl font-bold text-zinc-900 dark:text-zinc-50">00</p>
                  </div>
                  <div class="size-12 rounded-2xl bg-zinc-900 dark:bg-zinc-50" />
                </div>
              </article>
            </template>

            <!-- Real cards: per-role accent palette baked into a single surface
                 colour, with one "dark" card breaking the pastel rhythm. -->
            <article
              v-for="role in roles"
              :key="role.id"
              class="group flex flex-col gap-4 rounded-3xl p-6 transition hover:-translate-y-0.5 hover:shadow-xl"
              :class="ACCENTS[role.accent].card"
            >
              <span
                class="text-[10px] font-semibold uppercase tracking-[0.15em]"
                :class="ACCENTS[role.accent].label"
              >
                {{ role.category }}
              </span>
              <h3 class="text-2xl font-bold leading-tight" :class="ACCENTS[role.accent].title">
                {{ role.name }}
              </h3>
              <p class="text-sm leading-relaxed" :class="ACCENTS[role.accent].body">
                {{ role.description }}
              </p>
              <div class="my-2 h-px w-full" :class="ACCENTS[role.accent].divider" />
              <div class="flex items-end justify-between">
                <div>
                  <p class="text-xs uppercase tracking-wide" :class="ACCENTS[role.accent].label">
                    {{ role.metric_label }}
                  </p>
                  <p class="text-3xl font-bold" :class="ACCENTS[role.accent].title">
                    {{ role.users_count }}
                  </p>
                </div>
                <button
                  class="grid size-12 cursor-pointer place-items-center rounded-2xl transition group-hover:scale-105"
                  :class="ACCENTS[role.accent].button"
                  :aria-label="`Open ${role.name}`"
                >
                  <LucideIcon
                    name="arrow-right"
                    :class="['size-5', ACCENTS[role.accent].buttonIcon]"
                  />
                </button>
              </div>
            </article>
          </ASkeleton>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
