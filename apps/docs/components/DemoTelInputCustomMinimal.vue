<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDownIcon } from '~/components/icons';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const minimalTheme = {
  '--ak-ui-background': '0 0% 8%',
  '--ak-ui-foreground': '0 0% 98%',
  '--ak-ui-popover': '0 0% 10%',
  '--ak-ui-popover-foreground': '0 0% 98%',
  '--ak-ui-muted': '0 0% 14%',
  '--ak-ui-muted-foreground': '0 0% 70%',
  '--ak-ui-accent': '0 0% 20%',
  '--ak-ui-accent-foreground': '0 0% 98%',
  '--ak-ui-border': '0 0% 22%',
  '--ak-ui-input': '0 0% 22%',
  '--ak-ui-ring': '0 0% 80%',
  '--ak-ui-radius': '0.25rem',
};

const source = `<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDownIcon } from '~/components/icons';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

// Pure grayscale, dense, sharp
const minimalTheme = {
  '--ak-ui-background':         '0 0% 8%',
  '--ak-ui-foreground':         '0 0% 98%',
  '--ak-ui-popover':            '0 0% 10%',
  '--ak-ui-popover-foreground': '0 0% 98%',
  '--ak-ui-muted':              '0 0% 14%',
  '--ak-ui-muted-foreground':   '0 0% 70%',
  '--ak-ui-accent':             '0 0% 20%',
  '--ak-ui-accent-foreground':  '0 0% 98%',
  '--ak-ui-border':             '0 0% 22%',
  '--ak-ui-input':              '0 0% 22%',
  '--ak-ui-ring':               '0 0% 80%',
  '--ak-ui-radius':             '0.25rem',
};
\u003c/script>

<template>
  <div :style="minimalTheme" class="text-foreground p-6 rounded-lg bg-background">
    <label class="mb-2 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      Phone
    </label>

    <ATelInput
      v-model:phone="phone"
      v-model:country="country"
      default-country="GB"
      size="xs"
      show-validation
      :kbd-open="null"
      :kbd-close="null"
    >
      <!-- ISO2-only trigger, no flag, no dial code, no chrome -->
      <template #trigger="{ selectedCountry, open }">
        <button
          type="button"
          class="inline-flex h-full items-center gap-1 border-r border-input bg-transparent px-2 font-mono text-[11px] tracking-wider transition-colors hover:bg-muted"
        >
          <span class="font-semibold">{{ selectedCountry?.raw_data.iso2 ?? '??' }}</span>
          <ChevronDownIcon class="size-3 transition-transform" :class="open && 'rotate-180'" />
        </button>
      </template>
    </ATelInput>
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Minimal · monochrome · xs size · ISO2-only trigger
    </h4>
    <p class="mb-4 text-sm text-text-dim">
      Dense and quiet. Trigger shows only the ISO2 code + a tiny chevron — no flag, no dial code.
      Keyboard hints hidden via <code>:kbd-open="null"</code>.
    </p>

    <DemoTabs :code="source">
      <div
        :style="minimalTheme"
        class="text-foreground rounded-lg border border-border bg-background p-6"
      >
        <div class="max-w-sm">
          <label
            class="text-muted-foreground mb-2 block text-[10px] font-medium tracking-wider uppercase"
          >
            Phone
          </label>

          <ATelInput
            v-model:phone="phone"
            v-model:country="country"
            default-country="GB"
            size="xs"
            show-validation
            :kbd-open="null"
            :kbd-close="null"
          >
            <template #trigger="{ selectedCountry, open }">
              <button
                type="button"
                :data-state="open ? 'open' : 'closed'"
                class="hover:bg-muted data-[state=open]:bg-muted border-input inline-flex h-full shrink-0 items-center gap-1 border-r bg-transparent px-2 font-mono text-[11px] tracking-wider transition-colors focus-visible:outline-none"
                aria-label="Select country"
              >
                <span class="text-foreground font-semibold">
                  {{ selectedCountry?.raw_data.iso2 ?? '??' }}
                </span>
                <ChevronDownIcon
                  class="text-muted-foreground size-3 shrink-0 transition-transform duration-200"
                  :class="open && 'rotate-180'"
                />
              </button>
            </template>
          </ATelInput>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
