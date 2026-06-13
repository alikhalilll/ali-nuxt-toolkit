<script setup lang="ts">
import { type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import ASkeletonImage from './ASkeletonImage.vue';
import ASkeletonHeading from './ASkeletonHeading.vue';
import ASkeletonText from './ASkeletonText.vue';
import ASkeletonButton from './ASkeletonButton.vue';
import ASkeletonAvatar from './ASkeletonAvatar.vue';

interface Props {
  media?: boolean;
  heading?: boolean;
  lines?: number;
  actions?: boolean;
  footerAvatar?: boolean;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

withDefaults(defineProps<Props>(), {
  media: true,
  heading: true,
  lines: 3,
  actions: true,
  footerAvatar: false,
  animation: 'pulse',
});
</script>

<template>
  <div :class="cn('a-skel-variant-card', $props.class)" role="status" aria-busy="true">
    <ASkeletonImage v-if="$props.media" :animation="$props.animation" />
    <ASkeletonHeading v-if="$props.heading" :level="3" :animation="$props.animation" />
    <ASkeletonText :lines="$props.lines" :animation="$props.animation" />
    <div v-if="$props.actions" class="mt-2 flex gap-2">
      <ASkeletonButton :width="96" :height="36" :animation="$props.animation" />
      <ASkeletonButton :width="96" :height="36" outlined :animation="$props.animation" />
    </div>
    <div v-if="$props.footerAvatar" class="mt-3 flex items-center gap-3">
      <ASkeletonAvatar :size="36" :animation="$props.animation" />
      <div style="flex: 1">
        <ASkeletonText :lines="2" :animation="$props.animation" />
      </div>
    </div>
    <span class="a-skel-sr-only">Loading card…</span>
  </div>
</template>
