<script setup lang="ts">
import { computed } from 'vue';

// Mirrors muslim-academy-platform/app/features/profile/components/UserAvatar.vue.
// Real one uses <UiAvatar>/<UiAvatarImage>/<UiAvatarFallback> from @pkgs/ui.
// The compiled DOM is a rounded-overflow-hidden span wrapping either an <img>
// or a styled initials fallback. Reproduced here as plain HTML with the same
// outer classes so chrome capture reads the identical shape.
const props = withDefaults(
  defineProps<{
    name: string;
    src?: string | null;
    sizeClass?: string;
  }>(),
  { src: null, sizeClass: 'size-10 text-sm' }
);

const initials = computed(
  () =>
    props.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?'
);
</script>

<template>
  <span class="relative flex shrink-0 overflow-hidden rounded-full" :class="sizeClass">
    <img v-if="src" :src="src" :alt="name" class="aspect-square h-full w-full object-cover" />
    <span
      v-else
      class="flex h-full w-full items-center justify-center rounded-full text-green-800 font-semibold bg-green-200"
    >
      {{ initials }}
    </span>
  </span>
</template>
