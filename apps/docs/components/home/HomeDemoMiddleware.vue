<script setup lang="ts">
/**
 * Homepage-only variant of DemoAutoMiddleware — resolve a layout name
 * against a small rule set and render the chain as pill badges.
 * No Preview / Code tabs, no label strip.
 */
import { computed, ref } from 'vue';

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
  <div class="hdm">
    <label class="hdm__label">
      <span>layout</span>
      <input v-model="layout" type="text" class="hdm__input" placeholder="dashboard" />
    </label>

    <label class="hdm__label">
      <span>page-meta middlewares <small>(comma)</small></span>
      <input v-model="extras" type="text" class="hdm__input" placeholder="e.g. force-2fa" />
    </label>

    <div class="hdm__out">
      <span class="hdm__out-label">resolved chain</span>
      <div v-if="resolved.length" class="hdm__chain">
        <template v-for="(m, i) in resolved" :key="m">
          <code class="hdm__pill">{{ m }}</code>
          <span v-if="i < resolved.length - 1" class="hdm__arrow" aria-hidden="true">→</span>
        </template>
      </div>
      <span v-else class="hdm__empty">no middleware matched</span>
    </div>
  </div>
</template>

<style scoped>
.hdm {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hdm__label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}
.hdm__label small {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
  color: var(--color-text-muted);
}
.hdm__input {
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 0.375rem;
  background: var(--color-code-bg);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  transition: box-shadow 150ms ease;
}
.hdm__input:focus {
  outline: 0;
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.hdm__out {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.375rem;
  background: var(--color-code-bg);
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.hdm__out-label {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.hdm__chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem 0.5rem;
}
.hdm__pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-muted);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
}
.hdm__arrow {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.hdm__empty {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
