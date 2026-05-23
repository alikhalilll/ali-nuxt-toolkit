<script setup lang="ts">
/**
 * Decorative drifting brand-color orb backdrop. Static (no motion) so the page
 * stays calm; orbs are positioned absolutely inside a fixed wrapper that clips
 * to the viewport — they never cause horizontal scroll.
 */
</script>

<template>
  <div class="hero-bg" aria-hidden="true">
    <div class="hero-orb hero-orb--brand" />
    <div class="hero-orb hero-orb--brand-2" />
    <div class="hero-orb hero-orb--brand-3" />
  </div>
</template>

<style scoped>
.hero-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.hero-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.3;
}
.hero-orb--brand {
  width: 520px;
  height: 520px;
  top: -140px;
  left: -120px;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-brand) 90%, transparent) 0%,
    transparent 65%
  );
}
.hero-orb--brand-2 {
  width: 480px;
  height: 480px;
  top: 200px;
  right: -160px;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-brand-2) 80%, transparent) 0%,
    transparent 65%
  );
  opacity: 0.24;
}
.hero-orb--brand-3 {
  width: 420px;
  height: 420px;
  top: 580px;
  left: 40%;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-brand-3) 80%, transparent) 0%,
    transparent 65%
  );
  opacity: 0.18;
}
</style>
