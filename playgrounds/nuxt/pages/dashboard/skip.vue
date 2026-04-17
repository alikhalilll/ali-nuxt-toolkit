<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  skipAutoMiddleware: true,
});
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">Dashboard → Skip</h1>
    <p class="mb-4 text-text-dim">
      This page sets
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
        >skipAutoMiddleware: true</code
      >, so the dispatcher short-circuits — no middleware runs even though the layout rule would
      otherwise match.
    </p>
    <NuxtLink to="/dashboard" class="text-accent">← back</NuxtLink>
  </section>
</template>
