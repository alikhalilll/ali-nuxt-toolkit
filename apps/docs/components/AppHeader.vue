<template>
  <header class="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur-md">
    <div class="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
      <NuxtLink to="/" class="font-mono text-sm font-semibold text-text hover:no-underline">
        ali-nuxt-toolkit
      </NuxtLink>
      <nav class="flex gap-5 text-sm">
        <NuxtLink
          to="/api-provider"
          class="text-text-dim transition-colors hover:text-text hover:no-underline"
        >
          api-provider
        </NuxtLink>
        <NuxtLink
          to="/crypto"
          class="text-text-dim transition-colors hover:text-text hover:no-underline"
        >
          crypto
        </NuxtLink>
        <NuxtLink
          to="/auto-middleware"
          class="text-text-dim transition-colors hover:text-text hover:no-underline"
        >
          auto-middleware
        </NuxtLink>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener"
          class="text-text-dim transition-colors hover:text-text hover:no-underline"
        >
          GitHub
        </a>
      </nav>
    </div>
  </header>
</template>
