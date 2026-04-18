<script setup lang="ts">
const links = [
  { to: '/', label: 'Home' },
  { to: '/api-provider', label: 'api-provider' },
  { to: '/api-provider-core', label: 'api-provider · core' },
  { to: '/crypto', label: 'crypto' },
  { to: '/crypto-core', label: 'crypto · core' },
  { to: '/auto-middleware', label: 'auto-middleware' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin', label: 'Admin' },
];
</script>

<template>
  <nav class="mb-8 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-2">
    <NuxtLink
      v-for="l in links"
      :key="l.to"
      :to="l.to"
      class="rounded-md px-3.5 py-2 text-sm font-medium text-text-dim hover:bg-surface-2 hover:text-text hover:no-underline"
      active-class="!bg-surface-2 !text-text"
      exact-active-class="!bg-surface-2 !text-text"
    >
      {{ l.label }}
    </NuxtLink>
  </nav>
</template>
