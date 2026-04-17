<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middlewares: ['verify-role'],
});
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">Dashboard → Sensitive</h1>
    <p class="mb-4 text-text-dim">
      The layout rule
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">dashboard/*</code>
      fired
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">@auth</code>, then this
      page's
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
        >middlewares: ['verify-role']</code
      >
      was appended. The devtools console shows
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
        >[auth → verify-role]</code
      >.
    </p>
    <NuxtLink to="/dashboard" class="text-accent">← back</NuxtLink>
  </section>
</template>
