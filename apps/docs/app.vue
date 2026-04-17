<script setup lang="ts">
import type { RouteLocationNormalized } from 'vue-router';

const pageKey = (route: RouteLocationNormalized) => route.path;
</script>

<template>
  <div>
    <AppHeader />
    <NuxtPage :page-key="pageKey" />
  </div>
</template>
