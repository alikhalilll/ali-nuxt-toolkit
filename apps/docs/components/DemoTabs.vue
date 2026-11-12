<script setup lang="ts">
/**
 * Two-tab wrapper — Preview / Code — used across interactive demos.
 *
 * API preserved. Chrome is minimal: tab labels inline, no bar fill, hairline
 * separator between the tabs and the preview surface.
 */
import { ref, watch } from 'vue';
import { CheckIcon, CopyIcon } from '~/components/icons';
import { highlight } from '~/composables/useShiki';

const props = withDefaults(
  defineProps<{
    code: string;
    lang?: string;
  }>(),
  { lang: 'vue' }
);

const activeTab = ref<'preview' | 'code'>('preview');
const copied = ref(false);
const highlighted = ref<string>('');

watch(
  () => [props.code, props.lang] as const,
  async ([code, lang]) => {
    if (!code) {
      highlighted.value = '';
      return;
    }
    try {
      highlighted.value = await highlight(code, lang);
    } catch {
      highlighted.value = `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  },
  { immediate: true }
);

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c]!
  );
}

async function copy() {
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
  <div class="demo-tabs">
    <div class="demo-tabs__bar" role="tablist" aria-label="Demo view">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'preview'"
        :class="['demo-tabs__tab', activeTab === 'preview' && 'demo-tabs__tab--active']"
        @click="activeTab = 'preview'"
      >
        Preview
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'code'"
        :class="['demo-tabs__tab', activeTab === 'code' && 'demo-tabs__tab--active']"
        @click="activeTab = 'code'"
      >
        Code
      </button>
      <span class="demo-tabs__spacer" />
      <button
        v-if="activeTab === 'code'"
        type="button"
        class="demo-tabs__copy"
        :aria-label="copied ? 'Copied' : 'Copy code'"
        @click="copy"
      >
        <CheckIcon v-if="copied" class="size-3" />
        <CopyIcon v-else class="size-3" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>

    <div v-show="activeTab === 'preview'" class="demo-tabs__preview">
      <slot />
    </div>

    <DocCodeBlock v-show="activeTab === 'code'" flush class="demo-tabs__code">
      <div v-html="highlighted" />
    </DocCodeBlock>
  </div>
</template>

<style scoped>
.demo-tabs {
  margin: 1rem 0 1.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.demo-tabs__bar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  box-shadow: inset 0 -1px 0 var(--color-border);
  font-size: 0.75rem;
}

.demo-tabs__tab {
  position: relative;
  padding: 0.375rem 0.75rem;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 120ms ease;
}
.demo-tabs__tab:hover {
  color: var(--color-text-dim);
}
.demo-tabs__tab--active {
  color: var(--color-text);
}
.demo-tabs__tab--active::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: -0.25rem;
  height: 1px;
  background: var(--color-text);
}

.demo-tabs__spacer {
  flex: 1;
}

.demo-tabs__copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: transparent;
  border: 0;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 120ms ease;
}
.demo-tabs__copy:hover {
  color: var(--color-text);
}

/* One wrapper = the DemoTabs card. The preview surface sits inside with
   consistent padding + a subtle contrast background, so individual demos
   don't need to add their own card chrome and we never end up card-in-card. */
.demo-tabs__preview {
  padding: 1.25rem;
  background: color-mix(in oklab, var(--color-surface) 50%, var(--color-bg));
}
@media (min-width: 640px) {
  .demo-tabs__preview {
    padding: 1.5rem;
  }
}

.demo-tabs__code :deep(.doc-code__body) {
  max-height: 32rem;
  overflow-y: auto;
}
</style>
