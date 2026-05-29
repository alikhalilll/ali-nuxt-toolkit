<script setup lang="ts">
/**
 * Rotating install command. The prompt + `pnpm add` are static; only the
 * package name slides up through a fixed-height viewport every 4s. Copy
 * button copies the full command (prompt-free).
 */
const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

const installCommands = [
  'pnpm add @alikhalilll/nuxt-api-provider',
  'pnpm add @alikhalilll/nuxt-crypto',
  'pnpm add @alikhalilll/nuxt-auto-middleware',
  'pnpm add @alikhalilll/a-tel-input',
];
const installPkgs = [
  '@alikhalilll/nuxt-api-provider',
  '@alikhalilll/nuxt-crypto',
  '@alikhalilll/nuxt-auto-middleware',
  '@alikhalilll/a-tel-input',
];
const installShorts = ['api', 'crypto', 'middleware', 'ui'];
const installIndex = ref(0);
const installCopied = ref(false);
let installTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  installTimer = setInterval(() => {
    installIndex.value = (installIndex.value + 1) % installCommands.length;
  }, 4000);
});

onBeforeUnmount(() => {
  if (installTimer) clearInterval(installTimer);
});

async function copyInstall() {
  const cmd = installCommands[installIndex.value];
  if (!cmd) return;
  try {
    await navigator.clipboard.writeText(cmd);
    installCopied.value = true;
    setTimeout(() => (installCopied.value = false), 1500);
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div
    class="reveal install mx-auto mt-8 max-w-md"
    :class="{ 'reveal--in': mounted }"
    style="--reveal-delay: 450ms"
  >
    <div class="install__row">
      <span class="install__prompt" aria-hidden="true">$_</span>
      <span class="install__static">pnpm add</span>
      <div class="install__viewport" aria-live="polite">
        <div
          class="install__track"
          :style="{ transform: `translateY(calc(-${installIndex} * var(--install-line)))` }"
        >
          <div v-for="pkg in installPkgs" :key="pkg" class="install__pkg">
            {{ pkg }}
          </div>
        </div>
      </div>
      <button
        type="button"
        class="install__copy"
        :aria-label="installCopied ? 'Copied' : 'Copy install command'"
        @click="copyInstall"
      >
        <svg
          v-if="!installCopied"
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-success"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>
    <!-- Package dots indicator — click to jump to a specific install command. -->
    <div class="install-dots" aria-hidden="true">
      <button
        v-for="(label, i) in installShorts"
        :key="label"
        type="button"
        :aria-label="`Show install for ${label}`"
        :aria-current="installIndex === i ? 'true' : undefined"
        class="install-dot"
        :class="{ 'install-dot--active': installIndex === i }"
        @click="installIndex = i"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}
.reveal--in {
  opacity: 1;
  transform: translateY(0);
}

.install {
  --install-line: 1.4rem;
}
.install__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  background: color-mix(in oklab, var(--surface) 40%, transparent);
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 13px;
}
.install__prompt {
  color: var(--text-muted);
  user-select: none;
}
.install__static {
  color: var(--text-dim);
  user-select: none;
}
.install__viewport {
  flex: 1;
  min-width: 0;
  height: var(--install-line);
  overflow: hidden;
}
.install__track {
  display: flex;
  flex-direction: column;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.install__pkg {
  height: var(--install-line);
  line-height: var(--install-line);
  font-weight: 600;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.install__copy {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.install__copy:hover {
  color: var(--text);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
}

.install-dots {
  display: flex;
  gap: 4px;
  margin-top: 10px;
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
}
.install-dot {
  padding: 2px 8px;
  border-radius: 999px;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.install-dot:hover {
  color: var(--text-dim);
}
.install-dot--active {
  color: var(--text);
  background: color-mix(in oklab, var(--color-brand) 14%, transparent);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .install__track {
    transition: none !important;
  }
}
</style>
