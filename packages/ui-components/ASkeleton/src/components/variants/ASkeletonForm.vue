<script setup lang="ts">
import { type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import ASkeletonText from './ASkeletonText.vue';
import ASkeletonInput from './ASkeletonInput.vue';
import ASkeletonButton from './ASkeletonButton.vue';

interface Props {
  fields?: number;
  showSubmit?: boolean;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  class?: HTMLAttributes['class'];
}

withDefaults(defineProps<Props>(), { fields: 3, showSubmit: true, animation: 'pulse' });
</script>

<template>
  <div :class="cn('flex flex-col gap-4', $props.class)" role="status" aria-busy="true">
    <div v-for="i in $props.fields" :key="i" class="flex flex-col gap-2">
      <ASkeletonText :lines="1" :width="'30%'" :animation="$props.animation" />
      <ASkeletonInput :animation="$props.animation" />
    </div>
    <ASkeletonButton
      v-if="$props.showSubmit"
      :width="120"
      :height="40"
      :animation="$props.animation"
    />
    <span class="a-skel-sr-only">Loading form…</span>
  </div>
</template>
