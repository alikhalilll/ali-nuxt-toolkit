<script setup lang="ts">
/**
 * Site-wide code-block chrome.
 *
 * Replaces the multiple ad-hoc `<pre>` / `bg-code-bg` / `prose pre` treatments
 * that drifted apart across the docs (markdown prose, DemoTabs Code pane, hero
 * showcase). All three now share one frame so the visual language is one note:
 *
 *   - panel container with the showcase border + brand-tinted background
 *   - optional rotating-glow halo (homepage hero only — pass `glow`)
 *   - optional filename strip
 *   - optional language pill + copy button
 *   - the actual code content lives in the default slot (Shiki HTML, raw text,
 *     or hand-coded span markup — the wrapper doesn't care)
 *
 * Use directly for the hero showcase; wire as the override for Nuxt Content's
 * `<ProsePre>` so every markdown code block adopts the same shell.
 */
import { ref } from 'vue';
import { CheckIcon, CopyIcon } from '~/components/icons';

const props = withDefaults(
  defineProps<{
    /** Top-bar filename (e.g. `app/components/SignupForm.vue`). Optional. */
    filename?: string;
    /** Language pill on the right of the filename bar. */
    lang?: string;
    /** Raw text used by the Copy button. If empty, the button is hidden. */
    code?: string;
    /** Render the conic-gradient brand halo around the panel (hero only). */
    glow?: boolean;
    /** Drop the default vertical margin — lets the parent control spacing. */
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
  <div
    :class="[
      'doc-code',
      glow && 'doc-code--glow',
      flush && 'doc-code--flush',
      (filename || lang || code) && 'doc-code--has-bar',
    ]"
  >
    <!-- Optional top bar — filename + language pill + copy button. Only rendered
         when at least one of those slots is configured. -->
    <div v-if="filename || lang || code" class="doc-code__bar">
      <span v-if="filename" class="doc-code__filename">{{ filename }}</span>
      <span v-if="lang && !filename" class="doc-code__filename doc-code__filename--lang">
        {{ lang }}
      </span>
      <span class="doc-code__bar-spacer" />
      <span v-if="lang && filename" class="doc-code__lang">{{ lang }}</span>
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
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>

    <div class="doc-code__body">
      <slot />
    </div>
  </div>
</template>

<style>
/* --- Outer frame ----------------------------------------------------------
   Mirrors the hero `code-panel` recipe — same border, brand-tinted bg, same
   rounded corners — so prose, demo Code panes, and the hero feel like one
   system. `padding: 0.5rem` (Tailwind `p-2`) gives the inner bar + body a
   thin breathing margin against the outer border, producing the "framed
   editor" look the homepage Showcase uses. */
.doc-code {
  position: relative;
  margin: 1rem 0 1.5rem;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
  background: color-mix(in oklab, var(--color-bg) 60%, var(--color-surface));
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
  box-shadow: 0 16px 36px -20px rgba(0, 0, 0, 0.42);
  overflow: hidden;
  isolation: isolate;
}
.doc-code--flush {
  margin: 0;
}

/* --- Optional brand halo (hero only) -------------------------------------- */
@property --doc-code-glow-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.doc-code--glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: conic-gradient(
    from var(--doc-code-glow-angle),
    #60a5fa 0%,
    #22d3ee 25%,
    #a78bfa 50%,
    #f472b6 75%,
    #60a5fa 100%
  );
  filter: blur(18px);
  opacity: 0.55;
  z-index: -1;
  animation: doc-code-glow 6s linear infinite;
  pointer-events: none;
}
@keyframes doc-code-glow {
  to {
    --doc-code-glow-angle: 360deg;
  }
}

/* --- Top bar --------------------------------------------------------------
   filename · spacer · lang pill · copy button. Hidden when none of those
   slots are configured (a bare code block stays chrome-free). Sits flush
   against the inner body so they read as a single editor surface inside the
   `p-2` outer frame. */
.doc-code__bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid color-mix(in oklab, var(--color-border) 40%, transparent);
  background: color-mix(in oklab, var(--color-code-bg) 90%, var(--color-bg));
  font-size: 11.5px;
  color: var(--color-text-muted);
}
.doc-code__filename {
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}
.doc-code__filename--lang {
  text-transform: lowercase;
  letter-spacing: 0.02em;
  color: var(--color-text-dim);
}
.doc-code__bar-spacer {
  flex: 1;
}
.doc-code__lang {
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  letter-spacing: 0.02em;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  background: color-mix(in oklab, var(--color-surface) 50%, transparent);
  color: var(--color-text-muted);
}
.doc-code__copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 6px;
  border-radius: 5px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  background: color-mix(in oklab, var(--color-surface) 50%, transparent);
  color: var(--color-text-dim);
  font-size: 10.5px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}
.doc-code__copy:hover {
  color: var(--color-text);
  background: color-mix(in oklab, var(--color-surface) 80%, transparent);
  border-color: color-mix(in oklab, var(--color-border) 80%, transparent);
}
.doc-code__copy[data-copied] {
  color: var(--color-success);
  border-color: color-mix(in oklab, var(--color-success) 50%, var(--color-border));
}

/* --- Body -----------------------------------------------------------------
   Holds the actual code. We don't style the `<pre>` directly here — the slot
   content (Shiki HTML, hand-coded spans, raw text) already brings its own
   `<pre>`. We just give it consistent padding + horizontal scroll. Tight
   line-height (1.45) so the panel reads like a real editor, not a marketing
   code sample. Background sits at the dark `--color-code-bg` while the outer
   frame is one shade lighter — a thin two-tone editor effect. */
.doc-code__body {
  position: relative;
  max-height: 480px;
  overflow: auto;
  font-size: 12.5px;
  line-height: 1.45;
  background: var(--color-code-bg);
  border-radius: 0 0 8px 8px;
  counter-reset: doc-code-line;
}
.doc-code:not(.doc-code--has-bar) .doc-code__body {
  border-radius: 8px;
}

/* Inner pre / shiki / code elements all share the same compact padding +
   transparent bg so the panel's `--color-code-bg` shows through uniformly.
   The third-party Nuxt Content runtime paints `.line` backgrounds at the
   github-dark-bg colour — we override every nested node to transparent to
   avoid per-line bars. `<style>` here is unscoped on purpose (so the rules
   reach v-html-injected Shiki spans), which means no `:deep()` — selectors
   target by class directly. */
.doc-code__body pre,
.doc-code__body .shiki,
.doc-code__body .shiki-fallback {
  margin: 0;
  /* `0.75rem 0` (no horizontal padding) — the inner `.line` elements pick up
     left padding to leave room for the gutter. */
  padding: 0.75rem 0;
  background: transparent !important;
  background-color: transparent !important;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  white-space: pre;
  overflow-x: auto;
  border: 0;
  border-radius: 0;
}
.doc-code__body code,
.doc-code__body .line,
.doc-code__body .line span {
  background: transparent !important;
  background-color: transparent !important;
}
.doc-code__body code {
  font-family: inherit;
  font-size: inherit;
}

/* --- Line numbers + gutter ---------------------------------------------
   Each `<span class="line">` increments a CSS counter and renders the
   current value as a left-edge gutter via `::before`. The gutter is tiny
   (10px), dim, and right-aligned so the eye reads the code as the primary
   content and the numbers as the secondary scaffold. `tabular-nums` keeps
   columns flush even for 1- vs 2-digit lines. A hairline divider on the
   right of the gutter visually separates numbers from code without adding
   any layout cost.

   The selectors live on `.doc-code__body .line` (not `.shiki .line`) because
   Nuxt Content's `ProsePre` injection puts the `.shiki` class on the outer
   wrapper (which here is the parent `.doc-code`), not on an inner element. */
.doc-code__body .line {
  display: block;
  position: relative;
  min-height: 1lh;
  padding: 0 0.875rem 0 3.25rem;
  counter-increment: doc-code-line;
}
.doc-code__body .line::before {
  content: counter(doc-code-line);
  position: absolute;
  left: 0;
  top: 0;
  width: 2.5rem;
  padding-right: 0.625rem;
  text-align: right;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  line-height: inherit;
  color: color-mix(in oklab, var(--color-text-muted) 60%, transparent);
  user-select: none;
  pointer-events: none;
  border-right: 1px solid color-mix(in oklab, var(--color-border) 35%, transparent);
}

/* Highlight the gutter number when a line is hovered — subtle editor-style
   affordance that helps users when they want to reference a specific line. */
.doc-code__body .line:hover::before {
  color: var(--color-text-dim);
  background: color-mix(in oklab, var(--color-surface) 30%, transparent);
}

/* For the fallback (plain `<pre><code>`) path we don't have `.line` spans, so
   the gutter falls back to no numbering. Pad the body so it still aligns
   visually with the Shiki path. */
.doc-code__body .shiki-fallback {
  padding-left: 3.25rem;
}

/* Hide scrollbars inside the panel (wheel / touch / keyboard still work). */
.doc-code__body {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.doc-code__body::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .doc-code--glow::before {
    animation: none !important;
  }
}
</style>
