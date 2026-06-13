<script setup lang="ts">
import { ref } from 'vue';

const animation = ref<'pulse' | 'shimmer' | 'wave' | 'none'>('pulse');
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Variant gallery
    </h4>

    <div class="mb-4 flex flex-wrap items-center gap-3 text-xs">
      <label class="flex items-center gap-2">
        <span>animation:</span>
        <select v-model="animation" class="rounded border border-border bg-surface-2 px-2 py-1">
          <option value="pulse">pulse</option>
          <option value="shimmer">shimmer</option>
          <option value="wave">wave</option>
          <option value="none">none</option>
        </select>
      </label>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonText · lines=4
        </p>
        <ASkeletonText :lines="4" :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonHeading · level=1
        </p>
        <ASkeletonHeading :level="1" :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonAvatar · circle · square · rounded
        </p>
        <div class="flex items-center gap-3">
          <ASkeletonAvatar :size="56" shape="circle" :animation="animation" />
          <ASkeletonAvatar :size="56" shape="square" :animation="animation" />
          <ASkeletonAvatar :size="56" shape="rounded" :animation="animation" />
        </div>
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonImage · placeholder icon
        </p>
        <ASkeletonImage :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonVideo · play-icon
        </p>
        <ASkeletonVideo :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonButton · filled + outlined
        </p>
        <div class="flex gap-2">
          <ASkeletonButton :animation="animation" />
          <ASkeletonButton outlined :animation="animation" />
        </div>
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonInput
        </p>
        <ASkeletonInput :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonChip × 3
        </p>
        <div class="flex flex-wrap gap-2">
          <ASkeletonChip :animation="animation" />
          <ASkeletonChip :width="60" :animation="animation" />
          <ASkeletonChip :width="100" :animation="animation" />
        </div>
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4 md:col-span-2">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonListItem × 3
        </p>
        <ASkeletonListItem :animation="animation" />
        <ASkeletonListItem :animation="animation" />
        <ASkeletonListItem :animation="animation" trailing />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4 md:col-span-2">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonCard
        </p>
        <ASkeletonCard :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4 md:col-span-2">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonTable · rows=4 cols=4
        </p>
        <ASkeletonTable :rows="4" :columns="4" :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4 md:col-span-2">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonChart · bars=10
        </p>
        <ASkeletonChart :bars="10" :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonForm · fields=3
        </p>
        <ASkeletonForm :fields="3" :animation="animation" />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonArticle · paragraphs=2 (no media)
        </p>
        <ASkeletonArticle
          :paragraphs="2"
          :lines-per-paragraph="3"
          :media="false"
          :animation="animation"
        />
      </div>

      <div class="rounded-md border border-border bg-surface-2 p-4 md:col-span-2">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
          ASkeletonDivider
        </p>
        <ASkeletonDivider :animation="animation" />
        <div class="my-3" />
        <ASkeletonDivider :thickness="2" :animation="animation" />
      </div>
    </div>
  </div>
</template>
