<script setup lang="ts">
/**
 * State Machine Demo for AGhostSkeleton.
 *
 * Demonstrates the 4 mutual states handled natively by AGhostSkeleton:
 *   - Loading   → renders shimmering measured skeleton
 *   - Content   → renders #default="{ data }"
 *   - Empty     → renders #empty slot
 *   - Error     → renders #error="{ error }" slot
 */
import { ref } from 'vue';

type StateKey = 'loading' | 'content' | 'empty' | 'error';

interface Member {
  id: string;
  name: string;
  role: string;
  status: 'Online' | 'Away';
}

const MEMBERS: Member[] = [
  { id: '1', name: 'Sophia Chen', role: 'Staff Design Engineer', status: 'Online' },
  { id: '2', name: 'Marcus Vance', role: 'Core Infrastructure Lead', status: 'Online' },
  { id: '3', name: 'Elena Rostova', role: 'Product Architect', status: 'Away' },
];

const activeState = ref<StateKey>('content');

function setState(s: StateKey) {
  activeState.value = s;
}

const code = `<script setup lang="ts">
import { ref } from 'vue';
import { AGhostSkeleton } from '@alikhalilll/a-ghost-skeleton';

type State = 'loading' | 'content' | 'empty' | 'error';
const activeState = ref<State>('loading');
\u003c/script>

<template>
  <!-- Every props-driven state the component recognises, wired up at once
       so flipping \`activeState\` re-enters the right branch; in production
       you'd usually drive a single state at a time off your fetch result. -->
  <AGhostSkeleton
    id="demo-states-card"
    :loading="activeState === 'loading'"
    :data="activeState === 'content' ? MEMBERS : null"
    :sample="MEMBERS"
    :empty="activeState === 'empty'"
    :error="activeState === 'error' ? 'Network gateway timeout (504)' : undefined"
    label="Loading team collaborators"
  >
    <!-- Default content -->
    <template #default="{ data }">
      <ul>
        <li v-for="m in data" :key="m.id">
          <strong>{{ m.name }}</strong> · {{ m.role }}
        </li>
      </ul>
    </template>

    <!-- Empty state slot -->
    <template #empty>
      <div class="empty-view">
        <p>No collaborators found.</p>
        <button>Invite First Member</button>
      </div>
    </template>

    <!-- Error state slot -->
    <template #error="{ error }">
      <div class="error-view">
        <p>Failed to load data: {{ error }}</p>
        <button @click="retry">Retry</button>
      </div>
    </template>
  </AGhostSkeleton>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- State toggle toolbar -->
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="text-text-dim font-medium">Select State:</span>
            <div class="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
              <button
                v-for="s in ['loading', 'content', 'empty', 'error'] as const"
                :key="s"
                type="button"
                class="cursor-pointer rounded-md px-3 py-1.5 text-xs capitalize transition-colors"
                :class="
                  activeState === s
                    ? 'bg-surface font-semibold text-text shadow-sm'
                    : 'text-text-dim hover:text-text'
                "
                @click="setState(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <span class="text-[11px] font-mono text-text-dim">
            state: <strong>{{ activeState }}</strong>
          </span>
        </div>

        <!-- Container Stage -->
        <div class="mx-auto max-w-md">
          <div
            class="min-h-[220px] rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm flex flex-col justify-center"
          >
            <AGhostSkeleton
              id="demo-states-card"
              :loading="activeState === 'loading'"
              :data="activeState === 'content' ? MEMBERS : null"
              :sample="MEMBERS"
              :empty="activeState === 'empty'"
              :error="activeState === 'error' ? 'Network gateway timeout (504)' : undefined"
              label="Loading team collaborators"
            >
              <!-- 1. Normal Content Slot -->
              <template #default="{ data }">
                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-text-dim">
                      Team Collaborators ({{ data?.length || 0 }})
                    </h4>
                    <button type="button" class="text-xs font-medium text-primary hover:underline">
                      + Add Member
                    </button>
                  </div>

                  <ul class="flex flex-col gap-2.5">
                    <li
                      v-for="m in data"
                      :key="m.id"
                      class="flex items-center justify-between rounded-lg border border-border/50 bg-surface-2/30 p-2.5"
                    >
                      <div class="flex items-center gap-2.5">
                        <div
                          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                        >
                          {{ m.name[0] }}
                        </div>
                        <div>
                          <p class="text-xs font-semibold text-text leading-tight">{{ m.name }}</p>
                          <p class="text-[11px] text-text-dim leading-tight">{{ m.role }}</p>
                        </div>
                      </div>

                      <span
                        class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        :class="
                          m.status === 'Online'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-surface-2 text-text-dim'
                        "
                      >
                        {{ m.status }}
                      </span>
                    </li>
                  </ul>
                </div>
              </template>

              <!-- 2. Empty State Slot -->
              <template #empty>
                <div class="flex flex-col items-center justify-center py-6 text-center">
                  <div
                    class="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-xl text-text-dim"
                  >
                    👥
                  </div>
                  <h5 class="text-sm font-bold text-text">No collaborators yet</h5>
                  <p class="mt-1 max-w-xs text-xs text-text-dim">
                    Start sharing access by adding team members to this project workspace.
                  </p>
                  <button
                    type="button"
                    class="mt-4 cursor-pointer rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-fg transition-opacity hover:opacity-90"
                    @click="setState('content')"
                  >
                    Invite First Member
                  </button>
                </div>
              </template>

              <!-- 3. Error State Slot -->
              <template #error="{ error }">
                <div class="flex flex-col items-center justify-center py-6 text-center">
                  <div
                    class="mb-3 flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 text-xl font-bold"
                  >
                    ✕
                  </div>
                  <h5 class="text-sm font-bold text-rose-500">Failed to load data</h5>
                  <p class="mt-1 text-xs text-text-dim font-mono">
                    {{ error }}
                  </p>
                  <button
                    type="button"
                    class="mt-4 cursor-pointer rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface"
                    @click="setState('loading')"
                  >
                    Retry Request
                  </button>
                </div>
              </template>
            </AGhostSkeleton>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
