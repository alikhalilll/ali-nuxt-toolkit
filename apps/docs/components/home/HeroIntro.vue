<script setup lang="ts">
/**
 * Hero text block: two-line title (with brand-gradient accent on the second
 * line), one-sentence subtitle, and the primary + secondary CTAs. Reveal-in
 * on mount with a small stagger.
 */
const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});
</script>

<template>
  <div class="text-center">
    <h1
      class="reveal mb-6 text-4xl font-bold tracking-tight text-text sm:text-5xl md:text-[3.5rem]"
      :class="{ 'reveal--in': mounted }"
      style="--reveal-delay: 100ms; letter-spacing: -0.03em; line-height: 1.05"
    >
      The strongly-typed<br />
      <span class="text-gradient-brand">Nuxt toolkit.</span>
    </h1>

    <p
      class="reveal mx-auto mb-9 max-w-xl text-base text-text-dim sm:text-lg"
      :class="{ 'reveal--in': mounted }"
      style="--reveal-delay: 250ms"
    >
      Four focused modules with a framework-agnostic core. Independently installable.
    </p>

    <div
      class="reveal flex flex-wrap items-center justify-center gap-3"
      :class="{ 'reveal--in': mounted }"
      style="--reveal-delay: 350ms"
    >
      <NuxtLink
        to="/api-provider"
        class="bg-gradient-brand inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-semibold !text-black shadow-[0_4px_24px_-8px_rgba(96,165,250,0.6)] transition-[filter] hover:brightness-110 hover:no-underline"
      >
        Get Started
      </NuxtLink>
      <a
        href="https://github.com/alikhalilll/ali-nuxt-toolkit"
        target="_blank"
        rel="noopener"
        class="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface/40 px-6 text-sm font-medium text-text transition-colors hover:border-brand/50 hover:bg-surface hover:no-underline"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
          />
        </svg>
        <span>GitHub</span>
      </a>
    </div>
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
