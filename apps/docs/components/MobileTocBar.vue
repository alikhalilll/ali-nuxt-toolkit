<script setup lang="ts">
/**
 * Mobile-only "On this page" surface. Sticks under the AppHeader (top-16)
 * and gives readers three things in one collapsed bar:
 *
 *   1. A label + the title of the section they're currently inside.
 *   2. A position indicator (current section index / total).
 *   3. A hairline scroll-progress bar at the bottom, brand-gradient filled,
 *      so they always know how deep into the page they are without opening
 *      the TOC dropdown.
 *
 * Expanding shows the full section list, styled like the desktop sidebar's
 * dotted-rail TOC so the two surfaces feel like one navigation system.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const toc = useDocToc();
const isOpen = ref(false);

const flatSections = computed(() => {
  const out: { id: string; text: string; depth: number }[] = [];
  const walk = (nodes: typeof toc.value) => {
    if (!nodes) return;
    for (const n of nodes) {
      if (n.depth <= 3) out.push({ id: n.id, text: n.text, depth: n.depth });
      if (n.children?.length) walk(n.children);
    }
  };
  walk(toc.value);
  return out;
});

const sectionIds = computed(() => flatSections.value.map((s) => s.id));
const activeId = useActiveHeading(sectionIds);
const activeIndex = computed(() => {
  const idx = flatSections.value.findIndex((s) => s.id === activeId.value);
  return idx >= 0 ? idx : 0;
});
const activeSection = computed(() => flatSections.value[activeIndex.value] ?? null);

/**
 * Live scroll-progress fraction (0–1). Recomputed on scroll + resize. We use
 * a passive listener and write to `progress.value` directly so the brand bar
 * tracks the user without a frame-by-frame transition.
 */
const progress = ref(0);
function updateProgress() {
  if (typeof document === 'undefined') return;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progress.value = Math.min(1, Math.max(0, window.scrollY / max));
}
onMounted(() => {
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateProgress);
  window.removeEventListener('resize', updateProgress);
});

const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    isOpen.value = false;
  }
);

function scrollTo(id: string, e: MouseEvent) {
  e.preventDefault();
  // Close BEFORE scrolling so the bar's height collapses and the sticky
  // offset shrinks, giving an accurate scroll target.
  isOpen.value = false;
  nextTick(() => scrollToHash(id));
}
</script>

<template>
  <div v-if="flatSections.length" data-mobile-toc-bar :class="['mtoc', isOpen && 'mtoc--open']">
    <button
      type="button"
      class="mtoc__bar"
      :aria-expanded="isOpen"
      aria-label="Toggle on-this-page navigation"
      @click="isOpen = !isOpen"
    >
      <span class="mtoc__label">
        <span class="mtoc__eyebrow">On this page</span>
        <span class="mtoc__current">
          <span class="mtoc__dot" aria-hidden="true" />
          <span class="mtoc__current-text">{{ activeSection?.text ?? 'Overview' }}</span>
        </span>
      </span>

      <span class="mtoc__meta">
        <span class="mtoc__count">
          <span class="mtoc__count-now">{{ activeIndex + 1 }}</span>
          <span class="mtoc__count-sep">/</span>
          <span class="mtoc__count-total">{{ flatSections.length }}</span>
        </span>
        <svg
          class="mtoc__chevron"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>

    <!-- Hairline scroll-progress bar at the bottom of the sticky bar. -->
    <div class="mtoc__progress" aria-hidden="true">
      <span class="mtoc__progress-fill" :style="{ transform: `scaleX(${progress})` }" />
    </div>

    <Transition name="mtoc-panel">
      <div v-if="isOpen" class="mtoc__panel">
        <ul class="mtoc-rail">
          <li
            v-for="(section, i) in flatSections"
            :key="section.id"
            :class="['mtoc-rail__item', section.depth === 3 ? 'mtoc-rail__item--deep' : '']"
          >
            <a
              :href="`#${section.id}`"
              :class="[
                'mtoc-rail__link',
                activeId === section.id ? 'mtoc-rail__link--active' : '',
                i < activeIndex ? 'mtoc-rail__link--past' : '',
              ]"
              @click="scrollTo(section.id, $event)"
            >
              <span class="mtoc-rail__marker" aria-hidden="true" />
              <span class="mtoc-rail__text">{{ section.text }}</span>
            </a>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* --- Outer container ----------------------------------------------------
   Sticks flush under the 64px AppHeader. Negative horizontal margin
   pulls the bar out to the page gutters so it looks edge-to-edge on
   narrow screens. */
.mtoc {
  position: sticky;
  top: 4rem;
  z-index: 20;
  margin: 0 -1rem 1rem;
  border-bottom: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  background: color-mix(in oklab, var(--bg) 88%, transparent);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
}
@media (min-width: 768px) {
  .mtoc {
    display: none;
  }
}
.mtoc--open {
  box-shadow: 0 16px 32px -16px rgba(0, 0, 0, 0.18);
}

/* --- Bar (the always-visible row) ---------------------------------------
   Two columns: label stack on the left, meta cluster on the right. */
.mtoc__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 1rem 0.625rem;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}
.mtoc__bar:hover {
  background: color-mix(in oklab, var(--surface) 40%, transparent);
}
.mtoc__bar:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--color-brand) 50%, transparent);
  outline-offset: -2px;
}

.mtoc__label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.mtoc__eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  line-height: 1.2;
}
.mtoc__current {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.mtoc__dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-brand);
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 50%, transparent);
}
.mtoc__current-text {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.mtoc__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.mtoc__count {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  background: color-mix(in oklab, var(--surface) 60%, transparent);
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-text-dim);
}
.mtoc__count-now {
  color: var(--color-brand);
}
.mtoc__count-sep {
  color: var(--color-text-muted);
  margin: 0 1px;
}
.mtoc__count-total {
  color: var(--color-text-muted);
}
.mtoc__chevron {
  color: var(--color-text-dim);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.mtoc--open .mtoc__chevron {
  transform: rotate(180deg);
  color: var(--color-text);
}

/* --- Progress bar -------------------------------------------------------
   Hairline at the bottom of the sticky bar. The fill scales horizontally
   from 0 to 1 via inline transform; no layout thrash, no flicker. */
.mtoc__progress {
  position: relative;
  height: 2px;
  background: color-mix(in oklab, var(--color-border) 40%, transparent);
  overflow: hidden;
}
.mtoc__progress-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 0.18s linear;
  border-radius: 0 2px 2px 0;
}

/* --- Expanded panel + section rail -------------------------------------
   Same dotted-rail treatment the desktop sidebar uses for its in-page TOC;
   shared mental model across breakpoints. Past sections fade out a touch
   so the user's progression through the page is legible at a glance. */
.mtoc__panel {
  max-height: calc(100dvh - 8rem);
  overflow-y: auto;
  border-top: 1px solid color-mix(in oklab, var(--color-border) 50%, transparent);
  background: color-mix(in oklab, var(--bg) 96%, transparent);
  padding: 12px 16px 16px;
}

.mtoc-rail {
  position: relative;
  margin: 0;
  padding: 0 0 0 12px;
  list-style: none;
  border-left: 1px dashed color-mix(in oklab, var(--color-border) 65%, transparent);
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mtoc-rail__item {
  position: relative;
  margin: 0;
}
.mtoc-rail__item--deep {
  padding-left: 12px;
}
.mtoc-rail__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 12px;
  margin-left: -12px;
  border-radius: 0 6px 6px 0;
  color: var(--color-text-dim);
  font-size: 13px;
  line-height: 1.35;
  text-decoration: none;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.mtoc-rail__link:hover {
  color: var(--color-text);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  text-decoration: none;
}
.mtoc-rail__link--past {
  color: color-mix(in oklab, var(--color-text-dim) 70%, transparent);
}
.mtoc-rail__link--past:hover {
  color: var(--color-text);
}
.mtoc-rail__marker {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-border) 80%, transparent);
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}
.mtoc-rail__link--past .mtoc-rail__marker {
  background: color-mix(in oklab, var(--color-brand) 35%, var(--color-border));
}
.mtoc-rail__link--active {
  color: var(--color-brand);
  font-weight: 600;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--color-brand) 12%, transparent),
    transparent 80%
  );
}
.mtoc-rail__link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: var(--color-brand);
  border-radius: 2px;
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 50%, transparent);
}
.mtoc-rail__link--active .mtoc-rail__marker {
  background: var(--color-brand);
  box-shadow: 0 0 10px color-mix(in oklab, var(--color-brand) 55%, transparent);
}
.mtoc-rail__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- Panel open / close transition -------------------------------------- */
.mtoc-panel-enter-active,
.mtoc-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.mtoc-panel-enter-from,
.mtoc-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .mtoc__chevron,
  .mtoc__progress-fill,
  .mtoc-rail__link,
  .mtoc-rail__marker,
  .mtoc-panel-enter-active,
  .mtoc-panel-leave-active {
    transition: none !important;
  }
}
</style>
