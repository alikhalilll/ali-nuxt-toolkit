<script setup lang="ts">
import { computed, toRef, type HTMLAttributes } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import { useSkeletonBase, type VariantAnimation } from '../../composables/useSkeletonBase';
import ASkeletonAvatar from './ASkeletonAvatar.vue';
import ASkeletonText from './ASkeletonText.vue';

interface Props {
  avatar?: boolean;
  lines?: 1 | 2 | 3;
  trailing?: boolean;
  animation?: VariantAnimation;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  avatar: true,
  lines: 2,
  trailing: false,
  animation: 'pulse',
});

const { animClass } = useSkeletonBase(toRef(props, 'animation'));
</script>

<template>
  <div :class="cn('a-skel-variant-list-item', props.class)" role="status" aria-busy="true">
    <ASkeletonAvatar v-if="props.avatar" :size="40" :animation="props.animation" />
    <div class="a-skel-variant-list-item__body">
      <ASkeletonText :lines="props.lines" :animation="props.animation" />
    </div>
    <div
      v-if="props.trailing"
      :class="cn('a-skel a-skel-variant-button', animClass)"
      :style="{ width: '40px', height: '24px' }"
    />
    <span class="a-skel-sr-only">Loading list item…</span>
  </div>
</template>
