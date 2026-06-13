<script setup lang="ts">
import { ref } from 'vue';

const loading = ref(true);

const features = [
  'Unlimited projects + integrations',
  'Priority support, 4-hour SLA',
  'Team workspaces with SSO',
  'Audit log + advanced permissions',
];

const source = `<template>
  <ASkeleton :loading="loading" cache-key="pricing-pro">
    <div
      class="rounded-2xl bg-white p-6 ring-1 ring-zinc-200"
      style="box-shadow: 0 18px 40px -12px rgba(0,0,0,0.18)"
    >
      <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        RECOMMENDED
      </span>
      <h3 class="mt-4 text-2xl font-bold text-zinc-900">Pro</h3>
      <p class="mt-1 text-sm leading-relaxed text-zinc-600">
        Everything in Starter, plus team workspaces, SSO, audit logs,
        and 4-hour support SLAs. Cancel anytime.
      </p>
      <div class="mt-6 flex items-baseline gap-1">
        <span class="text-4xl font-bold text-zinc-900">$49</span>
        <span class="text-sm text-zinc-500">/month</span>
      </div>
      <ul class="mt-6 space-y-2 text-sm text-zinc-700">
        <li v-for="f in features" :key="f" class="flex gap-2">
          <LucideIcon name="check" class="size-4 text-emerald-600" />
          <span>{{ f }}</span>
        </li>
      </ul>
      <button class="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white">
        Start free trial
      </button>
      <button class="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 font-semibold text-zinc-700">
        Talk to sales
      </button>
    </div>
  </ASkeleton>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · advanced detection (bg + border + box-shadow + Range)
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-3 flex gap-2 text-xs">
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="loading = !loading"
          >
            {{ loading ? 'Show real card' : 'Show skeleton' }}
          </button>
        </div>

        <div class="rounded-2xl bg-surface-2 p-6">
          <ASkeleton :loading="loading" cache-key="docs-pricing-pro">
            <div
              class="rounded-2xl bg-bg p-6 ring-1 ring-border"
              style="box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.18)"
            >
              <span
                class="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 font-semibold dark:bg-emerald-500/15 dark:text-emerald-300"
              >
                RECOMMENDED
              </span>
              <h3 class="mt-4 text-2xl font-bold text-text">Pro</h3>
              <p class="mt-1 text-sm leading-relaxed text-text-dim">
                Everything in Starter, plus team workspaces, SSO, audit logs, and 4-hour support
                SLAs. Cancel anytime.
              </p>
              <div class="mt-6 flex items-baseline gap-1">
                <span class="text-4xl font-bold text-text">$49</span>
                <span class="text-sm text-text-muted">/month</span>
              </div>
              <ul class="mt-6 text-sm space-y-2 text-text">
                <li v-for="f in features" :key="f" class="flex items-start gap-2">
                  <LucideIcon
                    name="check"
                    class="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400"
                  />
                  <span>{{ f }}</span>
                </li>
              </ul>
              <button
                class="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white font-semibold dark:bg-emerald-500"
                style="box-shadow: 0 8px 18px -8px rgba(5, 150, 105, 0.6)"
              >
                Start free trial
              </button>
              <button
                class="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text"
              >
                Talk to sales
              </button>
            </div>
          </ASkeleton>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
