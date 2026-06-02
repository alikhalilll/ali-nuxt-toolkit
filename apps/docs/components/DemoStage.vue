<script setup lang="ts">
/**
 * Demo preview "stage" — the polished surface that holds a live example.
 *
 * Extracted from `DemoTelInputCompose` so every interactive demo on the
 * docs site can adopt the same visual language: brand-tinted radial wash
 * behind, a centred frame card with hairline border + soft elevation, and
 * an optional uppercase eyebrow caption with a brand-gradient dot.
 *
 * Pair with `<DemoTabs>` for the Preview/Code tab strip — the stage goes
 * inside DemoTabs's default slot (the Preview pane), so the chrome stack
 * reads as: card → tabs → stage → live component.
 *
 *   <DemoTabs :code="source">
 *     <DemoStage caption="Composed from primitives">
 *       <YourLiveComponent />
 *     </DemoStage>
 *   </DemoTabs>
 *
 * Props:
 *   caption · optional eyebrow text rendered above the slot. Hidden when omitted.
 *   center  · constrain the frame's max-width to fit a single component (default).
 *             Pass `:center="false"` for demos that need the full Preview width
 *             (sizes grid, theme matrix, etc.).
 */
withDefaults(
  defineProps<{
    caption?: string;
    center?: boolean;
  }>(),
  { center: true }
);
</script>

<template>
  <div class="demo-stage">
    <div class="demo-stage__bg" aria-hidden="true" />

    <div :class="['demo-stage__frame', !center && 'demo-stage__frame--wide']">
      <div v-if="caption" class="demo-stage__caption">
        <span class="demo-stage__caption-dot" aria-hidden="true" />
        <span>{{ caption }}</span>
      </div>

      <div class="demo-stage__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Stage container ---------------------------------------------------- */
.demo-stage {
  position: relative;
  padding: 28px 20px 32px;
  overflow: hidden;
  isolation: isolate;
}

/* The brand-tinted radial wash sits in a separate layer so it can't bleed
   into child opacity. Two radials — brand on the top-left, brand-2 on the
   bottom-right — for a subtle diagonal motion. */
.demo-stage__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(
      60% 70% at 18% 0%,
      color-mix(in oklab, var(--color-brand) 12%, transparent),
      transparent 70%
    ),
    radial-gradient(
      55% 65% at 100% 100%,
      color-mix(in oklab, var(--color-brand-2) 10%, transparent),
      transparent 70%
    );
  pointer-events: none;
}

/* --- Frame card ----------------------------------------------------------
   Centred surface that holds the live component. Max-width caps it at a
   single-field width by default (~28rem) so it reads as one composed unit.
   `--wide` variant lifts the cap for demos that need horizontal room. */
.demo-stage__frame {
  position: relative;
  max-width: 28rem;
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  background: color-mix(in oklab, var(--bg) 70%, var(--surface));
  box-shadow:
    0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
    0 18px 36px -20px rgba(0, 0, 0, 0.35);
  padding: 18px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.demo-stage__frame--wide {
  max-width: none;
}

/* --- Caption ----------------------------------------------------------- */
.demo-stage__caption {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.demo-stage__caption-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-2));
  box-shadow: 0 0 8px color-mix(in oklab, var(--color-brand) 60%, transparent);
}

/* --- Slot wrapper -------------------------------------------------------
   No layout opinion — just a normal block so the slotted content controls
   its own width / direction / spacing. */
.demo-stage__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
