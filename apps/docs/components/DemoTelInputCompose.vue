<script setup lang="ts">
import { computed, ref } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { ACountrySelect, usePhoneValidation } from '@alikhalilll/a-tel-input';

const country = ref('EG');
const phone = ref('');

const { validate } = usePhoneValidation();
const result = computed(() =>
  validate({
    country: country.value ? { iso2: country.value } : null,
    phone: phone.value || '',
  })
);

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { ACountrySelect, usePhoneValidation } from '@alikhalilll/a-tel-input';

const country = ref('EG');
const phone = ref('');

const { validate } = usePhoneValidation();
const result = computed(() =>
  validate({
    country: country.value ? { iso2: country.value } : null,
    phone: phone.value || '',
  })
);
\u003c/script>

<template>
  <!-- Stacked layout: country picker on top, plain input below, live E.164 chip on the right -->
  <div class="space-y-2 max-w-sm">
    <div class="flex items-stretch overflow-hidden rounded-md border border-input bg-background shadow-sm">
      <ACountrySelect v-model:selected="country" size="md" class="grow" trigger-class="w-full" />
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="phone"
        type="tel"
        inputmode="numeric"
        placeholder="National number"
        class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @input="(e) => {
          const t = e.target as HTMLInputElement;
          t.value = t.value.replace(/\\D/g, '');
          phone = t.value;
        }"
      />
      <div
        :class="cn(
          'shrink-0 rounded-md border px-2 py-1 font-mono text-xs tabular-nums',
          result.ok
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : 'border-border bg-muted text-muted-foreground'
        )"
      >
        {{ result.full_phone || '+?' }}
      </div>
    </div>
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Custom layout (composed from primitives)
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      Recombined primitives: full-width country trigger on top, a plain national-number
      <code>&lt;input&gt;</code> below, E.164 chip on the right.
    </p>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="max-w-sm space-y-2">
          <div
            class="border-input bg-background flex items-stretch overflow-hidden rounded-md border shadow-sm"
          >
            <ACountrySelect
              v-model:selected="country"
              size="md"
              class="grow"
              trigger-class="w-full"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="phone"
              type="tel"
              inputmode="numeric"
              placeholder="National number"
              class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              @input="
                (e) => {
                  const t = e.target as HTMLInputElement;
                  t.value = t.value.replace(/\\D/g, '');
                  phone = t.value;
                }
              "
            />
            <div
              :class="
                cn(
                  'shrink-0 rounded-md border px-2 py-1 font-mono text-xs tabular-nums',
                  result.ok
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-border bg-surface-2 text-text-muted'
                )
              "
              :title="result.ok ? 'valid' : (result.reason ?? 'incomplete')"
            >
              {{ result.full_phone || '+?' }}
            </div>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
