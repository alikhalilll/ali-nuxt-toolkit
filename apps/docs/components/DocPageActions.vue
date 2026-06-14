<script setup lang="ts">
/**
 * "Copy page ▾" split-button shown at the top-right of every doc page.
 *
 * Two halves share one container:
 *   - left:  primary action — copies the page's raw markdown URL to clipboard
 *   - right: chevron — opens the dropdown of secondary actions
 *
 * The dropdown ships four entries (Nuxt's six minus the two MCP rows, which
 * require a hosted MCP server the docs site doesn't have):
 *   1. Copy Markdown link       — clipboard
 *   2. View as Markdown         — opens the .md URL in a new tab
 *   3. Open in ChatGPT          — opens chatgpt.com pre-filled with a prompt
 *   4. Open in Claude           — opens claude.ai/new pre-filled with a prompt
 *
 * The component is strictly presentational: it takes a canonical page path
 * and computes URLs from `runtimeConfig.public.siteUrl`. It doesn't know
 * about Nuxt Content, the current page object, or which package owns the
 * route.
 *
 * Click-outside + ESC + route-change-closes patterns lifted verbatim from
 * `AppHeader.vue`'s themePopover — same dependencies (`@vueuse/core`) and
 * same lifecycle.
 */
import { markRaw } from 'vue';
import { onClickOutside, useEventListener } from '@vueuse/core';
import {
  ChatGPTIcon,
  CheckIcon,
  ChevronDownIcon,
  ClaudeIcon,
  CopyIcon,
  ExternalLinkIcon,
  LinkIcon,
  MarkdownIcon,
} from '~/components/icons';

const props = defineProps<{
  /** Canonical content path — already normalised by the caller (e.g. `/index`,
   *  `/api-provider`, `/ui/tel-input`). The `.md` suffix is appended here. */
  pagePath: string;
}>();

const route = useRoute();
const {
  public: { siteUrl },
} = useRuntimeConfig();

const open = ref(false);
const copied = ref(false);
const rootEl = ref<HTMLElement | null>(null);

const markdownUrl = computed(() => {
  const base = String(siteUrl).replace(/\/+$/, '');
  return `${base}${props.pagePath}.md`;
});

const llmPrompt = computed(() => `Read ${markdownUrl.value} so I can ask questions about it.`);

const chatgptHref = computed(() => `https://chatgpt.com/?q=${encodeURIComponent(llmPrompt.value)}`);
const claudeHref = computed(() => `https://claude.ai/new?q=${encodeURIComponent(llmPrompt.value)}`);

// Clipboard write is best-effort: insecure contexts (some intranet hosts)
// throw, and we'd rather show no feedback than throw an unhandled error.
async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* clipboard unavailable — silently ignore */
  }
}

function onCopyClick() {
  writeClipboard(markdownUrl.value);
}

function onChevronClick() {
  open.value = !open.value;
}

/**
 * Menu rows declared as a flat list so adding/removing entries (e.g. the
 * MCP rows when a server lands) becomes a one-line change instead of a new
 * branch in the template. `markRaw` keeps Vue from making the component
 * reference itself reactive — a no-op cost we don't need.
 */
type MenuEntry = {
  label: string;
  icon: ReturnType<typeof markRaw>;
  action: { kind: 'copy'; value: () => string } | { kind: 'link'; href: () => string };
};

const entries: MenuEntry[] = [
  {
    label: 'Copy Markdown link',
    icon: markRaw(LinkIcon),
    action: { kind: 'copy', value: () => markdownUrl.value },
  },
  {
    label: 'View as Markdown',
    icon: markRaw(MarkdownIcon),
    action: { kind: 'link', href: () => markdownUrl.value },
  },
  {
    label: 'Open in ChatGPT',
    icon: markRaw(ChatGPTIcon),
    action: { kind: 'link', href: () => chatgptHref.value },
  },
  {
    label: 'Open in Claude',
    icon: markRaw(ClaudeIcon),
    action: { kind: 'link', href: () => claudeHref.value },
  },
];

function onMenuEntryClick(entry: MenuEntry) {
  if (entry.action.kind === 'copy') {
    writeClipboard(entry.action.value());
  }
  open.value = false;
}

onClickOutside(rootEl, () => (open.value = false));
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') open.value = false;
});
watch(
  () => route.fullPath,
  () => {
    open.value = false;
  }
);
</script>

<template>
  <div ref="rootEl" class="doc-actions">
    <button
      type="button"
      class="doc-actions__copy"
      :data-copied="copied || undefined"
      :aria-label="copied ? 'Copied markdown link' : 'Copy markdown link for this page'"
      @click="onCopyClick"
    >
      <CheckIcon v-if="copied" class="size-3.5" />
      <CopyIcon v-else class="size-3.5" />
      <span>{{ copied ? 'Copied' : 'Copy page' }}</span>
    </button>

    <button
      type="button"
      class="doc-actions__chevron"
      aria-label="More page actions"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="onChevronClick"
    >
      <ChevronDownIcon class="size-3.5 transition-transform" :class="open && 'rotate-180'" />
    </button>

    <div v-if="open" class="doc-actions__menu" role="menu">
      <template v-for="(entry, idx) in entries" :key="entry.label">
        <button
          v-if="entry.action.kind === 'copy'"
          type="button"
          role="menuitem"
          class="doc-actions__row"
          @click="onMenuEntryClick(entry)"
        >
          <component :is="entry.icon" class="doc-actions__row-icon" />
          <span class="doc-actions__row-label">{{ entry.label }}</span>
        </button>
        <a
          v-else
          role="menuitem"
          class="doc-actions__row"
          :href="entry.action.href()"
          target="_blank"
          rel="noopener"
          @click="onMenuEntryClick(entry)"
        >
          <component :is="entry.icon" class="doc-actions__row-icon" />
          <span class="doc-actions__row-label">{{ entry.label }}</span>
          <ExternalLinkIcon class="doc-actions__row-ext" />
        </a>
        <span v-if="idx === 1" aria-hidden="true" class="doc-actions__sep" />
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Split-button container — same chip language as the npm/Source row above
   so the page reads as one family, but a touch taller and sans-serif so it
   sits as the primary action rather than a secondary tag. */
.doc-actions {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: color-mix(in oklab, var(--color-surface) 60%, transparent);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-dim);
  /* No `overflow: hidden` here — the dropdown menu sits absolutely below this
     container, and clipping the overflow would clip the menu off-screen. The
     inner buttons get matching corner radii instead so the split-button still
     reads as one rounded shell. */
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}
.doc-actions:hover {
  border-color: color-mix(in oklab, var(--color-text) 28%, var(--color-border));
}

.doc-actions__copy,
.doc-actions__chevron {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  letter-spacing: -0.005em;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.doc-actions__copy {
  padding: 0 10px;
  border-right: 1px solid var(--color-border);
  border-radius: 7px 0 0 7px;
}
.doc-actions__chevron {
  padding: 0 6px;
  border-radius: 0 7px 7px 0;
}
.doc-actions__copy:hover,
.doc-actions__chevron:hover {
  color: var(--color-text);
  background: color-mix(in oklab, var(--color-surface-2, var(--color-surface)) 80%, transparent);
}
.doc-actions__copy[data-copied] {
  color: var(--color-success, #22c55e);
}
.doc-actions__copy:focus-visible,
.doc-actions__chevron:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--color-brand) 50%, transparent);
  outline-offset: 2px;
}

/* Dropdown panel — mirrors the theme popover in AppHeader for visual
   parity (rounded, soft shadow, surface bg, hover bg-surface-2 rows). */
.doc-actions__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 50;
  min-width: 220px;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
  background: color-mix(in oklab, var(--color-bg) 92%, transparent);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  box-shadow:
    0 1px 0 0 color-mix(in oklab, #fff 5%, transparent) inset,
    0 12px 28px -10px rgba(0, 0, 0, 0.22),
    0 4px 10px -4px rgba(0, 0, 0, 0.12);
}

.doc-actions__row {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-dim);
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.doc-actions__row:hover {
  background: color-mix(in oklab, var(--color-surface-2, var(--color-surface)) 70%, transparent);
  color: var(--color-text);
  text-decoration: none;
}
.doc-actions__row:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--color-brand) 50%, transparent);
  outline-offset: -2px;
}
.doc-actions__row-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}
.doc-actions__row-label {
  flex: 1;
  min-width: 0;
}
.doc-actions__row-ext {
  flex-shrink: 0;
  width: 11px;
  height: 11px;
  opacity: 0.55;
}

.doc-actions__sep {
  display: block;
  margin: 4px 6px;
  height: 1px;
  background: color-mix(in oklab, var(--color-border) 70%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .doc-actions,
  .doc-actions__copy,
  .doc-actions__chevron,
  .doc-actions__row {
    transition: none !important;
  }
}
</style>
