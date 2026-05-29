<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const acmePhone = ref('');
const acmeCountry = ref<number | null>(null);
const novaPhone = ref('');
const novaCountry = ref<number | null>(null);

const acmeTheme = {
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
};

const novaTheme = {
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
};

const source = `<style>
/* Each tenant gets its own class — variables cascade through portals */
.tenant-acme {
  --ak-ui-popover: 155 50% 8%;
  --ak-ui-accent:  152 60% 30%;
  --ak-ui-ring:    152 70% 50%;
  --ak-ui-border:  155 30% 18%;
  --ak-ui-input:   155 30% 18%;
}
.tenant-nova {
  --ak-ui-popover: 270 40% 8%;
  --ak-ui-accent:  270 50% 30%;
  --ak-ui-ring:    270 90% 65%;
  --ak-ui-border:  270 30% 18%;
  --ak-ui-input:   270 30% 18%;
}
</style>

<template>
  <div class="tenant-acme">
    <ATelInput v-model:phone="acme.phone" v-model:country="acme.country" />
  </div>

  <div class="tenant-nova">
    <ATelInput v-model:phone="nova.phone" v-model:country="nova.country" />
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Multi-tenant — same component, two themes, one page
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Two tenants render side-by-side. Each is wrapped in its own class with its own variables —
      proving the theme is scoped, not global, and that popover portals inherit per-tenant.
    </p>

    <DemoTabs :code="source">
      <div class="grid gap-4 p-5 md:grid-cols-2">
        <div
          :style="acmeTheme"
          class="text-foreground rounded-lg border border-border bg-background p-5"
        >
          <h5
            class="mb-3 text-xs font-semibold tracking-widest uppercase"
            style="color: hsl(152 70% 50%)"
          >
            Acme Inc.
          </h5>
          <ATelInput
            v-model:phone="acmePhone"
            v-model:country="acmeCountry"
            default-country="20"
            show-validation
          />
        </div>

        <div
          :style="novaTheme"
          class="text-foreground rounded-lg border border-border bg-background p-5"
        >
          <h5
            class="mb-3 text-xs font-semibold tracking-widest uppercase"
            style="color: hsl(270 90% 65%)"
          >
            Nova Labs
          </h5>
          <ATelInput
            v-model:phone="novaPhone"
            v-model:country="novaCountry"
            default-country="20"
            show-validation
          />
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
