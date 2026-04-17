<template>
  <section class="mx-auto max-w-4xl px-6 py-16">
    <div class="mb-12 text-center">
      <h1 class="mb-3 text-4xl font-semibold tracking-tight">ali-nuxt-toolkit</h1>
      <p class="mx-auto max-w-xl text-base text-text-dim">
        Three focused, strongly-typed Nuxt 3 / 4 modules. Pick one — or all three — and keep reading
        for installation and usage.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        class="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent"
      >
        <h3 class="mb-2 text-base font-semibold text-text">@alikhalilll/nuxt-api-provider</h3>
        <p class="mb-4 text-sm text-text-dim">
          Typed <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">fetch</code>
          client with interceptors, retry/backoff, timeouts, and a unified upload + download
          progress hook.
        </p>
        <NuxtLink to="/api-provider" class="text-sm font-semibold">Read the guide →</NuxtLink>
      </article>

      <article
        class="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent"
      >
        <h3 class="mb-2 text-base font-semibold text-text">@alikhalilll/nuxt-crypto</h3>
        <p class="mb-4 text-sm text-text-dim">
          AES-256-GCM + PBKDF2 via the Web Crypto API, with key caching and pluggable algorithms.
          Server-only mode keeps the passphrase off the client.
        </p>
        <NuxtLink to="/crypto" class="text-sm font-semibold">Read the guide →</NuxtLink>
      </article>

      <article
        class="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent"
      >
        <h3 class="mb-2 text-base font-semibold text-text">@alikhalilll/nuxt-auto-middleware</h3>
        <p class="mb-4 text-sm text-text-dim">
          Layout → middleware mapping with glob patterns, named groups, per-page overrides, and a
          typed middleware-name registry.
        </p>
        <NuxtLink to="/auto-middleware" class="text-sm font-semibold">Read the guide →</NuxtLink>
      </article>
    </div>
  </section>
</template>
