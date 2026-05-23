<script setup lang="ts">
const year = new Date().getFullYear();

const packages = [
  { label: 'api-provider', to: '/api-provider', accent: 'pkg-api' },
  { label: 'crypto', to: '/crypto', accent: 'pkg-crypto' },
  { label: 'auto-middleware', to: '/auto-middleware', accent: 'pkg-auto' },
  { label: 'ui', to: '/ui', accent: 'pkg-ui' },
];

const resources = [
  { label: 'Documentation', href: '/', external: false },
  {
    label: 'Releases',
    href: 'https://github.com/alikhalilll/ali-nuxt-toolkit/releases',
    external: true,
  },
  {
    label: 'Issues',
    href: 'https://github.com/alikhalilll/ali-nuxt-toolkit/issues',
    external: true,
  },
  {
    label: 'MIT License',
    href: 'https://github.com/alikhalilll/ali-nuxt-toolkit/blob/master/LICENSE',
    external: true,
  },
];

const social = [
  { label: 'GitHub', href: 'https://github.com/alikhalilll', icon: 'github' as const },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/alikhalilll', icon: 'linkedin' as const },
  { label: 'Portfolio', href: 'https://alikhalilll.github.io/', icon: 'portfolio' as const },
  { label: 'Email', href: 'mailto:alikhalilll.dev@gmail.com', icon: 'email' as const },
];
</script>

<template>
  <footer class="app-footer mt-24" role="contentinfo" aria-label="Site footer">
    <!-- Brand-tinted gradient line above the footer — anchors the page bottom. -->
    <div class="app-footer__accent" aria-hidden="true" />

    <div class="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-14">
      <div class="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12 lg:gap-16">
        <!-- Brand column -->
        <div class="footer-brand">
          <NuxtLink to="/" class="footer-brand__link hover:no-underline">
            <span class="footer-brand__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient
                    id="footer-brand-grad"
                    x1="0"
                    y1="0"
                    x2="24"
                    y2="24"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="var(--color-brand)" />
                    <stop offset="0.5" stop-color="var(--color-brand-2)" />
                    <stop offset="1" stop-color="var(--color-brand-3)" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="9" height="9" rx="2" fill="url(#footer-brand-grad)" />
                <text
                  x="6.5"
                  y="10"
                  text-anchor="middle"
                  font-family="ui-monospace, monospace"
                  font-size="9"
                  font-weight="800"
                  letter-spacing="-0.3"
                  fill="#000000"
                >
                  A
                </text>
                <rect
                  x="13"
                  y="2"
                  width="9"
                  height="9"
                  rx="2"
                  fill="url(#footer-brand-grad)"
                  opacity="0.55"
                />
                <rect
                  x="2"
                  y="13"
                  width="9"
                  height="9"
                  rx="2"
                  fill="url(#footer-brand-grad)"
                  opacity="0.55"
                />
                <rect x="13" y="13" width="9" height="9" rx="2" fill="url(#footer-brand-grad)" />
                <text
                  x="17.5"
                  y="21"
                  text-anchor="middle"
                  font-family="ui-monospace, monospace"
                  font-size="9"
                  font-weight="800"
                  letter-spacing="-0.3"
                  fill="#000000"
                >
                  K
                </text>
              </svg>
            </span>
            <span class="footer-brand__word">
              <span class="footer-brand__scope">ali-nuxt</span
              ><span class="footer-brand__sep">/</span
              ><span class="footer-brand__name">toolkit</span>
            </span>
          </NuxtLink>
          <p class="footer-brand__tagline">
            Four focused, strongly-typed Nuxt 3 / 4 modules — independently installable, zero
            overlap. Built by a developer who loves the details.
          </p>

          <!-- "Star on GitHub" CTA — subtle, brand-tinted. -->
          <a
            href="https://github.com/alikhalilll/ali-nuxt-toolkit"
            target="_blank"
            rel="noopener"
            class="footer-star group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
            <span>Star on GitHub</span>
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
              class="footer-star__arrow"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

        <!-- Packages -->
        <nav aria-label="Packages">
          <h4 class="footer-heading">Packages</h4>
          <ul class="footer-list">
            <li v-for="pkg in packages" :key="pkg.to" :class="pkg.accent">
              <NuxtLink :to="pkg.to" class="footer-link">
                <span class="pkg-dot" aria-hidden="true" />
                <span>{{ pkg.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- Resources -->
        <nav aria-label="Resources">
          <h4 class="footer-heading">Resources</h4>
          <ul class="footer-list">
            <li v-for="r in resources" :key="r.label">
              <a
                v-if="r.external"
                :href="r.href"
                target="_blank"
                rel="noopener"
                class="footer-link"
              >
                {{ r.label }}
              </a>
              <NuxtLink v-else :to="r.href" class="footer-link">
                {{ r.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- Connect -->
        <nav aria-label="Connect">
          <h4 class="footer-heading">Connect</h4>
          <div class="footer-social">
            <a
              v-for="item in social"
              :key="item.label"
              :href="item.href"
              :target="item.icon === 'email' ? undefined : '_blank'"
              rel="noopener"
              :aria-label="item.label"
              class="footer-social__btn"
              :title="item.label"
            >
              <svg
                v-if="item.icon === 'github'"
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
                />
              </svg>
              <svg
                v-else-if="item.icon === 'linkedin'"
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M20.45 20.45h-3.55v-5.56c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.65H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"
                />
              </svg>
              <svg
                v-else-if="item.icon === 'portfolio'"
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path
                  d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          </div>
          <p class="footer-email">
            <a href="mailto:alikhalilll.dev@gmail.com" class="footer-link">
              alikhalilll.dev@gmail.com
            </a>
          </p>
        </nav>
      </div>
    </div>

    <!-- Bottom strip -->
    <div class="app-footer__bottom">
      <div
        class="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <p class="text-text-muted">
          Built by
          <a
            href="https://github.com/alikhalilll"
            target="_blank"
            rel="noopener"
            class="footer-link-inline"
          >
            Ali Khalil
          </a>
          · MIT-licensed · © {{ year }}
        </p>
        <p class="text-text-muted">
          <a
            href="https://github.com/alikhalilll/ali-nuxt-toolkit"
            target="_blank"
            rel="noopener"
            class="footer-link-inline"
          >
            Source on GitHub →
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: relative;
  background: color-mix(in oklab, var(--bg) 60%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Brand-tinted accent line above the footer — mirrors the navbar's scrolled shadow. */
.app-footer__accent {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in oklab, var(--color-brand) 35%, transparent) 30%,
    color-mix(in oklab, var(--color-brand-3) 35%, transparent) 70%,
    transparent 100%
  );
}

/* Brand column */
.footer-brand__link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.footer-brand__mark {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in oklab, var(--color-brand) 8%, transparent);
  transition:
    transform 0.25s ease,
    background-color 0.2s ease;
}
.footer-brand__mark svg {
  width: 22px;
  height: 22px;
  filter: drop-shadow(0 2px 6px color-mix(in oklab, var(--color-brand) 25%, transparent));
}
.footer-brand__link:hover .footer-brand__mark {
  background: color-mix(in oklab, var(--color-brand) 14%, transparent);
  transform: translateY(-1px) rotate(-3deg);
}
.footer-brand__word {
  display: inline-flex;
  align-items: baseline;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.footer-brand__scope {
  color: var(--text-dim);
  font-weight: 500;
}
.footer-brand__sep {
  color: var(--color-brand);
  margin: 0 1px;
}
.footer-brand__name {
  color: var(--text);
}
.footer-brand__tagline {
  margin-top: 14px;
  max-width: 24rem;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-dim);
}

/* "Star on GitHub" CTA */
.footer-star {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 500;
  transition:
    border-color 0.2s ease,
    color 0.15s ease,
    background 0.2s ease;
  text-decoration: none;
}
.footer-star:hover {
  border-color: color-mix(in oklab, var(--color-brand) 50%, var(--border));
  color: var(--text);
  background: color-mix(in oklab, var(--color-brand) 8%, var(--surface));
  text-decoration: none;
}
.footer-star svg:first-of-type {
  color: #ffb302;
}
.footer-star__arrow {
  transition: transform 0.2s ease;
}
.footer-star:hover .footer-star__arrow {
  transform: translateX(2px);
}

/* Column heading: small uppercase label with a 2px brand underline. */
.footer-heading {
  margin: 0 0 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  position: relative;
  padding-bottom: 8px;
}
.footer-heading::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 24px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-2));
}

.footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13.5px;
}
.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-dim);
  text-decoration: none;
  transition: color 0.15s ease;
}
.footer-link:hover {
  color: var(--text);
  text-decoration: none;
}

/* Connect column — social icon strip + email line. */
.footer-social {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.footer-social__btn {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--surface) 50%, transparent);
  color: var(--text-dim);
  transition:
    color 0.15s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.15s ease;
  text-decoration: none;
}
.footer-social__btn:hover {
  color: var(--text);
  border-color: color-mix(in oklab, var(--color-brand) 50%, var(--border));
  background: color-mix(in oklab, var(--color-brand) 8%, var(--surface));
  transform: translateY(-1px);
  text-decoration: none;
}
.footer-email {
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-muted);
}

/* Bottom strip — separated by a hairline divider, lower contrast. */
.app-footer__bottom {
  border-top: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
}
.footer-link-inline {
  color: var(--text);
  text-decoration: none;
  transition: color 0.15s ease;
}
.footer-link-inline:hover {
  color: var(--color-brand);
  text-decoration: none;
}

@media (prefers-reduced-motion: reduce) {
  .footer-brand__mark,
  .footer-star__arrow,
  .footer-social__btn {
    transition: none !important;
  }
}
</style>
