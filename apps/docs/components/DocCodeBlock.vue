<script setup lang="ts">
/**
 * Minimal code-block chrome — one dark surface, one copy button, no halo.
 *
 * API preserved from the previous version so the existing `<ProsePre>` wrap
 * and the DemoTabs code panel keep working without changes:
 *   - `filename` / `lang`  — optional top bar; omit for a chromeless block
 *   - `code` — raw text for the Copy button; the button hides when empty
 *   - `glow` — accepted but ignored (no decorative halo in the minimal theme)
 *   - `flush` — drop the default vertical margin
 */
import { ref } from 'vue';
import { CheckIcon, CopyIcon } from '~/components/icons';

const props = withDefaults(
  defineProps<{
    filename?: string;
    lang?: string;
    code?: string;
    glow?: boolean;
    flush?: boolean;
  }>(),
  { glow: false, flush: false }
);

const copied = ref(false);
async function copy() {
  if (!props.code) return;
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* clipboard unavailable — silently ignore */
  }
}
</script>

<template>
  <div :class="['doc-code', flush && 'doc-code--flush']">
    <div v-if="filename || lang" class="doc-code__bar">
      <span v-if="filename" class="doc-code__filename">{{ filename }}</span>
      <span v-if="lang && !filename" class="doc-code__lang">{{ lang }}</span>
      <span class="doc-code__bar-spacer" />
      <span v-if="lang && filename" class="doc-code__lang">{{ lang }}</span>
    </div>

    <div class="doc-code__body">
      <button
        v-if="code"
        type="button"
        class="doc-code__copy"
        :aria-label="copied ? 'Copied' : 'Copy code'"
        :data-copied="copied || undefined"
        @click="copy"
      >
        <CheckIcon v-if="copied" class="size-3" />
        <CopyIcon v-else class="size-3" />
      </button>
      <slot />
    </div>
  </div>
</template>

<style>
.doc-code {
  position: relative;
  margin: 1rem 0 1.5rem;
  border-radius: 0.5rem;
  background: var(--color-code-bg);
  font-family: var(--font-mono);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.doc-code--flush {
  margin: 0;
  box-shadow: none;
  border-radius: 0;
}

.doc-code__bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  box-shadow: inset 0 -1px 0 var(--color-border);
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}
.doc-code__filename {
  color: var(--color-text-dim);
}
.doc-code__lang {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.625rem;
}
.doc-code__bar-spacer {
  flex: 1;
}

.doc-code__body {
  position: relative;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  line-height: 1.65;
  color: var(--color-text);
  overflow-x: auto;
}

.doc-code__body .shiki,
.doc-code__body pre {
  margin: 0;
  background: transparent !important;
  color: inherit;
}

.doc-code__copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.25rem;
  background: transparent;
  border: 0;
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 150ms ease,
    color 150ms ease;
}
.doc-code:hover .doc-code__copy,
.doc-code__copy:focus-visible,
.doc-code__copy[data-copied] {
  opacity: 1;
}
.doc-code__copy:hover {
  color: var(--color-text);
}
.doc-code__copy[data-copied] {
  color: var(--color-accent);
}
</style>
