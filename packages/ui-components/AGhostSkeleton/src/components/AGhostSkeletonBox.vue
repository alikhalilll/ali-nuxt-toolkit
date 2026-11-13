<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { shimmer, skeletonBoxStyle, ATTR_BAR } from '../core';
import { useStyles } from '../composables/useStyles';
import type { AGhostSkeletonBoxProps } from '../types';

defineOptions({
  name: 'AGhostSkeletonBox',
});

const props = defineProps<AGhostSkeletonBoxProps>();

const element = ref<HTMLElement | null>(null);
useStyles();

onMounted(() => {
  if (element.value) shimmer(element.value);
});
</script>

<template>
  <span ref="element" v-bind="{ [ATTR_BAR]: '' }" :style="skeletonBoxStyle(props)" />
</template>
