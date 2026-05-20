<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, Frown, PartyPopper, Sparkles, Smile } from 'lucide-vue-next';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');

const playfulTheme = {
  '--ak-ui-background': '20 40% 7%',
  '--ak-ui-foreground': '30 50% 96%',
  '--ak-ui-popover': '20 40% 9%',
  '--ak-ui-popover-foreground': '30 50% 96%',
  '--ak-ui-muted': '18 30% 15%',
  '--ak-ui-muted-foreground': '25 20% 70%',
  '--ak-ui-accent': '18 70% 35%',
  '--ak-ui-accent-foreground': '30 50% 96%',
  '--ak-ui-border': '18 25% 22%',
  '--ak-ui-input': '18 25% 22%',
  '--ak-ui-ring': '28 100% 60%',
  '--ak-ui-radius': '999px',
};

const source = `<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, Frown, PartyPopper, Sparkles, Smile } from 'lucide-vue-next';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');

// Sunset warm theme + pill radius
const playfulTheme = {
  '--ak-ui-background':         '20 40% 7%',
  '--ak-ui-foreground':         '30 50% 96%',
  '--ak-ui-popover':            '20 40% 9%',
  '--ak-ui-popover-foreground': '30 50% 96%',
  '--ak-ui-muted':              '18 30% 15%',
  '--ak-ui-muted-foreground':   '25 20% 70%',
  '--ak-ui-accent':             '18 70% 35%',
  '--ak-ui-accent-foreground':  '30 50% 96%',
  '--ak-ui-border':             '18 25% 22%',
  '--ak-ui-input':              '18 25% 22%',
  '--ak-ui-ring':               '28 100% 60%',
  '--ak-ui-radius':             '999px',
};
\u003c/script>

<template>
  <div :style="playfulTheme" class="text-foreground p-10 rounded-3xl bg-background">
    <h3 class="mb-2 text-2xl font-semibold" style="color: hsl(30 80% 80%)">
      What's your number?
    </h3>
    <p class="mb-5 text-sm text-muted-foreground">
      We'll only use it to text the confirmation code.
    </p>

    <ATellInput
      v-model:phone="phone"
      v-model:country="country"
      default-country="EG"
      size="xl"
      show-validation
      placeholder="Phone number"
    >
      <!-- Borderless circular-flag trigger so the pill outline stays uninterrupted -->
      <template #trigger="{ selectedCountry, open }">
        <button
          type="button"
          class="inline-flex h-full items-center gap-2 bg-transparent pl-3 pr-2 transition-opacity hover:opacity-80"
        >
          <span class="inline-flex size-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-border/60">
            <img
              v-if="selectedCountry"
              :src="\`https://flagcdn.com/w80/\${selectedCountry.raw_data.iso2.toLowerCase()}.png\`"
              class="size-10 rounded-full object-cover"
            />
          </span>
          <span class="text-sm font-semibold tabular-nums">
            {{ selectedCountry?.raw_data.dial_code ?? '+?' }}
          </span>
          <ChevronDown class="size-4 transition-transform" :class="open && 'rotate-180'" />
        </button>
      </template>

      <!-- Friendly icons -->
      <template #suffix>
        <Smile class="mr-3 size-5" style="color: hsl(28 100% 60%)" />
      </template>

      <template #valid-icon>
        <PartyPopper class="size-6 text-amber-400" />
      </template>

      <template #error-icon>
        <Frown class="size-6 text-destructive" />
      </template>

      <template #item-check>
        <Sparkles class="size-4 text-amber-400" />
      </template>

      <!-- Sparkle + example number hint -->
      <template #hint="{ formatHint }">
        <p class="flex items-center gap-1.5 pl-2 text-xs text-muted-foreground">
          <Sparkles class="size-3" style="color: hsl(28 100% 60%)" />
          <span class="tabular-nums">{{ formatHint }}</span>
        </p>
      </template>
    </ATellInput>
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Playful · sunset theme · pill radius · xl size
    </h4>
    <p class="mb-4 text-sm text-text-dim">
      Marketing-friendly: warm pill, big xl size, smile suffix, party-popper / frown validation,
      sparkle check on the selected row in the picker.
    </p>

    <DemoTabs :code="source">
      <div
        :style="playfulTheme"
        class="text-foreground rounded-3xl border border-border bg-background px-6 py-8 sm:px-10 sm:py-10"
      >
        <div class="mx-auto max-w-md">
          <h3 class="mb-2 text-2xl font-semibold tracking-tight" style="color: hsl(30 80% 80%)">
            What's your number?
          </h3>
          <p class="text-muted-foreground mb-5 text-sm">
            We'll only use it to text the confirmation code.
          </p>

          <ATellInput
            v-model:phone="phone"
            v-model:country="country"
            default-country="EG"
            size="xl"
            show-validation
            placeholder="Phone number"
          >
            <template #trigger="{ selectedCountry, open }">
              <button
                type="button"
                :data-state="open ? 'open' : 'closed'"
                class="inline-flex h-full shrink-0 items-center gap-2 bg-transparent pr-2 pl-3 transition-opacity hover:opacity-80 focus-visible:outline-none"
                aria-label="Select country"
              >
                <span
                  class="ring-border/60 inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2"
                >
                  <img
                    v-if="selectedCountry"
                    :src="`https://flagcdn.com/w80/${selectedCountry.raw_data.iso2.toLowerCase()}.png`"
                    :alt="`${selectedCountry.raw_data.iso2} flag`"
                    class="size-10 rounded-full object-cover"
                  />
                  <span v-else class="text-muted-foreground text-xs">?</span>
                </span>
                <span class="text-foreground text-sm font-semibold tabular-nums">
                  {{ selectedCountry ? selectedCountry.raw_data.dial_code : '+?' }}
                </span>
                <ChevronDown
                  class="text-muted-foreground size-4 shrink-0 transition-transform duration-200"
                  :class="open && 'rotate-180'"
                />
              </button>
            </template>

            <template #suffix>
              <Smile
                class="mr-3 size-5 shrink-0"
                style="color: hsl(28 100% 60%)"
                aria-hidden="true"
              />
            </template>

            <template #valid-icon>
              <PartyPopper class="size-6 shrink-0 text-amber-400" />
            </template>

            <template #error-icon>
              <Frown class="text-destructive size-6 shrink-0" />
            </template>

            <template #item-check>
              <Sparkles class="size-4 shrink-0 text-amber-400" />
            </template>

            <template #hint="{ formatHint }">
              <p class="text-muted-foreground flex items-center gap-1.5 pl-2 text-xs">
                <Sparkles class="size-3" style="color: hsl(28 100% 60%)" />
                <span class="tabular-nums">{{ formatHint }}</span>
              </p>
            </template>
          </ATellInput>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
