<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const hue = ref(215);
const sat = ref(75);
const ringLightness = ref(60);

const theme = computed(() => {
  const h = hue.value;
  const s = sat.value;
  return {
    '--ak-ui-background': `${h} ${Math.round(s * 0.5)}% 7%`,
    '--ak-ui-foreground': `${h} 30% 96%`,
    '--ak-ui-popover': `${h} ${Math.round(s * 0.45)}% 9%`,
    '--ak-ui-popover-foreground': `${h} 30% 96%`,
    '--ak-ui-muted': `${h} ${Math.round(s * 0.4)}% 14%`,
    '--ak-ui-muted-foreground': `${h} ${Math.round(s * 0.25)}% 70%`,
    '--ak-ui-accent': `${h} ${Math.round(s * 0.55)}% 22%`,
    '--ak-ui-accent-foreground': `${h} 30% 96%`,
    '--ak-ui-border': `${h} ${Math.round(s * 0.35)}% 18%`,
    '--ak-ui-input': `${h} ${Math.round(s * 0.35)}% 18%`,
    '--ak-ui-ring': `${h} ${s}% ${ringLightness.value}%`,
  };
});

const cssSnippet = computed(() => {
  const lines = Object.entries(theme.value).map(([k, v]) => `  ${k}: ${v};`);
  return `/* Brand · hue ${hue.value}° · saturation ${sat.value}% */
.theme-brand {
${lines.join('\n')}
}`;
});

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);
const hue = ref(215);
const sat = ref(75);

// Compose a 5-step palette on a single hue. Background darkest, ring brightest.
const theme = computed(() => {
  const h = hue.value;
  const s = sat.value;
  return {
    '--ak-ui-background': \`\${h} \${Math.round(s * 0.5)}% 7%\`,
    '--ak-ui-popover':    \`\${h} \${Math.round(s * 0.45)}% 9%\`,
    '--ak-ui-muted':      \`\${h} \${Math.round(s * 0.4)}% 14%\`,
    '--ak-ui-accent':     \`\${h} \${Math.round(s * 0.55)}% 22%\`,
    '--ak-ui-border':     \`\${h} \${Math.round(s * 0.35)}% 18%\`,
    '--ak-ui-input':      \`\${h} \${Math.round(s * 0.35)}% 18%\`,
    '--ak-ui-ring':       \`\${h} \${s}% 60%\`,
    // …foreground variants kept on default light
  };
});
\u003c/script>

<template>
  <div :style="theme" class="text-foreground p-5 rounded-lg bg-background">
    <ATelInput
      v-model:phone="phone"
      v-model:country="country"
      default-country="20"
      show-validation
    />
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Brand-color picker — dial in your hue, get a matching theme
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      The whole palette is derived from a single hue. Slide to see the input + picker reskin in real
      time. The Code tab shows the live <code>theme</code> object you'd bind to <code>:style</code>.
    </p>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-5 grid gap-3 sm:grid-cols-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs text-text-dim">Hue · {{ hue }}°</span>
            <input
              v-model.number="hue"
              type="range"
              min="0"
              max="360"
              step="1"
              class="accent-text"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs text-text-dim">Saturation · {{ sat }}%</span>
            <input
              v-model.number="sat"
              type="range"
              min="0"
              max="100"
              step="1"
              class="accent-text"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs text-text-dim">Ring lightness · {{ ringLightness }}%</span>
            <input
              v-model.number="ringLightness"
              type="range"
              min="35"
              max="85"
              step="1"
              class="accent-text"
            />
          </label>
        </div>

        <div class="mb-4 flex flex-wrap gap-1.5 text-[11px]">
          <button
            v-for="(preset, i) in [
              { h: 215, s: 100, l: 70, name: 'Sky' },
              { h: 152, s: 70, l: 50, name: 'Emerald' },
              { h: 0, s: 75, l: 60, name: 'Crimson' },
              { h: 28, s: 100, l: 60, name: 'Amber' },
              { h: 270, s: 90, l: 65, name: 'Violet' },
              { h: 0, s: 0, l: 80, name: 'Mono' },
            ]"
            :key="i"
            type="button"
            class="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-medium text-text-dim transition-colors hover:border-text/40 hover:text-text"
            @click="
              () => {
                hue = preset.h;
                sat = preset.s;
                ringLightness = preset.l;
              }
            "
          >
            <span
              class="mr-1 inline-block h-2 w-2 rounded-full align-middle"
              :style="{ background: `hsl(${preset.h} ${preset.s}% ${preset.l}%)` }"
            />
            {{ preset.name }}
          </button>
        </div>

        <div
          :style="theme"
          class="text-foreground rounded-lg border border-border bg-background p-5 transition-colors"
        >
          <div class="max-w-sm">
            <ATelInput
              v-model:phone="phone"
              v-model:country="country"
              default-country="20"
              show-validation
            />
          </div>
        </div>

        <DocOutput class="mt-4" lang="css" label="generated.css" :value="cssSnippet" />
      </div>
    </DemoTabs>
  </div>
</template>
