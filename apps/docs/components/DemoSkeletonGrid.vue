<script setup lang="ts">
/**
 * Live demo for the `v-for + #prototype + :repeat` pattern.
 *
 * Mirrors the user-reported bug case: a responsive grid of cards each with a
 * status pill, a counter, a heading, and two buttons. The skeleton needs to:
 *   - capture only ONE card as the shape source, not iterate the v-for
 *   - render N copies during loading (`:repeat`) so the grid fills out 1:1
 *   - keep the grid utilities working in both states (class on `<ASkeleton>`)
 *   - leave NO skeleton classes / wrappers in the DOM after loading completes
 */
import { computed, ref } from 'vue';

interface RoleCard {
  id: number;
  name: string;
  description: string;
  users_count: number;
  is_active: boolean;
  accent: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'indigo';
}

const loading = ref(true);
const repeat = ref(6);
const roles = ref<RoleCard[]>([]);

const allRoles: RoleCard[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full access to billing, members, and audit logs.',
    users_count: 12,
    is_active: true,
    accent: 'emerald',
  },
  {
    id: 2,
    name: 'Operations',
    description: 'Manages day-to-day campaign rollouts and approvals.',
    users_count: 4,
    is_active: true,
    accent: 'sky',
  },
  {
    id: 3,
    name: 'Editor',
    description: 'Drafts, edits, and publishes content across surfaces.',
    users_count: 8,
    is_active: false,
    accent: 'violet',
  },
  {
    id: 4,
    name: 'Finance',
    description: 'Reviews ledgers, exports reports, audits transactions.',
    users_count: 2,
    is_active: true,
    accent: 'amber',
  },
  {
    id: 5,
    name: 'Analyst',
    description: 'Read-only access to dashboards and product metrics.',
    users_count: 17,
    is_active: true,
    accent: 'rose',
  },
  {
    id: 6,
    name: 'Onboarding',
    description: 'Shepherds new accounts through their first week.',
    users_count: 1,
    is_active: false,
    accent: 'indigo',
  },
];

const ACCENTS: Record<RoleCard['accent'], { ring: string; bg: string; text: string; dot: string }> =
  {
    emerald: {
      ring: 'ring-emerald-200 dark:ring-emerald-500/30',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    sky: {
      ring: 'ring-sky-200 dark:ring-sky-500/30',
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      text: 'text-sky-700 dark:text-sky-300',
      dot: 'bg-sky-500',
    },
    violet: {
      ring: 'ring-violet-200 dark:ring-violet-500/30',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      text: 'text-violet-700 dark:text-violet-300',
      dot: 'bg-violet-500',
    },
    amber: {
      ring: 'ring-amber-200 dark:ring-amber-500/30',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    rose: {
      ring: 'ring-rose-200 dark:ring-rose-500/30',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
    indigo: {
      ring: 'ring-indigo-200 dark:ring-indigo-500/30',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      text: 'text-indigo-700 dark:text-indigo-300',
      dot: 'bg-indigo-500',
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
    class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    <template #prototype>
      <article
        class="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200
               dark:bg-zinc-900 dark:ring-zinc-800"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-50">Role name</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">0 members</p>
            </div>
          </div>
          <span
            class="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] uppercase tracking-wide
                   font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >Status</span>
        </header>

        <p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Description placeholder line goes here.
        </p>

        <footer class="flex items-center justify-end gap-2 pt-2">
          <UiButton variant="outline">View users</UiButton>
          <UiButton variant="ghost">Edit</UiButton>
        </footer>
      </article>
    </template>

    <article
      v-for="role in roles"
      :key="role.id"
      class="..."
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
          <ASkeleton
            :loading="loading"
            :repeat="repeat"
            :max-nodes="10000"
            class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <!-- Prototype: neutral-toned shape so the captured skeleton reads
                 as the card's geometry, not as one role's accent. -->
            <template #prototype>
              <article
                class="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
              >
                <header class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                    <div class="flex flex-col gap-1.5">
                      <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        Role name
                      </h3>
                      <p class="text-xs text-zinc-500 dark:text-zinc-400">0 members</p>
                    </div>
                  </div>
                  <span
                    class="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Status
                  </span>
                </header>

                <p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Description placeholder line goes here for measuring.
                </p>

                <footer class="flex items-center justify-end gap-2 pt-2">
                  <button
                    class="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    View users
                  </button>
                  <button
                    class="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Edit
                  </button>
                </footer>
              </article>
            </template>

            <!-- Real cards: per-role accent colour, hover lift, dark-mode aware. -->
            <article
              v-for="role in roles"
              :key="role.id"
              class="group flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:shadow-zinc-950"
            >
              <header class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div
                    class="grid size-10 place-items-center rounded-xl text-sm font-bold ring-1"
                    :class="[
                      ACCENTS[role.accent].bg,
                      ACCENTS[role.accent].ring,
                      ACCENTS[role.accent].text,
                    ]"
                  >
                    {{ role.name.charAt(0) }}
                  </div>
                  <div class="flex flex-col">
                    <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {{ role.name }}
                    </h3>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                      {{ role.users_count }}
                      {{ role.users_count === 1 ? 'member' : 'members' }}
                    </p>
                  </div>
                </div>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  :class="
                    role.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  "
                >
                  <span
                    class="inline-block size-1.5 rounded-full"
                    :class="role.is_active ? 'bg-emerald-500' : 'bg-zinc-400'"
                  />
                  {{ role.is_active ? 'Active' : 'Paused' }}
                </span>
              </header>

              <p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {{ role.description }}
              </p>

              <footer class="flex items-center justify-end gap-2 pt-2">
                <button
                  class="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  View users
                </button>
                <button
                  class="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Edit
                </button>
              </footer>
            </article>
          </ASkeleton>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
