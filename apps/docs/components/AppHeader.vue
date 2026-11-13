<script setup lang="ts">
/**
 * Top navigation bar, inspired by nestjs.com.
 *
 * Desktop layout:
 *   [brand]  [center nav: Docs · UI · Packages · GitHub]  [actions: theme + icons]
 *
 * Mobile layout:
 *   [brand]                                                [actions + hamburger]
 *   Hamburger opens a full-sheet overlay with the same nav links.
 *
 * Sticky with a subtle backdrop blur. The brand on the left is a plain
 * mono wordmark — no logo asset ships with this project, so typography
 * carries the identity.
 */
import { ref, watch } from 'vue';

const route = useRoute();
const menuOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  }
);

const isActive = (prefix: string) => {
  const p = route.path.replace(/\/+$/, '');
  if (prefix === '/') return p === '' || p === '/';
  if (prefix === '/ui') return p === '/ui' || p === '/ui/ghost-skeleton' || p === '/ui/tel-input';
  return p === prefix || p.startsWith(`${prefix}/`);
};

const navLinks = [
  { to: '/api-provider', label: 'Docs' },
  { to: '/ui', label: 'UI' },
  { to: '/api-provider', label: 'Modules' },
];
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <!-- Brand -->
      <NuxtLink to="/" class="app-header__brand" aria-label="ali-nuxt-toolkit home">
        <svg
          class="app-header__mark"
          viewBox="0 0 64 64"
          width="28"
          height="28"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
          <circle cx="30" cy="36" r="8" stroke="currentColor" stroke-width="3" />
          <line
            x1="40"
            y1="24"
            x2="40"
            y2="44"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
        <span class="app-header__wordmark">ali-nuxt-toolkit</span>
      </NuxtLink>

      <!-- Center nav (desktop) -->
      <nav class="app-header__nav" aria-label="Primary">
        <NuxtLink
          to="/api-provider"
          :class="['app-header__link', isActive('/api-provider') && 'is-active']"
        >
          Docs
        </NuxtLink>
        <NuxtLink to="/ui" :class="['app-header__link', isActive('/ui') && 'is-active']">
          UI
        </NuxtLink>
        <NuxtLink to="/crypto" :class="['app-header__link', isActive('/crypto') && 'is-active']">
          crypto
        </NuxtLink>
        <NuxtLink
          to="/auto-middleware"
          :class="['app-header__link', isActive('/auto-middleware') && 'is-active']"
        >
          middleware
        </NuxtLink>
      </nav>

      <!-- Right actions -->
      <div class="app-header__actions">
        <a
          href="https://alikhalilll.github.io/en-us"
          target="_blank"
          rel="noopener"
          class="app-header__icon-btn"
          aria-label="Personal website"
          title="Website"
        >
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
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a14 14 0 0 1 0 18" />
            <path d="M12 3a14 14 0 0 0 0 18" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/alikhalilll/"
          target="_blank"
          rel="noopener"
          class="app-header__icon-btn"
          aria-label="LinkedIn"
          title="LinkedIn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"
            />
          </svg>
        </a>
        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit"
          target="_blank"
          rel="noopener"
          class="app-header__icon-btn"
          aria-label="GitHub"
          title="GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
            />
          </svg>
        </a>

        <button
          type="button"
          class="app-header__hamburger"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
          @click="toggleMenu"
        >
          <svg
            v-if="!menuOpen"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <line x1="3" y1="7" x2="21" y2="7" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="17" x2="21" y2="17" />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu sheet -->
    <div v-if="menuOpen" class="app-header__sheet" role="dialog" aria-modal="true">
      <nav aria-label="Mobile navigation">
        <NuxtLink
          to="/api-provider"
          :class="['app-header__sheet-link', isActive('/api-provider') && 'is-active']"
        >
          api-provider
        </NuxtLink>
        <NuxtLink
          to="/crypto"
          :class="['app-header__sheet-link', isActive('/crypto') && 'is-active']"
        >
          crypto
        </NuxtLink>
        <NuxtLink
          to="/auto-middleware"
          :class="['app-header__sheet-link', isActive('/auto-middleware') && 'is-active']"
        >
          auto-middleware
        </NuxtLink>
        <NuxtLink to="/ui" :class="['app-header__sheet-link', isActive('/ui') && 'is-active']">
          UI overview
        </NuxtLink>
        <NuxtLink
          to="/ui/ghost-skeleton"
          :class="['app-header__sheet-link', isActive('/ui/ghost-skeleton') && 'is-active']"
        >
          AGhostSkeleton
        </NuxtLink>
        <NuxtLink
          to="/ui/tel-input"
          :class="['app-header__sheet-link', isActive('/ui/tel-input') && 'is-active']"
        >
          ATelInput
        </NuxtLink>
        <a
          href="https://alikhalilll.github.io/en-us"
          target="_blank"
          rel="noopener"
          class="app-header__sheet-link"
        >
          Website ↗
        </a>
        <a
          href="https://www.linkedin.com/in/alikhalilll/"
          target="_blank"
          rel="noopener"
          class="app-header__sheet-link"
        >
          LinkedIn ↗
        </a>
        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit"
          target="_blank"
          rel="noopener"
          class="app-header__sheet-link"
        >
          GitHub ↗
        </a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in oklab, var(--color-bg) 82%, transparent);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: inset 0 -1px 0 var(--color-border);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
}

/* ─── Brand ─────────────────────────────────────────── */

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  transition: color 150ms ease;
  flex-shrink: 0;
}
.app-header__brand:hover {
  color: var(--color-accent);
}
.app-header__mark {
  color: var(--color-accent);
  flex-shrink: 0;
}

/* ─── Center nav ───────────────────────────────────── */

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.app-header__link {
  position: relative;
  color: var(--color-text-dim);
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 150ms ease;
  padding: 0.25rem 0;
}
.app-header__link:hover {
  color: var(--color-text);
}
.app-header__link.is-active {
  color: var(--color-text);
}
.app-header__link.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.25rem;
  height: 2px;
  border-radius: 2px;
  background: var(--color-accent);
}

/* ─── Right actions ────────────────────────────────── */

.app-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.app-header__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  transition:
    color 150ms ease,
    background 150ms ease;
}
.app-header__icon-btn:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.app-header__hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  transition:
    color 150ms ease,
    background 150ms ease;
}
.app-header__hamburger:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

/* ─── Mobile menu sheet ────────────────────────────── */

.app-header__sheet {
  display: none;
  background: var(--color-bg);
  box-shadow: inset 0 -1px 0 var(--color-border);
  padding: 0.75rem 1rem 1rem;
}
.app-header__sheet nav {
  display: flex;
  flex-direction: column;
}
.app-header__sheet-link {
  padding: 0.6rem 0.5rem;
  border-radius: 0.375rem;
  color: var(--color-text-dim);
  font-size: 0.9375rem;
  font-weight: 500;
  transition:
    color 150ms ease,
    background 150ms ease;
}
.app-header__sheet-link:hover {
  color: var(--color-text);
  background: var(--color-surface);
}
.app-header__sheet-link.is-active {
  color: var(--color-accent);
  background: var(--accent-soft);
}

/* ─── Responsive ───────────────────────────────────── */

@media (max-width: 860px) {
  .app-header__nav {
    display: none;
  }
  /* Nav carries flex:1 on desktop; when it's gone, push actions to the right edge. */
  .app-header__actions {
    margin-left: auto;
  }
  .app-header__hamburger {
    display: inline-flex;
  }
  .app-header__sheet {
    display: block;
  }
}

@media (max-width: 480px) {
  .app-header__inner {
    gap: 0.5rem;
    padding: 0.625rem 1rem;
  }
  .app-header__wordmark {
    font-size: 0.875rem;
  }
}
</style>
