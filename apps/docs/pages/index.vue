<script setup lang="ts">
/**
 * Home page — nestjs-inspired hero + per-package presentational sections.
 *
 * Shape:
 *   1. Hero (nestjs style): big headline, concise tagline, two CTAs, install chip.
 *   2. Five sections, one per package. Each is a self-contained band with
 *      eyebrow, name, description, feature chips, Docs CTA, and a framed demo.
 */
const {
  public: { siteUrl, siteName, siteDescription },
} = useRuntimeConfig();
const canonical = `${siteUrl}/`;

useSeoMeta({
  title: siteName,
  description: siteDescription,
  ogTitle: siteName,
  ogDescription: siteDescription,
  ogUrl: canonical,
  ogType: 'website',
  twitterTitle: siteName,
  twitterDescription: siteDescription,
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: canonical }],
});
</script>

<template>
  <div class="home">
    <!-- ───── Hero (nestjs-inspired) ─────────────────────── -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__inner">
        <div class="hero__eyebrow">
          <span class="hero__eyebrow-dot" aria-hidden="true" />
          Nuxt 3 / 4 · Vue 3 · TypeScript
        </div>

        <h1 id="hero-title" class="hero__title">More than just<br />a Nuxt starter kit.</h1>

        <p class="hero__tagline">
          Five focused, production-grade packages for Nuxt 3 / 4 and Vue 3 — a typed fetch client,
          encryption, layout-based middleware, and two headless UI components. Pick one, pick all,
          ship faster.
        </p>

        <div class="hero__ctas">
          <NuxtLink to="/api-provider" class="hero__cta hero__cta--primary">
            Get started
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </NuxtLink>
          <a
            href="https://github.com/alikhalilll/ali-nuxt-toolkit"
            target="_blank"
            rel="noopener"
            class="hero__cta hero__cta--ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
              />
            </svg>
            Star on GitHub
          </a>
        </div>

        <code class="hero__install">
          <span class="hero__install-prompt">$</span>
          <span class="hero__install-pm">pnpm</span>
          <span class="hero__install-action">add</span>
          <span class="hero__install-pkg">@alikhalilll/a-smart-skeleton</span>
        </code>

        <!-- Stats strip — compact row, like nestjs's trusted-by band -->
        <div class="hero__stats" aria-label="Project stats">
          <div class="hero__stat">
            <span class="hero__stat-num">5</span>
            <span class="hero__stat-label">packages</span>
          </div>
          <span class="hero__stat-sep" aria-hidden="true" />
          <div class="hero__stat">
            <span class="hero__stat-num">MIT</span>
            <span class="hero__stat-label">license</span>
          </div>
          <span class="hero__stat-sep" aria-hidden="true" />
          <div class="hero__stat">
            <span class="hero__stat-num">Nuxt 3+</span>
            <span class="hero__stat-label">tested</span>
          </div>
          <span class="hero__stat-sep" aria-hidden="true" />
          <div class="hero__stat">
            <span class="hero__stat-num">SSR</span>
            <span class="hero__stat-label">first-class</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ───── Section 1: a-smart-skeleton ─────────────────────────────── -->
    <section id="smart-skeleton" class="pkg">
      <div class="pkg__head">
        <div class="pkg__eyebrow">UI · Vue 3</div>
        <svg
          class="pkg__seal"
          viewBox="0 0 64 64"
          width="56"
          height="56"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
          <rect x="18" y="24" width="28" height="3" rx="1.5" fill="currentColor" />
          <rect x="18" y="31" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.65" />
          <rect x="18" y="38" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.35" />
        </svg>
        <h2 class="pkg__name">a-smart-skeleton</h2>
        <p class="pkg__pitch">
          A skeleton that <strong>measures itself</strong> from your real component. One template,
          zero layout shift, chrome captured verbatim from the real card — including backgrounds,
          borders, and shadows.
        </p>
        <div class="pkg__chips">
          <span class="chip">Zero layout shift</span>
          <span class="chip">Chrome capture</span>
          <span class="chip">Synced shimmer</span>
          <span class="chip">Reduced-motion aware</span>
        </div>
        <NuxtLink to="/ui/smart-skeleton" class="pkg__cta">
          Read the docs
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </NuxtLink>
      </div>
      <div class="pkg__demo"><HomeDemoSmartSkeleton /></div>
    </section>

    <!-- ───── Section 2: a-tel-input ─────────────────────────────────── -->
    <section id="tel-input" class="pkg">
      <div class="pkg__head">
        <div class="pkg__eyebrow">UI · Vue 3</div>
        <svg
          class="pkg__seal"
          viewBox="0 0 64 64"
          width="56"
          height="56"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
          <rect
            x="22"
            y="12"
            width="20"
            height="40"
            rx="4"
            stroke="currentColor"
            stroke-width="2.5"
          />
          <line
            x1="28"
            y1="16"
            x2="36"
            y2="16"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            opacity="0.6"
          />
          <g fill="currentColor">
            <circle cx="28" cy="24" r="1.3" />
            <circle cx="32" cy="24" r="1.3" />
            <circle cx="36" cy="24" r="1.3" />
            <circle cx="28" cy="30" r="1.3" />
            <circle cx="32" cy="30" r="1.3" />
            <circle cx="36" cy="30" r="1.3" />
            <circle cx="28" cy="36" r="1.3" />
            <circle cx="32" cy="36" r="1.3" />
            <circle cx="36" cy="36" r="1.3" />
          </g>
          <circle cx="32" cy="44" r="2.5" fill="currentColor" />
        </svg>
        <h2 class="pkg__name">a-tel-input</h2>
        <p class="pkg__pitch">
          An international phone input that gets out of the way. Country auto-detect, real-time
          <code>libphonenumber-js</code> validation, a responsive popover / drawer picker, and
          first-class VeeValidate + Zod wiring.
        </p>
        <div class="pkg__chips">
          <span class="chip">Auto country detect</span>
          <span class="chip">libphonenumber validation</span>
          <span class="chip">VeeValidate + Zod</span>
          <span class="chip">RTL + i18n</span>
        </div>
        <NuxtLink to="/ui/tel-input" class="pkg__cta">
          Read the docs
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </NuxtLink>
      </div>
      <div class="pkg__demo"><HomeDemoTelInput /></div>
    </section>

    <!-- ───── Section 3: nuxt-api-provider ───────────────────────────── -->
    <section id="api-provider" class="pkg">
      <div class="pkg__head">
        <div class="pkg__eyebrow">Nuxt Module</div>
        <svg
          class="pkg__seal"
          viewBox="0 0 64 64"
          width="56"
          height="56"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
          <path
            d="M 27 20 Q 20 20 20 27 L 20 29 Q 20 32 16 32 Q 20 32 20 35 L 20 37 Q 20 44 27 44"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M 37 20 Q 44 20 44 27 L 44 29 Q 44 32 48 32 Q 44 32 44 35 L 44 37 Q 44 44 37 44"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <h2 class="pkg__name">nuxt-api-provider</h2>
        <p class="pkg__pitch">
          A typed <code>fetch</code> client with TanStack-Query-style caching, interceptors, retry
          with backoff, and upload / download progress — plus a framework-agnostic core for Nitro
          and workers.
        </p>
        <div class="pkg__chips">
          <span class="chip">Typed end-to-end</span>
          <span class="chip">Cache + SWR</span>
          <span class="chip">Retry + backoff</span>
          <span class="chip">Upload progress</span>
        </div>
        <NuxtLink to="/api-provider" class="pkg__cta">
          Read the docs
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </NuxtLink>
      </div>
      <div class="pkg__demo"><HomeDemoApi /></div>
    </section>

    <!-- ───── Section 4: nuxt-crypto ─────────────────────────────────── -->
    <section id="crypto" class="pkg">
      <div class="pkg__head">
        <div class="pkg__eyebrow">Nuxt Module</div>
        <svg
          class="pkg__seal"
          viewBox="0 0 64 64"
          width="56"
          height="56"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
          <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <g transform="translate(20 32)">
              <line x1="-4" y1="0" x2="4" y2="0" />
              <line x1="0" y1="-4" x2="0" y2="4" />
              <line x1="-3" y1="-3" x2="3" y2="3" />
              <line x1="3" y1="-3" x2="-3" y2="3" />
            </g>
            <g transform="translate(32 32)">
              <line x1="-4" y1="0" x2="4" y2="0" />
              <line x1="0" y1="-4" x2="0" y2="4" />
              <line x1="-3" y1="-3" x2="3" y2="3" />
              <line x1="3" y1="-3" x2="-3" y2="3" />
            </g>
            <g transform="translate(44 32)">
              <line x1="-4" y1="0" x2="4" y2="0" />
              <line x1="0" y1="-4" x2="0" y2="4" />
              <line x1="-3" y1="-3" x2="3" y2="3" />
              <line x1="3" y1="-3" x2="-3" y2="3" />
            </g>
          </g>
        </svg>
        <h2 class="pkg__name">nuxt-crypto</h2>
        <p class="pkg__pitch">
          AES-256-GCM + PBKDF2 encryption built on the Web Crypto API. Optional device-fingerprint
          binding, pluggable algorithms, and a server-only mode so the passphrase never ships to the
          browser.
        </p>
        <div class="pkg__chips">
          <span class="chip">AES-256-GCM</span>
          <span class="chip">PBKDF2 key cache</span>
          <span class="chip">Device fingerprint</span>
          <span class="chip">Server-only mode</span>
        </div>
        <NuxtLink to="/crypto" class="pkg__cta">
          Read the docs
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </NuxtLink>
      </div>
      <div class="pkg__demo"><HomeDemoCrypto /></div>
    </section>

    <!-- ───── Section 5: nuxt-auto-middleware ────────────────────────── -->
    <section id="auto-middleware" class="pkg">
      <div class="pkg__head">
        <div class="pkg__eyebrow">Nuxt Module</div>
        <svg
          class="pkg__seal"
          viewBox="0 0 64 64"
          width="56"
          height="56"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
          <line
            x1="20"
            y1="22"
            x2="42"
            y2="46"
            stroke="currentColor"
            stroke-width="3.5"
            stroke-linecap="round"
          />
          <line
            x1="30"
            y1="30"
            x2="22"
            y2="46"
            stroke="currentColor"
            stroke-width="3.5"
            stroke-linecap="round"
          />
        </svg>
        <h2 class="pkg__name">nuxt-auto-middleware</h2>
        <p class="pkg__pitch">
          Declarative layout-based route middleware for Nuxt 3 / 4. Glob matching, named groups,
          per-page overrides, and a typed registry so middleware names are compile-time errors when
          they drift.
        </p>
        <div class="pkg__chips">
          <span class="chip">Layout-based</span>
          <span class="chip">Glob patterns</span>
          <span class="chip">Named groups</span>
          <span class="chip">Typed registry</span>
        </div>
        <NuxtLink to="/auto-middleware" class="pkg__cta">
          Read the docs
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </NuxtLink>
      </div>
      <div class="pkg__demo"><HomeDemoMiddleware /></div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

/* ─── Hero (nestjs-inspired) ──────────────────────────────── */

.hero {
  position: relative;
  padding: 5rem 0 4rem;
  isolation: isolate;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0 -4rem;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    ellipse 60% 50% at 50% 0%,
    color-mix(in oklab, var(--color-accent) 12%, transparent),
    transparent 70%
  );
}

.hero__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text-dim);
  font-size: 0.8125rem;
  font-weight: 500;
}
.hero__eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
}

.hero__title {
  margin: 0.5rem 0 0;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.035em;
  line-height: 1.02;
}

.hero__tagline {
  margin: 0;
  max-width: 36rem;
  font-size: clamp(1rem, 1.4vw, 1.1875rem);
  line-height: 1.55;
  color: var(--color-text-dim);
}

.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  transition:
    color 150ms ease,
    background 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}
.hero__cta--primary {
  background: var(--color-accent);
  color: #0a0a0a;
}
.hero__cta--primary:hover {
  background: color-mix(in oklab, var(--color-accent) 85%, white);
  transform: translateY(-1px);
}
.hero__cta--ghost {
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text);
}
.hero__cta--ghost:hover {
  background: var(--color-surface-hover);
  box-shadow: inset 0 0 0 1px var(--border-strong);
}
.hero__cta svg {
  transition: transform 150ms ease;
}
.hero__cta--primary:hover svg {
  transform: translateX(2px);
}

.hero__install {
  display: inline-flex;
  align-items: baseline;
  gap: 0.625rem;
  margin-top: 0.75rem;
  padding: 0.75rem 1.125rem;
  border-radius: 0.5rem;
  background: var(--color-code-bg);
  box-shadow: inset 0 0 0 1px var(--color-border);
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}
.hero__install-prompt {
  color: var(--color-text-muted);
}
.hero__install-pm {
  color: var(--note);
  font-weight: 500;
}
.hero__install-action {
  color: var(--danger);
  font-weight: 500;
}
.hero__install-pkg {
  color: var(--info);
}

.hero__stats {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 1.25rem;
  margin-top: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.hero__stat {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}
.hero__stat-num {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-mono);
  letter-spacing: -0.015em;
}
.hero__stat-label {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.hero__stat-sep {
  width: 1px;
  height: 1.5rem;
  background: var(--color-border);
}

/* ─── Package sections ────────────────────────────────────── */

.pkg {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 3.5rem 0;
  box-shadow: inset 0 1px 0 var(--color-border);
}

.pkg__head {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  max-width: 44rem;
}

.pkg__eyebrow {
  display: inline-block;
  align-self: flex-start;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--color-accent);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pkg__seal {
  color: var(--color-accent);
  margin-bottom: 0.25rem;
}

.pkg__name {
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.1;
  color: var(--color-text);
  font-family: var(--font-mono);
}

.pkg__pitch {
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--color-text-dim);
}
.pkg__pitch :deep(strong) {
  color: var(--color-text);
  font-weight: 600;
}
.pkg__pitch :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--color-text);
  background: var(--accent-soft);
  padding: 0.125em 0.35em;
  border-radius: 4px;
  font-weight: 500;
  box-shadow: inset 0 0 0 1px var(--accent-muted);
}

.pkg__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.chip {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text-dim);
  font-size: 0.75rem;
  font-weight: 500;
}

.pkg__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  align-self: flex-start;
  margin-top: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: inset 0 0 0 1px var(--color-border);
  transition:
    color 150ms ease,
    background 150ms ease,
    box-shadow 150ms ease;
}
.pkg__cta:hover {
  color: var(--color-accent);
  background: var(--color-surface-hover);
  box-shadow: inset 0 0 0 1px var(--accent-muted);
}
.pkg__cta svg {
  transition: transform 150ms ease;
}
.pkg__cta:hover svg {
  transform: translateX(2px);
}

.pkg__demo {
  padding: 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(180deg, var(--color-surface-2), var(--color-surface) 60%);
  box-shadow:
    inset 0 0 0 1px var(--color-border),
    0 1px 0 0 rgba(255, 255, 255, 0.04) inset;
}

.pkg__demo :deep(.my-6),
.pkg__demo :deep(.my-8),
.pkg__demo :deep(.demo-tabs),
.pkg__demo :deep(.demo-stage) {
  margin: 0;
}

/* ─── Responsive ─────────────────────────────────────────── */

@media (max-width: 640px) {
  .home {
    padding: 0 1rem 3rem;
  }
  .hero {
    padding: 3rem 0 2.5rem;
  }
  .hero__ctas {
    width: 100%;
    flex-direction: column;
    gap: 0.5rem;
  }
  .hero__cta {
    justify-content: center;
    width: 100%;
  }
  .hero__stats {
    padding: 0.75rem 1rem;
    gap: 0.5rem 0.75rem;
  }
  .hero__stat-sep {
    display: none;
  }
  .pkg {
    gap: 1.25rem;
    padding: 2.25rem 0;
  }
  .pkg__demo {
    padding: 0.75rem;
  }
}

@media (max-width: 420px) {
  .hero__install {
    font-size: 0.8125rem;
  }
}
</style>
