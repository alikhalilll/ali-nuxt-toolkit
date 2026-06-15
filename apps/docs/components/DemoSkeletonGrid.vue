<script setup lang="ts">
/**
 * Live demo for the `v-for + #prototype + :repeat` pattern.
 *
 * Mirrors the user-reported bug case: a responsive grid of cards each with a
 * switch, a counter, a heading, and two buttons. The skeleton needs to:
 *   - capture only ONE card as the shape source, not iterate the v-for
 *   - render N copies during loading (`:repeat`) so the grid fills out 1:1
 *   - keep the grid utilities working in both states (class on `<ASkeleton>`)
 *   - leave NO skeleton classes / wrappers in the DOM after loading completes
 */
import { ref } from 'vue';

interface RoleCard {
  id: number;
  name: string;
  users_count: number;
  is_active: boolean;
}

const loading = ref(true);
const repeat = ref(6);
const roles = ref<RoleCard[]>([]);

async function resolve() {
  loading.value = true;
  roles.value = [];
  await new Promise((r) => setTimeout(r, 700));
  roles.value = [
    { id: 1, name: 'Test role', users_count: 12, is_active: true },
    { id: 2, name: 'Operations manager', users_count: 4, is_active: true },
    { id: 3, name: 'Content editor', users_count: 8, is_active: false },
    { id: 4, name: 'Finance auditor', users_count: 2, is_active: true },
    { id: 5, name: 'Read-only analyst', users_count: 17, is_active: true },
    { id: 6, name: 'Onboarding helper', users_count: 1, is_active: false },
  ];
  loading.value = false;
}

function reset() {
  loading.value = true;
  roles.value = [];
}

resolve();

const source = `<template>
  <ASkeleton
    :loading="loading"
    :repeat="6"
    class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    <template #prototype>
      <article class="flex flex-col gap-3 rounded-lg bg-white p-5 ring-1 ring-gray-200 border border-red-100">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">0 users</p>
          <UiSwitch :model-value="false" />
        </div>
        <h3 class="text-lg font-bold">Role placeholder</h3>
        <div class="flex items-center justify-end gap-2 pt-2">
          <UiButton variant="outline">View users</UiButton>
          <UiButton variant="ghost">Edit</UiButton>
        </div>
      </article>
    </template>

    <article
      v-for="role in roles"
      :key="role.id"
      class="flex flex-col gap-3 rounded-lg bg-white p-5 ring-1 ring-red-400"
    >
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ role.users_count }} users</p>
        <UiSwitch v-model="role.is_active" />
      </div>
      <h3 class="text-lg font-bold">{{ role.name }}</h3>
      <div class="flex items-center justify-end gap-2 pt-2">
        <UiButton variant="outline" @click="goToUsers(role)">View users</UiButton>
        <UiButton variant="ghost" @click="goToEdit(role)">Edit</UiButton>
      </div>
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
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="loading ? resolve() : reset()"
          >
            {{ loading ? 'Resolve data' : 'Reset to loading' }}
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
            <span class="w-6 text-right tabular-nums">{{ repeat }}</span>
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
            <template #prototype>
              <article
                class="flex flex-col gap-3 rounded-lg bg-white p-5 border border-gray-500 text-gray-900"
              >
                <div class="flex items-center justify-between">
                  <p class="text-sm text-gray-500">0 users</p>
                  <div class="h-5 w-9 rounded-full bg-gray-200" role="presentation" />
                </div>
                <h3 class="text-lg font-bold">Role placeholder</h3>
                <div class="flex items-center justify-end gap-2 pt-2">
                  <button class="rounded border border-gray-300 px-3 py-1.5 text-sm">
                    View users
                  </button>
                  <button class="rounded px-3 py-1.5 text-sm text-gray-600">Edit</button>
                </div>
              </article>
            </template>

            <article
              v-for="role in roles"
              :key="role.id"
              class="flex flex-col gap-3 rounded-lg bg-white p-5 border border-gray-500 text-gray-900"
            >
              <div class="flex items-center justify-between">
                <p class="text-sm text-gray-500">{{ role.users_count }} users</p>
                <span
                  class="inline-block h-5 w-9 rounded-full"
                  :class="role.is_active ? 'bg-emerald-500' : 'bg-gray-200'"
                  :aria-label="role.is_active ? 'Active' : 'Inactive'"
                />
              </div>
              <h3 class="text-lg font-bold">{{ role.name }}</h3>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button class="rounded border border-gray-300 px-3 py-1.5 text-sm">
                  View users
                </button>
                <button class="rounded px-3 py-1.5 text-sm text-gray-600">Edit</button>
              </div>
            </article>
          </ASkeleton>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
