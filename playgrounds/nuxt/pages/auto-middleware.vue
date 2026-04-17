<script setup lang="ts">
const card = 'mb-4 rounded-xl border border-border bg-surface p-5';
const cardH = 'mb-3 border-l-[3px] border-accent pl-2 text-lg font-semibold';
const preBox =
  'overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text';
const codeChip = 'rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2';
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">auto-middleware demo</h1>
    <p class="mb-6 text-text-dim">
      Open the devtools console, then click the links below. Each navigation logs the chain that
      fires, driven entirely by
      <code :class="codeChip">nuxt.config.ts</code> rules.
    </p>

    <div :class="card">
      <h2 :class="cardH">Configured rules</h2>
      <pre :class="preBox">
{
  groups: {
    auth: ['auth'],
    adminOnly: ['auth', 'verify-role', 'require-admin'],
  },
  rules: [
    { layouts: ['default'],                 middlewares: ['log-activity'] },
    { layouts: ['dashboard', 'dashboard/*'], middlewares: ['@auth'] },
    { layouts: ['admin'],                    middlewares: ['@adminOnly'] },
  ],
}</pre
      >
    </div>

    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div :class="card">
        <h2 :class="cardH">Layouts</h2>
        <p class="mb-2 text-sm text-text-dim">
          <NuxtLink to="/" class="text-accent">default</NuxtLink> — only
          <code :class="codeChip">log-activity</code> fires.
        </p>
        <p class="mb-2 text-sm text-text-dim">
          <NuxtLink to="/dashboard" class="text-accent">dashboard</NuxtLink> — the
          <code :class="codeChip">@auth</code> group expands to
          <code :class="codeChip">[auth]</code>.
        </p>
        <p class="text-sm text-text-dim">
          <NuxtLink to="/admin" class="text-accent">admin</NuxtLink> — the
          <code :class="codeChip">@adminOnly</code> group expands to
          <code :class="codeChip">[auth, verify-role, require-admin]</code>.
        </p>
      </div>

      <div :class="card">
        <h2 :class="cardH">Per-page extras</h2>
        <p class="mb-2 text-sm text-text-dim">
          <NuxtLink to="/dashboard/sensitive" class="text-accent">dashboard/sensitive</NuxtLink>
          declares
          <code :class="codeChip">middlewares: ['verify-role']</code>
          in its
          <code :class="codeChip">definePageMeta</code>, appended after the layout's
          <code :class="codeChip">@auth</code>.
        </p>
        <p class="text-sm text-text-dim">
          <NuxtLink to="/dashboard/skip" class="text-accent">dashboard/skip</NuxtLink> sets
          <code :class="codeChip">skipAutoMiddleware: true</code> — the dispatcher short-circuits.
        </p>
      </div>
    </div>

    <div :class="card">
      <h2 :class="cardH">Typed registry</h2>
      <p class="mb-2 text-sm text-text-dim">
        <code :class="codeChip">AutoMiddlewareName</code> is generated from your rules. Typos on the
        <code :class="codeChip">middlewares</code>
        page-meta field are compile errors.
      </p>
      <pre :class="preBox">
import type { AutoMiddlewareName } from '#build/auto-middleware/types';

definePageMeta({
  middlewares: ['verify-role'] satisfies AutoMiddlewareName[],
});</pre
      >
    </div>
  </section>
</template>
