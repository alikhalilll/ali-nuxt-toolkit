<script setup lang="ts">
/**
 * Live demo "stage" — a dashed-outline frame with optional caption.
 *
 * API preserved from the previous version:
 *   - `caption` — optional label chip in the top-right
 *   - `center`  — constrain max-width; defaults to true
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
    <div :class="['demo-stage__frame', !center && 'demo-stage__frame--wide']">
      <span v-if="caption" class="demo-stage__caption">{{ caption }}</span>
      <div class="demo-stage__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-stage {
  padding: 1rem 0;
}

.demo-stage__frame {
  position: relative;
  max-width: 28rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  border-radius: 0.75rem;
  outline: 1px dashed var(--color-border);
  outline-offset: -1px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.demo-stage__frame--wide {
  max-width: none;
}

.demo-stage__caption {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  background: var(--color-surface-2);
  font-size: 0.625rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.demo-stage__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .demo-stage__frame {
    padding: 1.5rem 1rem;
  }
}
</style>
