<script setup lang="ts">
/**
 * Tabbed install command.
 *
 * Usage from Markdown:
 *
 *   ::DocInstall{pkg="@alikhalilll/a-tel-input"}
 *   ::
 *
 * Multiple packages:
 *
 *   ::DocInstall{pkgs="@alikhalilll/nuxt-api-provider @alikhalilll/nuxt-crypto"}
 *   ::
 *
 * Renders four manager tabs (pnpm / npm / yarn / bun) on top of one
 * code-panel chrome (matching DocCodeBlock), with a single copy button
 * that always copies the currently-selected command.
 *
 * Selection is persisted to `localStorage` so the user only picks their
 * manager once and every install block on the site remembers.
 */
import { computed, onMounted, ref } from 'vue';
import { CheckIcon, CopyIcon } from '~/components/icons';

const props = withDefaults(
  defineProps<{
    /** Single package name. */
    pkg?: string;
    /** Whitespace-separated package list (use when installing multiple at once). */
    pkgs?: string;
  }>(),
  {}
);

type Manager = 'pnpm' | 'npm' | 'yarn' | 'bun';
const managers: Manager[] = ['pnpm', 'npm', 'yarn', 'bun'];

const STORAGE_KEY = 'docs-pkg-manager';
const selected = ref<Manager>('pnpm');

onMounted(() => {
  if (typeof localStorage === 'undefined') return;
  const saved = localStorage.getItem(STORAGE_KEY) as Manager | null;
  if (saved && managers.includes(saved)) selected.value = saved;
});

function pick(m: Manager) {
  selected.value = m;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, m);
  }
}

const packageList = computed(() => (props.pkgs ?? props.pkg ?? '').trim());

// Per-manager action verb. npm uses `install`, the others `add`.
const ACTIONS: Record<Manager, string> = { pnpm: 'add', npm: 'install', yarn: 'add', bun: 'add' };

// The plain-text command (used by the Copy button).
const commands = computed<Record<Manager, string>>(() => ({
  pnpm: `pnpm add ${packageList.value}`,
  npm: `npm install ${packageList.value}`,
  yarn: `yarn add ${packageList.value}`,
  bun: `bun add ${packageList.value}`,
}));
const current = computed(() => commands.value[selected.value]);
const currentAction = computed(() => ACTIONS[selected.value]);

// Package list split into individual specifiers — each rendered as a string
// token so multi-package installs colour every package, not just the first.
const packageTokens = computed(() => packageList.value.split(/\s+/).filter(Boolean));

const copied = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(current.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <div class="doc-install">
    <div class="doc-install__bar" role="tablist" aria-label="Package manager">
      <button
        v-for="m in managers"
        :key="m"
        type="button"
        role="tab"
        :aria-selected="selected === m"
        :class="['doc-install__tab', selected === m && 'doc-install__tab--active']"
        @click="pick(m)"
      >
        {{ m }}
      </button>
      <span class="doc-install__bar-spacer" />
      <button
        type="button"
        class="doc-install__copy"
        :aria-label="copied ? 'Copied' : 'Copy command'"
        :data-copied="copied || undefined"
        @click="copy"
      >
        <CheckIcon v-if="copied" class="size-3" />
        <CopyIcon v-else class="size-3" />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>

    <!-- Syntax-coloured command:
           $   prompt (dim)
           pnpm / npm / yarn / bun   manager keyword (brand purple)
           add / install             action keyword (coral red)
           @scope/pkg                each package as a string token (light blue)
         Mirrors the homepage Showcase's hand-coded `code-kw` / `code-fn` /
         `code-str` palette so install blocks and code blocks read with one
         set of token colours. -->
    <div class="doc-install__body">
      <code class="doc-install__cmd">
        <span class="doc-install__prompt">$</span>
        <span class="doc-install__pm">{{ selected }}</span>
        <span class="doc-install__action">{{ currentAction }}</span>
        <span v-for="(p, i) in packageTokens" :key="i" class="doc-install__pkg">{{ p }}</span>
      </code>
    </div>
  </div>
</template>

<style scoped>
/* Outer frame — mirrors DocCodeBlock's `p-2` editor chrome so install blocks
   and code blocks share one visual system. */
.doc-install {
  position: relative;
  margin: 1rem 0 1.5rem;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
  background: color-mix(in oklab, var(--color-bg) 60%, var(--color-surface));
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
  box-shadow: 0 16px 36px -20px rgba(0, 0, 0, 0.42);
  overflow: hidden;
}

/* Tab strip + copy button in one row. */
.doc-install__bar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid color-mix(in oklab, var(--color-border) 40%, transparent);
  background: color-mix(in oklab, var(--color-code-bg) 90%, var(--color-bg));
  font-size: 11.5px;
  color: var(--color-text-muted);
}
.doc-install__tab {
  position: relative;
  padding: 4px 10px;
  border: 0;
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.doc-install__tab:hover {
  color: var(--color-text-dim);
}
.doc-install__tab--active {
  color: var(--color-text);
  background: color-mix(in oklab, var(--color-brand) 12%, transparent);
}
.doc-install__tab--active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -8px;
  height: 2px;
  border-radius: 2px;
  background: var(--color-brand);
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 50%, transparent);
}
.doc-install__bar-spacer {
  flex: 1;
}
.doc-install__copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 6px;
  border-radius: 5px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  background: color-mix(in oklab, var(--color-surface) 50%, transparent);
  color: var(--color-text-dim);
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}
.doc-install__copy:hover {
  color: var(--color-text);
  background: color-mix(in oklab, var(--color-surface) 80%, transparent);
  border-color: color-mix(in oklab, var(--color-border) 80%, transparent);
}
.doc-install__copy[data-copied] {
  color: var(--color-success);
  border-color: color-mix(in oklab, var(--color-success) 50%, var(--color-border));
}

/* Body — dark editor surface with the command in a `<pre>`. Mirror the
   DocCodeBlock spacing exactly so consecutive install + code blocks read
   as one visual rhythm. */
.doc-install__body {
  background: var(--color-code-bg);
  border-radius: 0 0 8px 8px;
  padding: 14px 16px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--color-text);
  overflow-x: auto;
}
.doc-install__cmd {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5em;
  margin: 0;
  padding: 0;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: var(--color-text);
}
.doc-install__prompt {
  color: color-mix(in oklab, var(--color-text-muted) 70%, transparent);
  user-select: none;
}
/* Manager keyword — function-style purple, matches Showcase `.code-fn`. */
.doc-install__pm {
  color: #8250df;
  font-weight: 500;
}
html.dark .doc-install__pm {
  color: #d2a8ff;
}
/* Action verb (`add` / `install`) — keyword red, matches Showcase `.code-kw`. */
.doc-install__action {
  color: #cf222e;
  font-weight: 500;
}
html.dark .doc-install__action {
  color: #ff7b72;
}
/* Each package spec — string blue, matches Showcase `.code-str`. */
.doc-install__pkg {
  color: #0a3069;
}
html.dark .doc-install__pkg {
  color: #a5d6ff;
}
</style>
