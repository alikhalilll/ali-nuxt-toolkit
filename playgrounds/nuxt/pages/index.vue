<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">ali-nuxt-toolkit playground</h1>
    <p class="mb-8 text-text-dim">
      Three Nuxt modules, one monorepo. Each demo page below exercises one package end to end. Every
      option documented in each README is reachable from here.
    </p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="rounded-xl border border-border bg-surface p-5">
        <h2 class="mb-2 border-l-[3px] border-accent pl-2 text-lg font-semibold">api-provider</h2>
        <p class="mb-3 text-sm text-text-dim">
          Typed <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">fetch</code>
          client with interceptors, retry/backoff, timeouts, and a framework-agnostic core.
        </p>
        <NuxtLink to="/api-provider">
          <button
            class="cursor-pointer rounded border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
          >
            Open demo →
          </button>
        </NuxtLink>
      </div>

      <div class="rounded-xl border border-border bg-surface p-5">
        <h2 class="mb-2 border-l-[3px] border-accent pl-2 text-lg font-semibold">crypto</h2>
        <p class="mb-3 text-sm text-text-dim">
          AES-256-GCM + PBKDF2 via Web Crypto, with key caching and pluggable algorithms.
        </p>
        <NuxtLink to="/crypto">
          <button
            class="cursor-pointer rounded border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
          >
            Open demo →
          </button>
        </NuxtLink>
      </div>

      <div class="rounded-xl border border-border bg-surface p-5">
        <h2 class="mb-2 border-l-[3px] border-accent pl-2 text-lg font-semibold">
          auto-middleware
        </h2>
        <p class="mb-3 text-sm text-text-dim">
          Declarative layout → middleware mapping with glob patterns, named groups, and per-page
          overrides.
        </p>
        <NuxtLink to="/auto-middleware">
          <button
            class="cursor-pointer rounded border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
          >
            Open demo →
          </button>
        </NuxtLink>
      </div>

      <div class="rounded-xl border border-border bg-surface p-5">
        <h2 class="mb-2 border-l-[3px] border-accent pl-2 text-lg font-semibold">Live layouts</h2>
        <p class="text-sm text-text-dim">
          <NuxtLink to="/dashboard" class="text-accent">/dashboard</NuxtLink>
          runs the
          <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">@auth</code>
          group;
          <NuxtLink to="/admin" class="text-accent">/admin</NuxtLink>
          runs
          <code class="rounded bg-code-bg px-1.5 py-0.5 text-xs text-accent-2">@adminOnly</code>.
          Open the devtools console to see each middleware fire.
        </p>
      </div>
    </div>
  </section>
</template>
