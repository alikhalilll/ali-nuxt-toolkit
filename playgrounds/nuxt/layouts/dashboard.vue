<template>
  <div class="mx-auto max-w-5xl px-6 py-8 pb-16">
    <AppNav />
    <span
      class="mb-4 inline-block rounded-md border border-accent bg-surface px-3 py-1.5 text-xs uppercase tracking-widest text-accent"
    >
      layout: dashboard · @auth runs
    </span>
    <slot />
  </div>
</template>
