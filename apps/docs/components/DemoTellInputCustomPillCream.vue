<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, Smartphone } from 'lucide-vue-next';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('234567890');
const country = ref('US');

const creamTheme = {
  '--ak-ui-background': '36 50% 96%',
  '--ak-ui-foreground': '20 50% 18%',
  '--ak-ui-popover': '36 50% 99%',
  '--ak-ui-popover-foreground': '20 50% 18%',
  '--ak-ui-muted': '36 35% 90%',
  '--ak-ui-muted-foreground': '20 25% 40%',
  '--ak-ui-accent': '36 35% 88%',
  '--ak-ui-accent-foreground': '20 50% 18%',
  '--ak-ui-border': '28 65% 55%',
  '--ak-ui-input': '28 65% 55%',
  '--ak-ui-ring': '28 80% 50%',
  '--ak-ui-radius': '999px',
};

const source = `<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, Smartphone } from 'lucide-vue-next';
import { ATellInput } from '@alikhalilll/ui';

const phone = ref('');
const country = ref('US');

// Warm light-mode palette + pill radius
const creamTheme = {
  '--ak-ui-background':         '36 50% 96%',
  '--ak-ui-foreground':         '20 50% 18%',
  '--ak-ui-popover':            '36 50% 99%',
  '--ak-ui-popover-foreground': '20 50% 18%',
  '--ak-ui-muted':              '36 35% 90%',
  '--ak-ui-muted-foreground':   '20 25% 40%',
  '--ak-ui-accent':             '36 35% 88%',
  '--ak-ui-accent-foreground':  '20 50% 18%',
  '--ak-ui-border':             '28 65% 55%',
  '--ak-ui-input':              '28 65% 55%',
  '--ak-ui-ring':               '28 80% 50%',
  '--ak-ui-radius':             '999px',
};
\u003c/script>

<template>
  <div :style="creamTheme" class="text-foreground p-8 rounded-2xl bg-[hsl(36_50%_94%)]">
    <label class="mb-3 block text-lg font-bold tracking-tight">Phone Number</label>

    <ATellInput
      v-model:phone="phone"
      v-model:country="country"
      default-country="US"
      size="xl"
      field-class="border-2"
      input-class="text-base font-medium tracking-wide"
    >
      <!-- Circular flag in a borderless trigger so the pill outline stays uninterrupted -->
      <template #trigger="{ selectedCountry, open }">
        <button
          type="button"
          class="inline-flex h-full shrink-0 items-center gap-2 bg-transparent pl-3 pr-1 transition-opacity hover:opacity-80"
          aria-label="Select country"
        >
          <span class="inline-flex size-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-background">
            <img
              v-if="selectedCountry"
              :src="\`https://flagcdn.com/w80/\${selectedCountry.raw_data.iso2.toLowerCase()}.png\`"
              class="size-10 rounded-full object-cover"
            />
          </span>
          <ChevronDown
            class="size-4 transition-transform duration-200"
            :class="open && 'rotate-180'"
          />
        </button>
      </template>

      <!-- Phone icon anchored to the right edge -->
      <template #suffix>
        <Smartphone class="mr-3 size-5 shrink-0" />
      </template>

      <!-- Hide the example-number hint for a cleaner aesthetic -->
      <template #hint><span /></template>
    </ATellInput>
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Cream pill · circular flag · phone-icon suffix
    </h4>
    <p class="mb-4 text-sm text-text-dim">
      Warm light-mode theme, pill radius, and a borderless circular-flag trigger. Big bold label
      above. The phone icon on the right is a <code>#suffix</code> slot.
    </p>

    <DemoTabs :code="source">
      <div
        :style="creamTheme"
        class="text-foreground rounded-2xl border border-[hsl(28_65%_88%)] bg-[hsl(36_50%_94%)] p-8"
      >
        <div class="max-w-md">
          <label class="mb-3 block text-lg font-bold tracking-tight">Phone Number</label>

          <ATellInput
            v-model:phone="phone"
            v-model:country="country"
            default-country="US"
            size="xl"
            field-class="border-2"
            input-class="text-base font-medium tracking-wide"
          >
            <template #trigger="{ selectedCountry, open }">
              <button
                type="button"
                :data-state="open ? 'open' : 'closed'"
                class="inline-flex h-full shrink-0 items-center gap-2 bg-transparent pr-1 pl-3 transition-opacity hover:opacity-80 focus-visible:outline-none"
                aria-label="Select country"
              >
                <span
                  class="ring-background inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2"
                  style="background: hsl(36 50% 99%)"
                >
                  <img
                    v-if="selectedCountry"
                    :src="`https://flagcdn.com/w80/${selectedCountry.raw_data.iso2.toLowerCase()}.png`"
                    :alt="`${selectedCountry.raw_data.iso2} flag`"
                    class="size-10 rounded-full object-cover"
                  />
                  <span v-else class="text-muted-foreground text-xs">?</span>
                </span>
                <ChevronDown
                  class="text-muted-foreground size-4 shrink-0 transition-transform duration-200"
                  :class="open && 'rotate-180'"
                />
              </button>
            </template>

            <template #suffix>
              <Smartphone
                class="mr-3 size-5 shrink-0"
                style="color: hsl(20 50% 30%)"
                aria-hidden="true"
              />
            </template>

            <template #hint><span /></template>
          </ATellInput>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
