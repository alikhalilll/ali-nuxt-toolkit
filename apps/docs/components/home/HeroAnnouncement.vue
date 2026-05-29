<script setup lang="ts">
/**
 * Small "New" announcement pill above the hero title. Fades in on mount.
 */
const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});
</script>

<template>
  <div
    class="reveal mb-10 flex justify-center"
    :class="{ 'reveal--in': mounted }"
    style="--reveal-delay: 0ms"
  >
    <a
      href="https://www.npmjs.com/package/@alikhalilll/nuxt-api-provider"
      target="_blank"
      rel="noopener"
      class="group inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs text-text-dim transition-colors hover:border-brand hover:text-text hover:no-underline"
    >
      <span
        class="bg-gradient-brand rounded-full px-1.5 py-[1px] text-[10px] font-semibold !text-black"
      >
        New
      </span>
      <span>ATelInput is now international + accessible</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-transform group-hover:translate-x-0.5"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </a>
  </div>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}
.reveal--in {
  opacity: 1;
  transform: translateY(0);
}
</style>
