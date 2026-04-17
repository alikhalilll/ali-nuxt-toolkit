<script setup lang="ts">
const route = useRoute();
const {
  public: { siteUrl, siteName, siteDescription },
} = useRuntimeConfig();
const path = computed(() => (route.path === '/' ? '/index' : route.path));

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
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: pageTitle.value,
          description: pageDescription.value,
          url: canonical.value,
          isPartOf: {
            '@type': 'WebSite',
            name: siteName,
            url: siteUrl,
          },
        })
      ),
    },
  ],
});

const tocState = useDocToc();
tocState.value = page.value?.body?.toc?.links ?? null;
watch(page, (p) => {
  tocState.value = p?.body?.toc?.links ?? null;
});

const packageName = computed(() => (page.value as { package?: string } | null)?.package ?? null);
const npmUrl = computed(() =>
  packageName.value ? `https://www.npmjs.com/package/${packageName.value}` : null
);

function enhanceCodeBlocks() {
  if (!import.meta.client) return;
  const pres = document.querySelectorAll<HTMLPreElement>('article.prose pre');
  pres.forEach((pre) => {
    if (pre.dataset.enhanced) return;
    pre.dataset.enhanced = '1';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = copyIconSvg();

    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      const text = (code?.innerText ?? pre.innerText).replace(/\n$/, '');
      try {
        await navigator.clipboard.writeText(text);
        btn.innerHTML = checkIconSvg();
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = copyIconSvg();
          btn.classList.remove('copied');
        }, 1500);
      } catch {
        /* ignore */
      }
    });

    pre.appendChild(btn);
  });
}

function copyIconSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
}
function checkIconSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
}

onMounted(() => {
  nextTick(enhanceCodeBlocks);
});
watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    enhanceCodeBlocks();
  }
);
</script>

<template>
  <div
    class="mx-auto grid max-w-[1400px] gap-10 px-4 py-6 pb-16 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:py-8 xl:grid-cols-[220px_minmax(0,1fr)_200px]"
  >
    <DocSidebar />
    <main class="min-w-0 pb-[50vh]">
      <!-- Breadcrumb -->
      <nav class="mb-4 flex items-center gap-1.5 text-[13px] text-text-dim" aria-label="Breadcrumb">
        <NuxtLink to="/" class="transition-colors hover:text-text hover:no-underline"
          >Docs</NuxtLink
        >
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
          aria-hidden="true"
          class="text-text-muted"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span class="text-text">{{ pageTitle }}</span>
      </nav>

      <!-- Meta row: npm + source -->
      <div v-if="packageName" class="doc-meta mb-6 flex flex-wrap items-center gap-2 text-xs">
        <a
          :href="npmUrl!"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/40 px-2.5 py-1 font-mono text-text-dim transition-colors hover:border-text/40 hover:text-text hover:no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M1.763 0h20.474v20.474H12v3.526H6.316v-3.526H1.763V0zm1.105 19.368h5.684V3.684h13.579v15.684h-8.421V5.526h-3.789v13.842H2.868z"
            />
          </svg>
          npm
        </a>
        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/40 px-2.5 py-1 font-mono text-text-dim transition-colors hover:border-text/40 hover:text-text hover:no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.69 5.43-5.25 5.71.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
            />
          </svg>
          Source
        </a>
      </div>

      <article v-if="page" class="prose">
        <ContentRenderer :value="page" />
      </article>
    </main>

    <DocToc :links="page?.body?.toc?.links" />
  </div>
</template>
