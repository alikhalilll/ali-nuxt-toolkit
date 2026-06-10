<script setup lang="ts">
import { computed, ref } from 'vue';

const profile = ref<{ name: string; role: string; bio: string; avatar: string } | null>(null);
const loading = computed(() => profile.value === null);

async function load() {
  profile.value = null;
  await new Promise((r) => setTimeout(r, 700));
  profile.value = {
    name: 'Maya Hartman',
    role: 'Senior Platform Engineer',
    bio: 'Builds developer tools and component libraries. Currently exploring runtime DOM introspection for self-generating skeleton loaders.',
    avatar: 'https://i.pravatar.cc/96?img=47',
  };
}

load();

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';

const profile = ref(null);
const loading = computed(() => profile.value === null);

async function load() {
  profile.value = null;
  await new Promise(r => setTimeout(r, 700));
  profile.value = { /* … */ };
}
load();
\u003c/script>

<template>
  <ASkeleton :loading="loading" cache-key="profile-card">
    <div class="flex items-start gap-4 p-4">
      <img
        v-if="profile?.avatar"
        :src="profile.avatar"
        :alt="profile.name"
        class="size-16 shrink-0 rounded-full object-cover"
      />
      <div v-else class="size-16 shrink-0 rounded-full" />

      <div class="flex-1">
        <h3 class="text-base font-semibold">{{ profile?.name }}</h3>
        <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">
          {{ profile?.role }}
        </p>
        <p class="mt-2 text-sm leading-relaxed">{{ profile?.bio }}</p>
      </div>
    </div>
  </ASkeleton>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · ASkeleton wrapper
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-3 flex gap-2 text-xs">
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="load"
          >
            Reload
          </button>
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="profile = null"
          >
            Show skeleton
          </button>
        </div>

        <ASkeleton :loading="loading" cache-key="docs-profile-card">
          <div class="flex items-start gap-4 p-4">
            <img
              v-if="profile?.avatar"
              :src="profile.avatar"
              :alt="profile.name"
              class="size-16 shrink-0 rounded-full object-cover"
            />
            <div v-else class="size-16 shrink-0 rounded-full" />

            <div class="flex-1">
              <h3 class="text-base font-semibold">{{ profile?.name }}</h3>
              <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">
                {{ profile?.role }}
              </p>
              <p class="mt-2 text-sm leading-relaxed">{{ profile?.bio }}</p>
            </div>
          </div>
        </ASkeleton>
      </div>
    </DemoTabs>
  </div>
</template>
