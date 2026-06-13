<script setup lang="ts">
import { type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import ASkeletonHeading from './ASkeletonHeading.vue';
import ASkeletonText from './ASkeletonText.vue';
import ASkeletonImage from './ASkeletonImage.vue';

interface Props {
  media?: boolean;
  paragraphs?: number;
  linesPerParagraph?: number;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

withDefaults(defineProps<Props>(), {
  media: true,
  paragraphs: 3,
  linesPerParagraph: 4,
  animation: 'pulse',
});
</script>

<template>
  <article :class="cn('flex flex-col gap-4', $props.class)" role="status" aria-busy="true">
    <ASkeletonHeading :level="1" :animation="$props.animation" />
    <ASkeletonImage v-if="$props.media" :animation="$props.animation" />
    <div v-for="i in $props.paragraphs" :key="i">
      <ASkeletonText :lines="$props.linesPerParagraph" :animation="$props.animation" />
    </div>
    <span class="a-skel-sr-only">Loading article…</span>
  </article>
</template>
