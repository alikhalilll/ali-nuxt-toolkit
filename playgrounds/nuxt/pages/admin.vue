<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">Admin</h1>
    <p class="text-text-dim">
      The <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">admin</code>
      layout rule expanded
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">@adminOnly</code>
      to
      <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2"
        >[auth, verify-role, require-admin]</code
      >. Check the console — all three fired in order.
    </p>
  </section>
</template>
