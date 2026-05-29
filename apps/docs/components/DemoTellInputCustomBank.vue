<script setup lang="ts">
import { ref } from 'vue';
import {
  BadgeAlertIcon,
  BadgeCheckIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from '~/components/icons';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const bankTheme = {
  '--ak-ui-background': '222 35% 8%',
  '--ak-ui-foreground': '220 30% 96%',
  '--ak-ui-popover': '222 35% 10%',
  '--ak-ui-popover-foreground': '220 30% 96%',
  '--ak-ui-muted': '222 25% 16%',
  '--ak-ui-muted-foreground': '220 15% 70%',
  '--ak-ui-accent': '222 40% 22%',
  '--ak-ui-accent-foreground': '220 30% 96%',
  '--ak-ui-border': '222 20% 22%',
  '--ak-ui-input': '222 20% 22%',
  '--ak-ui-ring': '215 100% 70%',
  '--ak-ui-radius': '0.5rem',
};

const source = `<script setup lang="ts">
import { ref } from 'vue';
import { BadgeAlertIcon, BadgeCheckIcon, ShieldCheckIcon, SmartphoneIcon } from '~/components/icons';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

// Indigo identity-verification palette
const bankTheme = {
  '--ak-ui-background':         '222 35% 8%',
  '--ak-ui-foreground':         '220 30% 96%',
  '--ak-ui-popover':            '222 35% 10%',
  '--ak-ui-popover-foreground': '220 30% 96%',
  '--ak-ui-muted':              '222 25% 16%',
  '--ak-ui-muted-foreground':   '220 15% 70%',
  '--ak-ui-accent':             '222 40% 22%',
  '--ak-ui-accent-foreground':  '220 30% 96%',
  '--ak-ui-border':             '222 20% 22%',
  '--ak-ui-input':              '222 20% 22%',
  '--ak-ui-ring':               '215 100% 70%',
  '--ak-ui-radius':             '0.5rem',
};
\u003c/script>

<template>
  <div :style="bankTheme" class="text-foreground p-6 rounded-xl bg-background">
    <label class="mb-2 flex items-center gap-1.5 text-sm font-medium">
      <ShieldCheckIcon class="size-3.5 text-emerald-400" />
      Verify your phone
    </label>

    <ATelInput
      v-model:phone="phone"
      v-model:country="country"
      default-country="20"
      show-validation
      placeholder="5XXXXXXXX"
    >
      <!-- Smartphone = "this is a phone field"; Lock would imply password input -->
      <template #prefix>
        <SmartphoneIcon class="ml-3 size-4 text-muted-foreground" />
      </template>

      <!-- BadgeCheck/BadgeAlert match identity-verification context -->
      <template #valid-icon>
        <BadgeCheckIcon class="size-5 text-emerald-400" />
      </template>
      <template #error-icon>
        <BadgeAlertIcon class="size-5 text-destructive" />
      </template>

      <!-- Reason code badge + message -->
      <template #error="{ message, reason }">
        <p class="flex items-center gap-2 text-xs text-destructive">
          <span class="rounded border border-destructive/30 bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            {{ reason }}
          </span>
          <span>{{ message }}</span>
        </p>
      </template>
    </ATelInput>
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Banking · phone-verification icons · indigo theme
    </h4>
    <p class="mb-4 text-sm text-text-dim">
      A phone-verification field for a banking flow. <code>Smartphone</code> prefix signals "phone
      input", <code>BadgeCheck</code> / <code>BadgeAlert</code> for validation match the
      identity-verification context (the number is part of who-you-are, not a secret to hide).
    </p>

    <DemoTabs :code="source">
      <div
        :style="bankTheme"
        class="text-foreground rounded-xl border border-border bg-background p-6"
      >
        <div class="max-w-md">
          <label class="text-foreground mb-2 flex items-center gap-1.5 text-sm font-medium">
            <ShieldCheckIcon class="size-3.5" style="color: hsl(152 70% 60%)" aria-hidden="true" />
            Verify your phone
          </label>

          <ATelInput
            v-model:phone="phone"
            v-model:country="country"
            default-country="20"
            show-validation
            placeholder="5XXXXXXXX"
          >
            <template #prefix>
              <SmartphoneIcon
                class="text-muted-foreground ml-3 size-4 shrink-0"
                aria-hidden="true"
              />
            </template>

            <template #valid-icon>
              <BadgeCheckIcon class="size-5 shrink-0" style="color: hsl(152 70% 60%)" />
            </template>

            <template #error-icon>
              <BadgeAlertIcon class="text-destructive size-5 shrink-0" />
            </template>

            <template #error="{ message, reason }">
              <p class="text-destructive flex items-center gap-2 text-xs">
                <span
                  class="bg-destructive/15 border-destructive/30 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase"
                >
                  {{ reason }}
                </span>
                <span class="leading-tight">{{ message }}</span>
              </p>
            </template>
          </ATelInput>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
