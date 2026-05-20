<script setup lang="ts">
import { computed, ref } from 'vue';
import { Phone, Search, ShieldCheck, ShieldX, Sparkles } from 'lucide-vue-next';
import {
  ATellInput,
  defaultFlagUrl,
  type CountryOption,
  type FlagUrlBuilder,
} from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');

const curated = computed<CountryOption[]>(() => [
  mkCountry('EG', 'Egypt', '+20'),
  mkCountry('SA', 'Saudi Arabia', '+966'),
  mkCountry('AE', 'United Arab Emirates', '+971'),
  mkCountry('KW', 'Kuwait', '+965'),
  mkCountry('QA', 'Qatar', '+974'),
  mkCountry('BH', 'Bahrain', '+973'),
  mkCountry('OM', 'Oman', '+968'),
]);

function mkCountry(iso2: string, name: string, dial: string): CountryOption {
  const dial_digits = dial.replace(/\D/g, '');
  return {
    label: `${name} (${dial})`,
    value: iso2,
    search_key: `${name.toLowerCase()} ${dial} ${iso2.toLowerCase()} ${dial_digits}`,
    raw_data: {
      iso2,
      dial_code: dial,
      dial_digits,
      name,
      flag: null,
      source: 'fallback',
      original: {},
    },
  };
}

const hiResFlag: FlagUrlBuilder = (iso2) => defaultFlagUrl(iso2, 80);

function startsWithSearcher(query: string, c: CountryOption) {
  const q = query.toLowerCase().trim();
  return (
    c.raw_data.name.toLowerCase().startsWith(q) ||
    c.raw_data.dial_digits.includes(q.replace(/^\+/, ''))
  );
}

async function alwaysEgypt() {
  return 'EG';
}

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { Phone, Search, ShieldCheck, ShieldX, Sparkles } from 'lucide-vue-next';
import {
  ATellInput,
  defaultFlagUrl,
  type CountryOption,
  type FlagUrlBuilder,
} from '@alikhalilll/ui';

const phone = ref('');
const country = ref('');

// Curated 7-country list overrides the internal REST Countries fetch
const curated = computed<CountryOption[]>(() => [
  mkCountry('EG', 'Egypt', '+20'),
  mkCountry('SA', 'Saudi Arabia', '+966'),
  mkCountry('AE', 'United Arab Emirates', '+971'),
  mkCountry('KW', 'Kuwait', '+965'),
  mkCountry('QA', 'Qatar', '+974'),
  mkCountry('BH', 'Bahrain', '+973'),
  mkCountry('OM', 'Oman', '+968'),
]);

function mkCountry(iso2: string, name: string, dial: string): CountryOption {
  const dial_digits = dial.replace(/\\D/g, '');
  return {
    label: \`\${name} (\${dial})\`,
    value: iso2,
    search_key: \`\${name.toLowerCase()} \${dial} \${iso2.toLowerCase()} \${dial_digits}\`,
    raw_data: { iso2, dial_code: dial, dial_digits, name, flag: null, source: 'fallback', original: {} },
  };
}

// Use 80px-wide flag PNGs (the default is 40)
const hiResFlag: FlagUrlBuilder = (iso2) => defaultFlagUrl(iso2, 80);

// Match against name OR dial code, case-insensitive, starts-with
function startsWithSearcher(query: string, c: CountryOption) {
  const q = query.toLowerCase().trim();
  return (
    c.raw_data.name.toLowerCase().startsWith(q) ||
    c.raw_data.dial_digits.includes(q.replace(/^\\+/, ''))
  );
}

// Pretend a backend told us the user is in Egypt
async function alwaysEgypt() { return 'EG'; }
\u003c/script>

<template>
  <ATellInput
    v-model:phone="phone"
    v-model:country="country"
    default-country="EG"
    show-validation
    :countries="curated"
    :flag-url="hiResFlag"
    :searcher="startsWithSearcher"
    :detector="alwaysEgypt"
  >
    <template #prefix>
      <Phone class="ml-3 size-4 text-muted-foreground" />
    </template>

    <template #valid-icon>
      <Sparkles class="size-5 text-amber-400" />
    </template>

    <template #error-icon>
      <ShieldX class="size-5 text-destructive" />
    </template>

    <template #hint="{ formatHint }">
      <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck class="size-3" />
        <span>Example · </span>
        <span class="tabular-nums">{{ formatHint }}</span>
      </p>
    </template>

    <template #error="{ message, reason }">
      <p class="flex items-center gap-2 text-xs text-destructive">
        <span class="rounded border border-destructive/30 bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
          {{ reason }}
        </span>
        <span>{{ message }}</span>
      </p>
    </template>

    <template #item-check>
      <Sparkles class="size-3.5 text-amber-400" />
    </template>

    <template #group-header="{ label, group }">
      <header
        class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-popover px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
        :class="group === 'suggested' ? 'text-amber-400' : 'text-muted-foreground'"
      >
        <span class="flex items-center gap-1.5">
          <Sparkles v-if="group === 'suggested'" class="size-3" />
          {{ label }}
        </span>
        <span class="font-mono text-muted-foreground/60 normal-case tracking-normal">{{ group }}</span>
      </header>
    </template>

    <template #empty="{ query }">
      <div class="flex flex-col items-center gap-2 px-4 py-8 text-center text-muted-foreground">
        <Search class="size-6 text-muted-foreground/40" />
        <p class="text-sm">No matches for <span class="font-mono text-foreground">"{{ query }}"</span></p>
        <p class="text-xs">Try a country name or +code.</p>
      </div>
    </template>
  </ATellInput>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Everything customized · reference example
    </h4>
    <p class="mb-4 text-sm text-text-dim">
      Curated 7-country list, hi-res flags, name-starts-with searcher, server-side detector (always
      Egypt), plus eight slot overrides — every single visible region replaced.
    </p>

    <DemoTabs :code="source">
      <div class="rounded-xl border border-brand-border bg-surface-2/40 p-6">
        <div class="max-w-md">
          <ATellInput
            v-model:phone="phone"
            v-model:country="country"
            default-country="EG"
            show-validation
            :countries="curated"
            :flag-url="hiResFlag"
            :searcher="startsWithSearcher"
            :detector="alwaysEgypt"
          >
            <template #prefix>
              <Phone class="text-muted-foreground ml-3 size-4 shrink-0" aria-hidden="true" />
            </template>

            <template #valid-icon>
              <Sparkles class="size-5 shrink-0 text-amber-400" aria-hidden="true" />
            </template>

            <template #error-icon>
              <ShieldX class="text-destructive size-5 shrink-0" aria-hidden="true" />
            </template>

            <template #hint="{ formatHint }">
              <p class="text-muted-foreground flex items-center gap-1.5 text-xs">
                <ShieldCheck class="size-3 shrink-0" aria-hidden="true" />
                <span>Example </span>
                <span class="tabular-nums">· {{ formatHint }}</span>
              </p>
            </template>

            <template #error="{ message, reason }">
              <p class="text-destructive flex flex-wrap items-center gap-2 text-xs">
                <span
                  class="bg-destructive/15 border-destructive/30 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase"
                >
                  {{ reason }}
                </span>
                <span>{{ message }}</span>
              </p>
            </template>

            <template #item-check>
              <Sparkles class="size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            </template>

            <template #group-header="{ label, group }">
              <header
                class="border-border bg-popover sticky top-0 z-10 flex items-center justify-between border-b px-3 py-2 text-[10px] font-semibold tracking-wider uppercase"
                :class="group === 'suggested' ? 'text-amber-400' : 'text-muted-foreground'"
              >
                <span class="flex items-center gap-1.5">
                  <Sparkles v-if="group === 'suggested'" class="size-3" />
                  {{ label }}
                </span>
                <span class="text-muted-foreground/60 font-mono tracking-normal normal-case">
                  {{ group }}
                </span>
              </header>
            </template>

            <template #empty="{ query }">
              <div
                class="text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-8 text-center"
              >
                <Search class="text-muted-foreground/40 size-6" aria-hidden="true" />
                <p class="text-sm">
                  No matches for <span class="text-foreground font-mono">"{{ query }}"</span>
                </p>
                <p class="text-text-muted text-xs">Try a country name or +code.</p>
              </div>
            </template>
          </ATellInput>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
