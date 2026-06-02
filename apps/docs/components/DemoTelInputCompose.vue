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
      <DemoStage caption="Composed from primitives">
        <div class="compose-stage__field">
          <!-- Row 1 — full-width country trigger. The ACountrySelect's own
               trigger is given `w-full` so it fills the visual width and the
               row reads as a single "picker card". `ACountrySelect` has a
               fragment root (renders reka-ui's PopoverRoot which is a slot),
               so a regular `class` prop on the component would be discarded —
               we wrap it in an explicit `<div>` so our `:deep()` selectors
               below have a real element to scope against. -->
          <div class="compose-stage__row compose-stage__row--picker">
            <span class="compose-stage__hint">Country</span>
            <div class="compose-stage__picker">
              <ACountrySelect v-model:selected="country" size="md" trigger-class="w-full" />
            </div>
          </div>

          <!-- Row 2 — national-number input on the left, E.164 chip on the right.
               Validity drives the chip's tint via `cn()` (emerald when ok, surface-2
               muted otherwise) so the user sees the engine reacting per keystroke. -->
          <div class="compose-stage__row compose-stage__row--number">
            <div class="compose-stage__input-wrap">
              <span class="compose-stage__hint">National number</span>
              <input
                v-model="phone"
                type="tel"
                inputmode="numeric"
                placeholder="01066105963"
                class="compose-stage__input"
                @input="
                  (e) => {
                    const t = e.target as HTMLInputElement;
                    t.value = t.value.replace(/\\D/g, '');
                    phone = t.value;
                  }
                "
              />
            </div>

            <div
              :class="[
                'compose-stage__chip',
                result.ok ? 'compose-stage__chip--ok' : 'compose-stage__chip--idle',
              ]"
              :title="result.ok ? 'valid' : (result.reason ?? 'incomplete')"
            >
              <span class="compose-stage__chip-label">E.164</span>
              <span class="compose-stage__chip-value">
                {{ result.full_phone || '+?' }}
              </span>
              <svg
                v-if="result.ok"
                class="compose-stage__chip-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>
      </DemoStage>
    </DemoTabs>
  </div>
</template>

<style scoped>
/* Stage / frame / caption now live in `DemoStage`. What remains here is
   demo-specific: the two-row field layout, the labelled inputs, and the
   E.164 result chip's state machine. */
.compose-stage__field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.compose-stage__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.compose-stage__row--number {
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
}
.compose-stage__hint {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding-left: 2px;
}

/* The country picker fills the row. Make it look like a native `<select>`:
   - full-width filled box with a visible border + soft surface fill
   - flag sits flush on the left, chevron pinned to the right (the trigger
     uses `inline-flex` so `justify-content: space-between` would collapse
     against its own content — we add a spacer pseudo via gap instead, and
     stretch by giving the flag a fixed slot width)
   - focus / hover lift with a brand-tinted ring */
.compose-stage__picker {
  width: 100%;
}
.compose-stage__picker :deep([data-slot='country-select-trigger']) {
  width: 100%;
  justify-content: flex-start;
  gap: 0.625rem;
  padding: 0 0.75rem;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
  background: color-mix(in oklab, var(--bg) 60%, var(--surface));
  color: var(--color-text);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}
.compose-stage__picker :deep([data-slot='country-select-trigger']:hover) {
  border-color: color-mix(in oklab, var(--color-brand) 35%, var(--color-border));
  background: color-mix(in oklab, var(--bg) 80%, var(--surface));
}
.compose-stage__picker :deep([data-slot='country-select-trigger'][data-state='open']),
.compose-stage__picker :deep([data-slot='country-select-trigger']:focus-visible) {
  border-color: color-mix(in oklab, var(--color-brand) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-brand) 18%, transparent);
}
/* Push the chevron to the right edge — the trigger's children are: flag,
   (label?), chevron. A flex grow on a synthetic spacer before the chevron
   would require slot markup we don't own. Instead, give the chevron itself
   `margin-inline-start: auto` so it floats right against the trigger border. */
.compose-stage__picker :deep(.a-country-select__chevron) {
  margin-inline-start: auto;
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
}

/* National-number row. Stacks the hint label above its own input, so the
   chip on the right can baseline-align with the input field. */
.compose-stage__input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.compose-stage__input {
  height: 40px;
  width: 100%;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
  background: color-mix(in oklab, var(--bg) 60%, var(--surface));
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 13.5px;
  letter-spacing: 0.02em;
  color: var(--color-text);
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}
.compose-stage__input::placeholder {
  color: var(--color-text-muted);
  letter-spacing: normal;
}
.compose-stage__input:focus-visible {
  border-color: color-mix(in oklab, var(--color-brand) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-brand) 18%, transparent);
}

/* E.164 result chip. Two states:
     - idle: muted surface + ghost border + "+?" placeholder text
     - ok:   emerald wash + brand-tinted ring + check icon */
.compose-stage__chip {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  background: color-mix(in oklab, var(--surface) 60%, transparent);
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.compose-stage__chip-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 5px;
  border-radius: 4px;
  background: color-mix(in oklab, var(--surface) 80%, transparent);
  color: var(--color-text-muted);
}
.compose-stage__chip-value {
  color: var(--color-text-dim);
}
.compose-stage__chip-icon {
  flex-shrink: 0;
}
.compose-stage__chip--idle {
  color: var(--color-text-muted);
}
.compose-stage__chip--ok {
  color: var(--color-success);
  background: color-mix(in oklab, var(--color-success) 12%, transparent);
  border-color: color-mix(in oklab, var(--color-success) 45%, transparent);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-success) 25%, transparent);
}
.compose-stage__chip--ok .compose-stage__chip-label {
  background: color-mix(in oklab, var(--color-success) 22%, transparent);
  color: var(--color-success);
}
.compose-stage__chip--ok .compose-stage__chip-value {
  color: var(--color-success);
}

/* Stack the number row on narrow screens — the chip drops below the input
   instead of crowding it. */
@media (max-width: 480px) {
  .compose-stage__row--number {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .compose-stage__chip {
    align-self: stretch;
    justify-content: space-between;
  }
}
</style>
