<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
});
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
    <p class="mb-6 text-text-dim">
      The <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">dashboard</code>
      layout rule matched —
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">@auth</code>
      (= <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">[auth]</code>) fired
      on the way in. Check the console.
    </p>

    <div class="mb-4 rounded-xl border border-border bg-surface p-5">
      <h2 class="mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold">Try sub-routes</h2>
      <p class="mb-2 text-sm text-text-dim">
        <NuxtLink to="/dashboard/sensitive" class="text-accent">/dashboard/sensitive</NuxtLink>
        — matches the
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">dashboard/*</code>
        glob and appends its own
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">middlewares</code>.
      </p>
      <p class="text-sm text-text-dim">
        <NuxtLink to="/dashboard/skip" class="text-accent">/dashboard/skip</NuxtLink> — opts out via
        <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
          >skipAutoMiddleware: true</code
        >.
      </p>
    </div>
  </section>
</template>
