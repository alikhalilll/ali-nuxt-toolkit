<script setup lang="ts">
import type { RouteLocationNormalized } from 'vue-router';

const pageKey = (route: RouteLocationNormalized) => route.path;
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <div class="flex-1">
      <NuxtPage :page-key="pageKey" />
    </div>
    <AppFooter />
  </div>
</template>
