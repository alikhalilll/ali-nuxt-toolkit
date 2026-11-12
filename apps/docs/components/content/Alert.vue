<script setup lang="ts">
/**
 * `::alert{type="…" title="…"}` MDC component.
 *
 * `type` drives the chrome. `info` / `note` / `tip` stay quiet — a thin
 * accent rail on a neutral surface. `warning` (orange) and `danger` (red)
 * are deliberately loud: thicker rail, tinted background, coloured title,
 * and a leading badge icon, so a reader skimming the page can't miss
 * them. `success` is green and sits in the quiet tier.
 *
 * The visual hierarchy exists so disclaimers and pitfalls read the same
 * way across every package's docs page — a shared contract for "this is a
 * footnote" vs "this is a thing you'll get wrong if you ignore it."
 */
import BadgeAlertIcon from '~/components/icons/BadgeAlertIcon.vue';
import ShieldXIcon from '~/components/icons/ShieldXIcon.vue';
import BadgeCheckIcon from '~/components/icons/BadgeCheckIcon.vue';

type AlertType = 'info' | 'warning' | 'danger' | 'success' | 'note' | 'tip';

const props = withDefaults(
  defineProps<{
    type?: AlertType;
    title?: string;
  }>(),
  { type: 'info' }
);

// Loud tiers get a leading icon; quiet tiers don't need one.
const iconFor: Partial<Record<AlertType, unknown>> = {
  warning: BadgeAlertIcon,
  danger: ShieldXIcon,
  success: BadgeCheckIcon,
};

const icon = ((): unknown => iconFor[props.type])();
// `warning` and `danger` get a stronger a11y role — a screen reader
// should treat them as advisories, not plain notes.
const role = props.type === 'warning' || props.type === 'danger' ? 'alert' : 'note';
</script>

<template>
  <div class="doc-callout" :class="`doc-callout--${type}`" :role="role">
    <component
      :is="icon"
      v-if="icon"
      class="doc-callout__icon"
      aria-hidden="true"
      focusable="false"
    />
    <div class="doc-callout__body">
      <p v-if="title" class="doc-callout__title">{{ title }}</p>
      <slot />
    </div>
  </div>
</template>
