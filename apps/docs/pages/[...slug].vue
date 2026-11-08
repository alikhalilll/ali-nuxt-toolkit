<script setup lang="ts">
/**
 * Doc page shell.
 *
 * Layout:
 *   - lg+   : 3-column grid — left sidebar, prose, right rail TOC
 *   - md    : 2-column — sidebar + prose
 *   - mobile: single column, TOC hidden
 *
 * Above the prose we render a small page header with:
 *   - A pill eyebrow derived from the route (UI · Vue 3, Nuxt Module, …)
 *   - Optional npm + github chip row for package pages
 * The markdown's own `<h1>` + description paragraph still renders inside
 * the `.prose` block below, so we don't double-print the title.
 */
const route = useRoute();
const {
  public: { siteUrl, siteName, siteDescription },
} = useRuntimeConfig();
const path = computed(() => {
  if (route.path === '/') return '/index';
  return route.path.replace(/\/+$/, '') || '/index';
});

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('docs').path(path.value).first()
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Doc not found', fatal: true });
}

const pageTitle = computed(() => page.value?.title ?? 'Docs');
const pageDescription = computed(() => page.value?.description ?? siteDescription);
const canonical = computed(() => `${siteUrl}${route.path}`);
const fullTitle = computed(() => `${pageTitle.value} · ${siteName}`);

useSeoMeta({
  title: fullTitle,
  description: pageDescription,
  ogType: 'article',
  ogTitle: fullTitle,
  ogDescription: pageDescription,
  ogUrl: canonical,
  ogSiteName: siteName,
  twitterCard: 'summary_large_image',
  twitterTitle: fullTitle,
  twitterDescription: pageDescription,
});

useHead({
  link: [{ rel: 'canonical', href: canonical }],
});

const tocState = useDocToc();
tocState.value = page.value?.body?.toc?.links ?? null;
watch(page, (p) => {
  tocState.value = p?.body?.toc?.links ?? null;
});

/**
 * Category eyebrow derived from route prefix. Keeps the doc page header
 * aligned with the homepage's section eyebrows so readers recognise the
 * visual vocabulary across the site.
 */
const category = computed(() => {
  const p = route.path.replace(/\/+$/, '');
  if (p.startsWith('/ui/smart-skeleton') || p.startsWith('/ui/tel-input')) return 'UI · Vue 3';
  if (p === '/ui' || p.startsWith('/ui')) return 'UI Overview';
  if (p.startsWith('/api-provider')) return 'Nuxt Module · Fetch';
  if (p.startsWith('/crypto')) return 'Nuxt Module · Security';
  if (p.startsWith('/auto-middleware')) return 'Nuxt Module · Routing';
  return 'Docs';
});

const packageName = computed(() => (page.value as { package?: string } | null)?.package ?? null);
const npmUrl = computed(() =>
  packageName.value ? `https://www.npmjs.com/package/${packageName.value}` : null
);

const REPO_URL = 'https://github.com/alikhalilll/ali-nuxt-toolkit';
const PACKAGE_SOURCE_PATHS: Record<string, string> = {
  '@alikhalilll/nuxt-api-provider': 'packages/api-provider',
  '@alikhalilll/nuxt-crypto': 'packages/crypto',
  '@alikhalilll/nuxt-auto-middleware': 'packages/auto-middleware',
  '@alikhalilll/a-tel-input': 'packages/ui-components/ATelInput',
  '@alikhalilll/a-smart-skeleton': 'packages/ui-components/ASmartSkeleton',
};
const sourceUrl = computed(() => {
  const sub = packageName.value ? PACKAGE_SOURCE_PATHS[packageName.value] : null;
  return sub ? `${REPO_URL}/tree/master/${sub}` : REPO_URL;
});
</script>

<template>
  <div class="doc-layout">
    <DocSidebar />

    <main class="doc-layout__main">
      <!-- Page header: eyebrow + optional meta pills. The markdown's own h1
           renders inside ContentRenderer; we don't duplicate it here. -->
      <div class="doc-layout__header">
        <div class="doc-layout__eyebrow">
          <span class="doc-layout__eyebrow-dot" aria-hidden="true" />
          {{ category }}
        </div>

        <div v-if="packageName" class="doc-layout__meta">
          <a
            v-if="npmUrl"
            :href="npmUrl"
            target="_blank"
            rel="noopener"
            class="doc-layout__meta-chip"
            aria-label="View on npm"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M1.763 0h20.474v20.474H12v3.526H6.316v-3.526H1.763V0zm1.105 19.368h5.684V3.684h13.579v15.684h-8.421V5.526h-3.789v13.842H2.868z"
              />
            </svg>
            npm
          </a>
          <a
            :href="sourceUrl"
            target="_blank"
            rel="noopener"
            class="doc-layout__meta-chip"
            aria-label="View source on GitHub"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
              />
            </svg>
            Source
          </a>
        </div>
      </div>

      <article v-if="page" class="prose">
        <ContentRenderer :value="page" />
      </article>

      <DocPager />
    </main>

    <DocToc :links="page?.body?.toc?.links" />
  </div>
</template>

<style scoped>
.doc-layout {
  display: grid;
  grid-template-columns: 16rem minmax(0, 46rem);
  gap: 4rem;
  justify-content: center;
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
}

@media (min-width: 1200px) {
  .doc-layout {
    grid-template-columns: 16rem minmax(0, 46rem) 14rem;
    gap: 4rem;
  }
}

@media (max-width: 860px) {
  .doc-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
    padding: 1rem 1.25rem 2rem;
  }
}

.doc-layout__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.doc-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.doc-layout__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-muted);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.doc-layout__eyebrow-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

.doc-layout__meta {
  display: inline-flex;
  gap: 0.5rem;
}
.doc-layout__meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.625rem;
  border-radius: 0.375rem;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text-dim);
  font-size: 0.75rem;
  font-weight: 500;
  font-family: var(--font-mono);
  transition:
    color 150ms ease,
    box-shadow 150ms ease,
    background 150ms ease;
}
.doc-layout__meta-chip:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
  box-shadow: inset 0 0 0 1px var(--border-strong);
}
</style>
