<script setup lang="ts">
const rules = [
  { pattern: /^default$/, middlewares: ['log-activity'] },
  { pattern: /^(dashboard|dashboard\/[^/]*)$/, middlewares: ['auth'] },
  { pattern: /^admin$/, middlewares: ['auth', 'verify-role', 'require-admin'] },
];

const layout = ref('dashboard');
const extras = ref('');

const resolved = computed(() => {
  const out: string[] = [];
  for (const r of rules) {
    if (r.pattern.test(layout.value)) {
      for (const m of r.middlewares) {
        if (!out.includes(m)) out.push(m);
      }
    }
  }
  for (const e of extras.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (!out.includes(e)) out.push(e);
  }
  return out;
});
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · rule resolution
    </h4>

    <label class="mb-1 block text-xs uppercase tracking-wider text-text-dim">layout</label>
    <input
      v-model="layout"
      type="text"
      class="mb-3 w-full rounded border border-border bg-code-bg px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none"
    />

    <label class="mb-1 block text-xs uppercase tracking-wider text-text-dim">
      page-meta middlewares (comma separated)
    </label>
    <input
      v-model="extras"
      type="text"
      placeholder="e.g. force-2fa"
      class="mb-3 w-full rounded border border-border bg-code-bg px-3 py-2 font-mono text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
    />

    <div class="rounded-md border border-border bg-code-bg p-3 font-mono text-[13px] text-text-dim">
      <strong class="text-text">resolved chain:</strong>
      {{ resolved.length ? resolved.join(' → ') : '(none)' }}
    </div>
  </div>
</template>
