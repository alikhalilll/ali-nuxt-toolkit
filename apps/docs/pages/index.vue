<script setup lang="ts">
/**
 * Home page — thin orchestrator. Each visual region is its own component
 * under `components/home/`:
 *
 *   HomeHeroBackground   · drifting brand-color orbs (decorative bg)
 *   HomeHeroAnnouncement · "New" pill above the hero title
 *   HomeHeroIntro        · title + subtitle + CTAs
 *   HomeInstallSlider    · terminal-styled rotating install command
 *   HomeShowcase         · tabbed code panel with live previews
 *   HomePackagesGrid     · the four package cards section
 *
 * This file holds only the page-level SEO meta and the section layout
 * scaffold.
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
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: siteUrl,
        description: siteDescription,
      }),
    },
  ],
});
</script>

<template>
  <HomeHeroBackground />

  <section class="relative isolate">
    <!-- Calm centered hero shell. Constrained width, generous vertical rhythm. -->
    <div class="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
      <HomeHeroAnnouncement />

      <!-- Centered hero stack: title → subtitle → CTAs → install. -->
      <div class="mx-auto max-w-3xl text-center">
        <HomeHeroIntro />
        <HomeInstallSlider />
      </div>

      <!-- Focal demo strip — properly framed, wider than the text block. -->
      <HomeShowcase />
    </div>

    <HomePackagesGrid />
  </section>
</template>
