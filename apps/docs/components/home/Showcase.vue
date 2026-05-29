<script setup lang="ts">
import { ATelInput } from '@alikhalilll/a-tel-input';

/**
 * Package showcase code panel. Tabbed dark editor with the active package's
 * code on the left and a live/animated preview on the right.
 *
 *   ui          → live `ATelInput`
 *   api         → animated request log
 *   crypto      → animated lock + cipher chip
 *   middleware  → layout→middleware mapping
 *
 * Auto-advances every 7s; pause-on-hover; manual tab click locks the rotation.
 */
const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

type ShowcaseId = 'ui/tell-input' | 'api-provider' | 'crypto' | 'auto-middleware';
interface ShowcaseTab {
  id: ShowcaseId;
  short: string;
  label: string;
  fn: string;
  tagline: string;
  docs: string;
}
const showcaseTabs: ShowcaseTab[] = [
  {
    id: 'ui/tell-input',
    short: 'ui/tell-input',
    label: '@alikhalilll/a-tel-input',
    fn: 'ATelInput',
    tagline: 'Live phone input · 197 countries · NANP-aware',
    docs: '/ui/tell-input',
  },
  {
    id: 'api-provider',
    short: 'api',
    label: '@alikhalilll/nuxt-api-provider',
    fn: 'useApi<T>',
    tagline: 'Typed fetch · retry · upload + download progress',
    docs: '/api-provider',
  },
  {
    id: 'crypto',
    short: 'crypto',
    label: '@alikhalilll/nuxt-crypto',
    fn: 'useCrypto',
    tagline: 'AES-256-GCM · PBKDF2 · key cache',
    docs: '/crypto',
  },
  {
    id: 'auto-middleware',
    short: 'middleware',
    label: '@alikhalilll/nuxt-auto-middleware',
    fn: 'defineLayoutMiddleware',
    tagline: 'layout → middleware · glob patterns · per-page overrides',
    docs: '/auto-middleware',
  },
];

const showcaseIndex = ref(0);
const showcaseManual = ref(false);
const showcasePaused = ref(false);
let showcaseTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  showcaseTimer = setInterval(() => {
    if (showcaseManual.value || showcasePaused.value) return;
    showcaseIndex.value = (showcaseIndex.value + 1) % showcaseTabs.length;
  }, 7000);
});

onBeforeUnmount(() => {
  if (showcaseTimer) clearInterval(showcaseTimer);
});

function selectShowcase(i: number) {
  showcaseIndex.value = i;
  showcaseManual.value = true;
}
function pauseShowcase() {
  showcasePaused.value = true;
}
function resumeShowcase() {
  showcasePaused.value = false;
}

const currentShowcase = computed(() => showcaseTabs[showcaseIndex.value]);

// Live ATelInput state — owned here since it lives inside the ui exhibit.
const heroPhone = ref('');
const heroCountry = ref<number | null>(null);

interface CodeExample {
  filename: string;
  /** HTML-safe code with span classes (`code-com`, `code-kw`, `code-str`, …) for syntax. */
  code: string;
}
const codeExamples: Record<ShowcaseId, CodeExample> = {
  'ui/tell-input': {
    filename: 'app/components/SignupForm.vue',
    code:
      '<span class="code-tag">&lt;script setup lang="ts"&gt;</span>\n' +
      '<span class="code-kw">import</span> { <span class="code-fn">ATelInput</span> } <span class="code-kw">from</span> <span class="code-str">\'@alikhalilll/a-tel-input\'</span>;\n' +
      '\n' +
      '<span class="code-kw">const</span> phone = <span class="code-fn">ref</span>(<span class="code-str">\'\'</span>);\n' +
      '<span class="code-kw">const</span> country = <span class="code-fn">ref</span>&lt;<span class="code-type">number</span> | <span class="code-type">null</span>&gt;(<span class="code-type">null</span>);\n' +
      '<span class="code-tag">&lt;/script&gt;</span>\n' +
      '\n' +
      '<span class="code-tag">&lt;template&gt;</span>\n' +
      '  <span class="code-tag">&lt;</span><span class="code-fn">ATelInput</span>\n' +
      '    <span class="code-kw">v-model:phone</span>=<span class="code-str">"phone"</span>\n' +
      '    <span class="code-kw">v-model:country</span>=<span class="code-str">"country"</span>\n' +
      '  <span class="code-tag">/&gt;</span>\n' +
      '<span class="code-tag">&lt;/template&gt;</span>',
  },
  'api-provider': {
    filename: 'app/composables/useUser.ts',
    code:
      '<span class="code-com">// Typed fetch · retry · upload + download progress</span>\n' +
      '<span class="code-kw">export const</span> <span class="code-fn">useUser</span> = () =&gt; {\n' +
      '  <span class="code-kw">const</span> { data, pending, refresh } = <span class="code-fn">useApi</span>&lt;<span class="code-type">User</span>&gt;(<span class="code-str">\'/users/1\'</span>, {\n' +
      '    retry: <span class="code-num">3</span>,\n' +
      '    <span class="code-fn">onProgress</span>: (p) =&gt; loaded.value = p,\n' +
      '  });\n' +
      '  <span class="code-kw">return</span> { data, pending, refresh };\n' +
      '};',
  },
  crypto: {
    filename: 'server/api/login.post.ts',
    code:
      '<span class="code-com">// AES-256-GCM · PBKDF2 · server-only mode</span>\n' +
      '<span class="code-kw">import</span> { <span class="code-fn">useCrypto</span> } <span class="code-kw">from</span> <span class="code-str">\'@alikhalilll/nuxt-crypto/server\'</span>;\n' +
      '\n' +
      '<span class="code-kw">export default</span> <span class="code-fn">defineEventHandler</span>(<span class="code-kw">async</span> (event) =&gt; {\n' +
      '  <span class="code-kw">const</span> { encrypt } = <span class="code-fn">useCrypto</span>({ passphrase });\n' +
      '  <span class="code-kw">const</span> token = <span class="code-kw">await</span> <span class="code-fn">encrypt</span>(<span class="code-str">\'hello, world\'</span>);\n' +
      '  <span class="code-kw">return</span> { token };\n' +
      '});',
  },
  'auto-middleware': {
    filename: 'middleware/auto.global.ts',
    code:
      '<span class="code-com">// One mapping. Every page in the layout gets it.</span>\n' +
      '<span class="code-kw">export default</span> <span class="code-fn">defineLayoutMiddleware</span>({\n' +
      '  admin:     [<span class="code-str">\'auth\'</span>, <span class="code-str">\'requireRole:admin\'</span>, <span class="code-str">\'log\'</span>],\n' +
      '  dashboard: [<span class="code-str">\'auth\'</span>, <span class="code-str">\'log\'</span>],\n' +
      '  default:   [<span class="code-str">\'log\'</span>],\n' +
      '});',
  },
};
const currentExample = computed(() => codeExamples[currentShowcase.value.id]);
</script>

<template>
  <div
    class="code-panel-glow reveal mx-auto mt-16 max-w-5xl sm:mt-20"
    :class="{ 'reveal--in': mounted }"
    style="--reveal-delay: 500ms"
  >
    <div class="code-panel" @mouseenter="pauseShowcase" @mouseleave="resumeShowcase">
      <!-- Top chrome: tabs across the panel, one per package, each with a small
           leading icon. -->
      <div class="code-panel__chrome" role="tablist" aria-label="Package showcase">
        <button
          v-for="(tab, i) in showcaseTabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="showcaseIndex === i"
          :class="['code-panel__tab', showcaseIndex === i && 'code-panel__tab--active']"
          @click="selectShowcase(i)"
        >
          <svg
            v-if="tab.id === 'ui/tell-input'"
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <svg
            v-else-if="tab.id === 'api-provider'"
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.4 0 4.6.9 6.3 2.4" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
          <svg
            v-else-if="tab.id === 'crypto'"
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>{{ tab.short }}</span>
        </button>
      </div>

      <!-- Body: code on the left, live/animated preview on the right. -->
      <div class="code-panel__body">
        <div class="code-panel__code">
          <div class="code-panel__filename">{{ currentExample.filename }}</div>
          <Transition name="code-fade" mode="out-in">
            <pre
              :key="`code-${currentShowcase.id}`"
              class="code-panel__source"
              v-html="currentExample.code"
            />
          </Transition>
        </div>

        <div class="code-panel__preview">
          <Transition name="code-fade" mode="out-in">
            <div :key="`vis-${currentShowcase.id}`" class="code-panel__preview-inner">
              <!-- ui · live ATelInput -->
              <template v-if="currentShowcase.id === 'ui/tell-input'">
                <ClientOnly>
                  <ATelInput
                    v-model:phone="heroPhone"
                    v-model:country="heroCountry"
                    show-validation
                  />
                  <template #fallback>
                    <div class="showcase-skeleton" />
                  </template>
                </ClientOnly>
                <p class="preview-hint">
                  Try <code>+447911 123 456</code> or
                  <code dir="rtl">٠١٠٦٦١٠٥٩٦٣</code>
                </p>
              </template>

              <!-- api · animated request log -->
              <ul v-else-if="currentShowcase.id === 'api-provider'" class="req-log">
                <li class="req-row" style="--i: 0">
                  <span class="req-method req-method--get">GET</span>
                  <span class="req-path">/users/1</span>
                  <span class="req-spacer" />
                  <span class="req-time">24ms</span>
                  <span class="req-status req-status--ok">200</span>
                </li>
                <li class="req-row" style="--i: 1">
                  <span class="req-method req-method--post">POST</span>
                  <span class="req-path">/uploads</span>
                  <span class="req-progress"><span class="req-progress__fill" /></span>
                  <span class="req-status req-status--pending">67%</span>
                </li>
                <li class="req-row" style="--i: 2">
                  <span class="req-method req-method--get">GET</span>
                  <span class="req-path">/metrics</span>
                  <span class="req-spacer" />
                  <span class="req-time">156ms · retry 1</span>
                  <span class="req-status req-status--ok">200</span>
                </li>
              </ul>

              <!-- crypto · lock + cipher -->
              <div v-else-if="currentShowcase.id === 'crypto'" class="crypto-vis">
                <div class="crypto-lock">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      class="crypto-lock__shackle"
                      d="M10 14V10a6 6 0 0 1 12 0v4"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                    />
                    <rect
                      x="6"
                      y="14"
                      width="20"
                      height="14"
                      rx="3"
                      fill="currentColor"
                      opacity="0.18"
                    />
                    <rect
                      x="6"
                      y="14"
                      width="20"
                      height="14"
                      rx="3"
                      stroke="currentColor"
                      stroke-width="2.4"
                    />
                    <circle cx="16" cy="20" r="1.6" fill="currentColor" />
                    <path
                      d="M16 21.5v3"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>
                <div class="crypto-flow">
                  <span class="exhibit__chip exhibit__chip--in">"hello, world"</span>
                  <span class="exhibit__arrow">→</span>
                  <span class="exhibit__chip exhibit__chip--out exhibit__cipher"
                    >a4b8e9c5f2d1…</span
                  >
                </div>
              </div>

              <!-- middleware · layout → middleware chain -->
              <ul v-else class="mw-chain">
                <li class="mw-row" style="--i: 0">
                  <span class="mw-layout">admin</span>
                  <span class="mw-arrow">→</span>
                  <span class="mw-pill">auth</span>
                  <span class="mw-pill">role:admin</span>
                  <span class="mw-pill">log</span>
                </li>
                <li class="mw-row" style="--i: 1">
                  <span class="mw-layout">dashboard</span>
                  <span class="mw-arrow">→</span>
                  <span class="mw-pill">auth</span>
                  <span class="mw-pill">log</span>
                </li>
                <li class="mw-row" style="--i: 2">
                  <span class="mw-layout">default</span>
                  <span class="mw-arrow">→</span>
                  <span class="mw-pill">log</span>
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reveal — the showcase panel + its rotating glow halo come in together,
   starting blurred and out of focus, then settling into a sharp panel with
   the spinning brand-gradient glow visible behind. */
.reveal {
  opacity: 0;
  transform: translateY(16px) scale(0.985);
  filter: blur(22px);
  transition:
    opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.9s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
  /* `will-change` hints the browser to promote the blur to a separate
     compositor layer so the transition is smooth. */
  will-change: opacity, transform, filter;
}
.reveal--in {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* ─────────────────────── Panel chrome + rotating glow ─────────────────────── */
.code-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
  background: color-mix(in oklab, var(--code-bg) 80%, var(--bg));
  overflow: hidden;
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
  box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.45);
}

@property --glow-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.code-panel-glow {
  position: relative;
  isolation: isolate;
}
.code-panel-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: conic-gradient(
    from var(--glow-angle),
    #60a5fa 0%,
    #22d3ee 25%,
    #a78bfa 50%,
    #f472b6 75%,
    #60a5fa 100%
  );
  filter: blur(18px);
  opacity: 0.7;
  z-index: -1;
  animation: code-panel-glow 6s linear infinite;
  pointer-events: none;
}
@keyframes code-panel-glow {
  to {
    --glow-angle: 360deg;
  }
}

.code-panel__chrome {
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 6px 8px 0;
  background: color-mix(in oklab, var(--bg) 70%, var(--code-bg));
  border-bottom: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  /* Only 4 tabs and they always fit — kill both scrollbars. */
  overflow: hidden;
}
.code-panel__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    border-color 0.2s ease,
    background 0.15s ease;
  margin-bottom: -1px;
}
.code-panel__tab:hover {
  color: var(--text-dim);
}
.code-panel__tab--active {
  color: var(--text);
  border-bottom-color: var(--color-brand);
  background: color-mix(in oklab, var(--color-brand) 6%, transparent);
}

/* ───────────────────────────── Body layout ─────────────────────────────── */
.code-panel__body {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  min-height: 320px;
}
@media (max-width: 768px) {
  .code-panel__body {
    grid-template-columns: 1fr;
  }
}

.code-panel__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 24px;
  background: color-mix(in oklab, var(--bg) 30%, transparent);
  border-left: 1px solid color-mix(in oklab, var(--border) 35%, transparent);
  min-width: 0;
  overflow: hidden;
}
@media (max-width: 768px) {
  .code-panel__preview {
    border-left: 0;
    border-top: 1px solid color-mix(in oklab, var(--border) 35%, transparent);
  }
}
.code-panel__preview-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  width: 100%;
}

.code-panel__code {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.code-panel__filename {
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in oklab, var(--border) 40%, transparent);
  font-size: 11.5px;
  color: var(--text-muted);
}
.code-panel__source {
  flex: 1;
  margin: 0;
  padding: 14px 16px;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre;
  overflow-x: auto;
}

/* Hide every scrollbar inside the showcase container (and the container
   itself) — content can still scroll via wheel / touch / keyboard. */
.code-panel,
.code-panel * {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.code-panel::-webkit-scrollbar,
.code-panel *::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.code-fade-enter-active,
.code-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.code-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.code-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Hint line beneath the live ATelInput in the ui exhibit. */
.preview-hint {
  font-size: 11.5px;
  color: var(--text-muted);
  font-family: ui-monospace, monospace;
  text-align: center;
  margin: 0;
}
.preview-hint code {
  color: var(--text-dim);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
}
.showcase-skeleton {
  height: 43px;
  width: 100%;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--surface-2) 0%,
    color-mix(in oklab, var(--surface-2) 70%, var(--surface) 30%) 50%,
    var(--surface-2) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

/* ───────────────────── api · request log exhibit ─────────────────────── */
.req-log {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.req-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--surface) 55%, transparent);
  border: 1px solid var(--border-soft);
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  color: var(--text);
  opacity: 0;
  transform: translateX(-6px);
  animation: req-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--i, 0) * 110ms + 80ms);
}
@keyframes req-in {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.req-method {
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
}
.req-method--get {
  background: color-mix(in oklab, var(--color-success) 18%, transparent);
  color: var(--color-success);
}
.req-method--post {
  background: color-mix(in oklab, var(--color-brand) 18%, transparent);
  color: var(--color-brand);
}
.req-path {
  color: var(--text-dim);
}
.req-spacer {
  flex: 1;
}
.req-progress {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.req-progress__fill {
  display: block;
  height: 100%;
  width: 67%;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  animation: req-pulse 2.4s ease-in-out infinite;
}
@keyframes req-pulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}
.req-time {
  font-size: 10.5px;
  color: var(--text-muted);
}
.req-status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.req-status--ok {
  background: color-mix(in oklab, var(--color-success) 18%, transparent);
  color: var(--color-success);
}
.req-status--pending {
  background: color-mix(in oklab, var(--color-brand) 18%, transparent);
  color: var(--color-brand);
}

/* ─────────────────── crypto · lock + cipher exhibit ─────────────────── */
.crypto-vis {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 14px 0 8px;
}
.crypto-lock {
  color: var(--color-brand);
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 6px 18px color-mix(in oklab, var(--color-brand) 35%, transparent));
}
.crypto-lock svg {
  width: 100%;
  height: 100%;
}
.crypto-lock__shackle {
  transform-origin: 16px 14px;
  animation: lock-shackle 4s ease-in-out infinite;
}
@keyframes lock-shackle {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  20%,
  40% {
    transform: translateY(-3px);
  }
}
.crypto-flow {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.exhibit__chip {
  display: inline-flex;
  align-items: center;
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: var(--code-bg);
  color: var(--text-dim);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.exhibit__chip--out {
  color: var(--color-brand-2);
}
.exhibit__cipher {
  background: linear-gradient(
    90deg,
    var(--color-brand) 0%,
    var(--color-brand-2) 50%,
    var(--color-brand-3) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: cipher-shift 3.2s linear infinite;
}
@keyframes cipher-shift {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 200% 50%;
  }
}
.exhibit__arrow {
  color: var(--color-brand);
  font-weight: 600;
}

/* ─────────────── middleware · layout → chain exhibit ─────────────── */
.mw-chain {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.mw-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 9px 12px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--surface) 55%, transparent);
  border: 1px solid var(--border-soft);
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  opacity: 0;
  transform: translateX(-6px);
  animation: req-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--i, 0) * 110ms + 80ms);
}
.mw-layout {
  color: var(--text);
  font-weight: 600;
  min-width: 84px;
}
.mw-arrow {
  color: var(--color-brand);
  font-weight: 700;
}
.mw-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-brand) 14%, transparent);
  color: var(--color-brand);
  font-size: 10.5px;
}

@media (prefers-reduced-motion: reduce) {
  .code-panel-glow::before,
  .crypto-lock__shackle,
  .exhibit__cipher,
  .req-progress__fill,
  .req-row,
  .mw-row,
  .showcase-skeleton {
    animation: none !important;
  }
  .req-row,
  .mw-row {
    opacity: 1 !important;
    transform: none !important;
  }
  .code-fade-enter-active,
  .code-fade-leave-active {
    transition: none !important;
  }
  /* Reduced-motion users get the final state without the blur-in transition. */
  .reveal {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
}
</style>

<!-- Non-scoped: syntax-highlight colors apply to spans injected via v-html
     (scoped CSS would miss them, since v-html content doesn't receive the
     `data-v-…` attribute). Matches Shiki's GitHub Light / GitHub Dark
     palette used elsewhere on the site, so docs code blocks and the hero
     showcase share one visual language. -->
<style>
.code-panel__source {
  color: #1f2328;
}
.code-com {
  color: #6e7781;
  font-style: italic;
}
.code-kw {
  color: #cf222e;
  font-weight: 500;
}
.code-fn {
  color: #8250df;
}
.code-str {
  color: #0a3069;
}
.code-num {
  color: #0550ae;
}
.code-type {
  color: #953800;
}
.code-tag {
  color: #116329;
}

html.dark .code-panel__source {
  color: #e6edf3;
}
html.dark .code-com {
  color: #8b949e;
}
html.dark .code-kw {
  color: #ff7b72;
}
html.dark .code-fn {
  color: #d2a8ff;
}
html.dark .code-str {
  color: #a5d6ff;
}
html.dark .code-num {
  color: #79c0ff;
}
html.dark .code-type {
  color: #ffa657;
}
html.dark .code-tag {
  color: #7ee787;
}
</style>
