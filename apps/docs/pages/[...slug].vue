<script setup lang="ts">
const route = useRoute();
const path = computed(() => (route.path === '/' ? '/index' : route.path));

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('docs').path(path.value).first()
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Doc not found', fatal: true });
}

useHead({
  title: computed(() => page.value?.title ?? 'Docs'),
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
