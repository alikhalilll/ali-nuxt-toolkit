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
</script>

<template>
  <div
    class="mx-auto grid max-w-[1280px] gap-8 px-6 py-8 pb-16 md:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_220px]"
  >
    <DocSidebar />
    <main class="min-w-0">
      <article v-if="page" class="prose">
        <ContentRenderer :value="page" />
      </article>
    </main>
    <DocToc :links="page?.body?.toc?.links" />
  </div>
</template>
