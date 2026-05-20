<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');

/**
 * Each theme is a pure CSS-variable rewrite — no component prop changes, no rebuild.
 * Variables override the `:root, .light` / `.dark` defaults that ship in
 * `@alikhalilll/ui/styles.css`, scoped to a wrapper div via the `:style` binding.
 *
 * The `swatch` is a short visual signature (3 hsl strings) used for the thumbnail row.
 */
interface Theme {
  id: string;
  label: string;
  description: string;
  /** HSL triplets for the swatch dots (background / accent / ring). */
  swatch: [string, string, string];
  /** Raw CSS-variable map written inline on the wrapper. */
  vars: Record<string, string>;
}

const themes: Theme[] = [
  {
    id: 'default-dark',
    label: 'Default (dark)',
    description: 'Shipped dark token set. Neutral surfaces, soft contrast.',
    swatch: ['240 10% 3.9%', '240 4% 16%', '240 5% 84%'],
    vars: {},
  },
  {
    id: 'stripe',
    label: 'Stripe blue',
    description: 'Clean indigo background, subtle blue accent. Form-y, professional.',
    swatch: ['230 35% 7%', '230 50% 25%', '215 100% 70%'],
    vars: {
      '--ak-ui-background': '230 35% 7%',
      '--ak-ui-foreground': '220 30% 96%',
      '--ak-ui-popover': '230 32% 9%',
      '--ak-ui-popover-foreground': '220 30% 96%',
      '--ak-ui-muted': '230 25% 14%',
      '--ak-ui-muted-foreground': '220 15% 65%',
      '--ak-ui-accent': '230 50% 22%',
      '--ak-ui-accent-foreground': '220 30% 96%',
      '--ak-ui-border': '230 20% 18%',
      '--ak-ui-input': '230 20% 18%',
      '--ak-ui-ring': '215 100% 70%',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    description: 'Forest greens with a bright spring-green focus ring.',
    swatch: ['155 50% 6%', '152 60% 30%', '152 70% 50%'],
    vars: {
      '--ak-ui-background': '155 50% 6%',
      '--ak-ui-foreground': '152 60% 96%',
      '--ak-ui-popover': '155 50% 8%',
      '--ak-ui-popover-foreground': '152 60% 96%',
      '--ak-ui-muted': '155 30% 14%',
      '--ak-ui-muted-foreground': '152 20% 70%',
      '--ak-ui-accent': '152 60% 30%',
      '--ak-ui-accent-foreground': '152 60% 96%',
      '--ak-ui-border': '155 30% 18%',
      '--ak-ui-input': '155 30% 18%',
      '--ak-ui-ring': '152 70% 50%',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'Deep purple surfaces, electric violet focus ring.',
    swatch: ['270 40% 6%', '270 50% 30%', '270 90% 65%'],
    vars: {
      '--ak-ui-background': '270 40% 6%',
      '--ak-ui-foreground': '270 30% 96%',
      '--ak-ui-popover': '270 40% 8%',
      '--ak-ui-popover-foreground': '270 30% 96%',
      '--ak-ui-muted': '270 30% 14%',
      '--ak-ui-muted-foreground': '270 15% 70%',
      '--ak-ui-accent': '270 50% 30%',
      '--ak-ui-accent-foreground': '270 30% 96%',
      '--ak-ui-border': '270 30% 18%',
      '--ak-ui-input': '270 30% 18%',
      '--ak-ui-ring': '270 90% 65%',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Warm wine background with a soft pink focus accent.',
    swatch: ['345 40% 6%', '345 50% 30%', '345 85% 60%'],
    vars: {
      '--ak-ui-background': '345 40% 6%',
      '--ak-ui-foreground': '345 30% 96%',
      '--ak-ui-popover': '345 40% 8%',
      '--ak-ui-popover-foreground': '345 30% 96%',
      '--ak-ui-muted': '345 30% 14%',
      '--ak-ui-muted-foreground': '345 15% 70%',
      '--ak-ui-accent': '345 50% 30%',
      '--ak-ui-accent-foreground': '345 30% 96%',
      '--ak-ui-border': '345 30% 18%',
      '--ak-ui-input': '345 30% 18%',
      '--ak-ui-ring': '345 85% 60%',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm amber + coral palette. Energetic, marketing-y.',
    swatch: ['20 40% 7%', '18 70% 35%', '28 100% 60%'],
    vars: {
      '--ak-ui-background': '20 40% 7%',
      '--ak-ui-foreground': '30 50% 96%',
      '--ak-ui-popover': '20 40% 9%',
      '--ak-ui-popover-foreground': '30 50% 96%',
      '--ak-ui-muted': '18 30% 15%',
      '--ak-ui-muted-foreground': '25 20% 70%',
      '--ak-ui-accent': '18 70% 35%',
      '--ak-ui-accent-foreground': '30 50% 96%',
      '--ak-ui-border': '18 25% 20%',
      '--ak-ui-input': '18 25% 20%',
      '--ak-ui-ring': '28 100% 60%',
    },
  },
  {
    id: 'monochrome',
    label: 'Monochrome',
    description: 'Pure grayscale. No hue at all — every component reads as ink.',
    swatch: ['0 0% 8%', '0 0% 22%', '0 0% 80%'],
    vars: {
      '--ak-ui-background': '0 0% 8%',
      '--ak-ui-foreground': '0 0% 98%',
      '--ak-ui-popover': '0 0% 10%',
      '--ak-ui-popover-foreground': '0 0% 98%',
      '--ak-ui-muted': '0 0% 16%',
      '--ak-ui-muted-foreground': '0 0% 70%',
      '--ak-ui-accent': '0 0% 22%',
      '--ak-ui-accent-foreground': '0 0% 98%',
      '--ak-ui-border': '0 0% 20%',
      '--ak-ui-input': '0 0% 20%',
      '--ak-ui-ring': '0 0% 80%',
    },
  },
  {
    id: 'light-paper',
    label: 'Light · Paper',
    description: 'Light theme on warm off-white. Demonstrates the .light cascade.',
    swatch: ['38 25% 96%', '38 15% 88%', '215 80% 50%'],
    vars: {
      '--ak-ui-background': '38 25% 96%',
      '--ak-ui-foreground': '220 15% 18%',
      '--ak-ui-popover': '38 25% 99%',
      '--ak-ui-popover-foreground': '220 15% 18%',
      '--ak-ui-muted': '38 15% 90%',
      '--ak-ui-muted-foreground': '220 10% 45%',
      '--ak-ui-accent': '38 15% 88%',
      '--ak-ui-accent-foreground': '220 15% 18%',
      '--ak-ui-border': '38 15% 80%',
      '--ak-ui-input': '38 15% 80%',
      '--ak-ui-ring': '215 80% 50%',
    },
  },
  {
    id: 'neon-mint',
    label: 'Neon mint',
    description: 'Near-black surfaces with a single luminous mint accent + ring.',
    swatch: ['170 25% 5%', '170 60% 18%', '160 100% 60%'],
    vars: {
      '--ak-ui-background': '170 25% 5%',
      '--ak-ui-foreground': '170 30% 96%',
      '--ak-ui-popover': '170 25% 7%',
      '--ak-ui-popover-foreground': '170 30% 96%',
      '--ak-ui-muted': '170 20% 13%',
      '--ak-ui-muted-foreground': '170 10% 70%',
      '--ak-ui-accent': '170 60% 18%',
      '--ak-ui-accent-foreground': '160 100% 90%',
      '--ak-ui-border': '170 20% 18%',
      '--ak-ui-input': '170 20% 18%',
      '--ak-ui-ring': '160 100% 60%',
    },
  },
];

const activeId = ref<string>('default-dark');
const active = computed(() => themes.find((t) => t.id === activeId.value) ?? themes[0]);

const activeStyle = computed(() => active.value.vars as unknown as Record<string, string>);

const cssSnippet = computed(() => {
  const t = active.value;
  const lines = Object.entries(t.vars).map(([k, v]) => `  ${k}: ${v};`);
  if (lines.length === 0) {
    return `/* ${t.label} — uses the shipped defaults. No overrides needed. */`;
  }
  const target = `${t.id === 'light-paper' ? ':root, .light' : '.theme-' + t.id};`;
  return `/* ${t.label} */\n${target.replace(/;$/, '')} {\n${lines.join('\n')}\n}`;
});

const copied = ref(false);
async function copyCss() {
  try {
    await navigator.clipboard.writeText(cssSnippet.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Theme gallery — every preset is a pure CSS-variable rewrite
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Click any preset to apply it. The same component, same props — only the
      <code class="rounded bg-code-bg px-1 py-0.5 text-xs text-accent-2">--ak-ui-*</code>
      variables change. Copy the snippet below into your own stylesheet to use it.
    </p>

    <!-- Theme thumbnails — each card is its own click target, shows a 3-dot swatch -->
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
      <button
        v-for="t in themes"
        :key="t.id"
        type="button"
        :aria-pressed="activeId === t.id"
        class="group flex flex-col items-start gap-1.5 rounded-md border bg-surface-2/40 p-3 text-left transition-colors"
        :class="
          activeId === t.id
            ? 'border-brand bg-surface-2 ring-1 ring-brand/30'
            : 'border-border hover:border-text/40 hover:bg-surface-2/70'
        "
        @click="activeId = t.id"
      >
        <span class="flex items-center gap-1.5">
          <span
            v-for="(hsl, i) in t.swatch"
            :key="i"
            class="block h-3 w-3 rounded-full ring-1 ring-black/40"
            :style="{ background: `hsl(${hsl})` }"
            aria-hidden="true"
          />
        </span>
        <span class="text-[13px] font-semibold text-text">{{ t.label }}</span>
        <span class="text-[11px] leading-snug text-text-muted">{{ t.description }}</span>
      </button>
    </div>

    <!-- Active theme — apply the CSS vars on a wrapper. The popover portal inherits via cascade. -->
    <div
      :key="activeId"
      :style="activeStyle"
      class="text-foreground mt-5 rounded-lg border border-border bg-background p-5 transition-colors"
    >
      <div class="max-w-sm">
        <ATellInput
          v-model:phone="phone"
          v-model:country="country"
          default-country="SA"
          show-validation
        />
      </div>
    </div>

    <!-- Copy-ready CSS for the active theme -->
    <div class="relative mt-4">
      <pre
        class="mt-0 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 pr-12 font-mono text-[12px] leading-relaxed text-text-dim"
      ><code>{{ cssSnippet }}</code></pre>
      <button
        type="button"
        class="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface px-2 text-[11px] font-medium text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
        :aria-label="copied ? 'Copied' : 'Copy CSS'"
        @click="copyCss"
      >
        {{ copied ? '✓ Copied' : 'Copy' }}
      </button>
    </div>

    <p class="mt-3 text-xs text-text-muted">
      To apply globally, drop the snippet into your global CSS. To scope per-section, replace the
      selector with any class on a wrapper element — the popover portal still inherits the variables
      via the CSS cascade.
    </p>
  </div>
</template>
