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

/* Five pastel accents + one dark accent — matches the reference "Featured
 * Plans" tile rhythm (saturated pastel surfaces, one near-black tile for
 * contrast). Each card is a SELF-CONTAINED surface: a fixed background and
 * a near-black button regardless of page theme. The page can switch between
 * light and dark — the cards look identical in both modes.
 *
 * WCAG contrast (sRGB luminance, rounded):
 *   - title `text-{accent}-950` on `bg-{accent}-300`   → 9–11:1 (AAA, any size)
 *   - body  `text-{accent}-950/80` on `bg-{accent}-300` → 6–8:1 (AA / AAA large)
 *   - label `text-{accent}-900` on `bg-{accent}-300`   → 5–7:1 (AA normal)
 *   - button `bg-zinc-900` on pastel bg                → strong figure/ground
 *   - icon  `text-zinc-50` on `bg-zinc-900`            → 18:1 (AAA)
 *
 * The `dark` accent stays `bg-zinc-950` in both modes. In light mode the
 * page surface is light (zinc-200-ish) so the deep black tile stands out
 * naturally. In dark mode the page surface drops to ~zinc-800 — to keep
 * the card edge visible we add a 1px inset `zinc-50/10` ring in dark mode
 * only. The dark card's button flips to white (`bg-zinc-50`) with a dark
 * icon so it stays contrasty inside its own surface. */
const ACCENTS: Record<RoleCard['accent'], AccentTheme> = {
  emerald: {
    card: 'bg-emerald-300',
    label: 'text-emerald-900',
    title: 'text-emerald-950',
    body: 'text-emerald-950/80',
    divider: 'bg-emerald-950/15',
    button: 'bg-zinc-900',
    buttonIcon: 'text-zinc-50',
  },
  violet: {
    card: 'bg-violet-300',
    label: 'text-violet-900',
    title: 'text-violet-950',
    body: 'text-violet-950/80',
    divider: 'bg-violet-950/15',
    button: 'bg-zinc-900',
    buttonIcon: 'text-zinc-50',
  },
  amber: {
    card: 'bg-amber-300',
    label: 'text-amber-900',
    title: 'text-amber-950',
    body: 'text-amber-950/80',
    divider: 'bg-amber-950/15',
    button: 'bg-zinc-900',
    buttonIcon: 'text-zinc-50',
  },
  rose: {
    card: 'bg-rose-300',
    label: 'text-rose-900',
    title: 'text-rose-950',
    body: 'text-rose-950/80',
    divider: 'bg-rose-950/15',
    button: 'bg-zinc-900',
    buttonIcon: 'text-zinc-50',
  },
  sky: {
    card: 'bg-sky-300',
    label: 'text-sky-900',
    title: 'text-sky-950',
    body: 'text-sky-950/80',
    divider: 'bg-sky-950/15',
    button: 'bg-zinc-900',
    buttonIcon: 'text-zinc-50',
  },
  dark: {
    /* `bg-zinc-950` in BOTH modes — the dark card is its own surface, not a
     * theme-dependent tile. Because the surface is always dark, the text
     * colours must also be unconditionally light: no `dark:` / `light:`
     * variants, just solid zinc-50 / zinc-300 that work in every theme.
     *
     * The previous `light:text-[#fff]` attempt only fired the colour in
     * light mode, so dark-mode visitors got default (dark) inherited text
     * on a black surface — invisible. Solid colours fix both.
     *
     * A 1px inset ring is added in dark mode only because the docs page
     * surface drops to ~zinc-800 in dark theme; the ring keeps the card
     * edge visible against the similarly-dark background. */
    card: 'bg-zinc-950 dark:ring-1 dark:ring-inset dark:ring-zinc-50/10',
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
  <ASkeleton
    :loading="loading"
    :repeat="6"
    class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3"
  >
    <template #prototype>
      <article class="flex flex-col gap-4 rounded-3xl bg-zinc-200 p-6 dark:bg-zinc-800">
        <span class="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
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
            <p class="text-xs uppercase tracking-wide text-zinc-500">members</p>
            <p class="text-3xl font-bold text-zinc-900 dark:text-zinc-50">00</p>
          </div>
          <div class="size-12 rounded-2xl bg-zinc-900 dark:bg-zinc-50" />
        </div>
      </article>
    </template>

    <article
      v-for="role in roles"
      :key="role.id"
      :class="['... per-accent classes ...']"
    >
      <!-- real card content -->
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
          <!-- gap-2 between grid cells — small breathing room between
               skeleton copies during loading AND between real cards once
               data resolves. Internal article spacing stays gap-4. -->
          <ASkeleton
            :loading="loading"
            :repeat="repeat"
            :max-nodes="10000"
            class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3"
          >
            <!-- Prototype: neutral-toned shape. The structural walker preserves
                 every tag + class, so the skeleton inherits the prototype's
                 geometry exactly. Neutral zinc surface reads as a "loading"
                 state in both light (zinc-200, soft gray) and dark (zinc-800,
                 a hair lighter than the page surface so the card edge is
                 visible against bg-surface-2). -->
            <template #prototype>
              <article class="flex flex-col gap-4 rounded-3xl bg-zinc-200 p-6 dark:bg-zinc-800">
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
