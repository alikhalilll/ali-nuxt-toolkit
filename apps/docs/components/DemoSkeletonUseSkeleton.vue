<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSkeleton } from '@alikhalilll/a-skeleton';

const product = ref<{ name: string; price: string; tagline: string } | null>(null);
const loading = computed(() => product.value === null);

const containerRef = ref<HTMLElement | null>(null);

const { shape, clear } = useSkeleton({
  cacheKey: 'docs-product-card',
  /* While loading, target is null → no capture. When real content mounts,
   * target returns the wrapper → ResizeObserver + capture. */
  target: () => (loading.value ? null : containerRef.value),
  maxNodes: 100,
});

async function load() {
  product.value = null;
  await new Promise((r) => setTimeout(r, 600));
  product.value = {
    name: 'Featherlight Backpack',
    price: '$129',
    tagline: 'Built for 12-hour travel days. Recycled ripstop, weighs less than a paperback.',
  };
}
load();

const source = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSkeleton } from '@alikhalilll/a-skeleton';

const product = ref(null);
const loading = computed(() => product.value === null);
const containerRef = ref(null);

const { shape, clear } = useSkeleton({
  cacheKey: 'product-card',
  // Probe runs only when real content is mounted.
  target: () => (loading.value ? null : containerRef.value),
});
\u003c/script>

<template>
  <div ref="containerRef" class="relative">
    <ASkeletonLayer v-if="loading && shape" :shape="shape" />
    <ColdStartFallback v-else-if="loading" />
    <ProductCard v-else :data="product" />
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · useSkeleton + ASkeletonLayer
    </h4>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="mb-3 flex gap-2 text-xs">
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="load"
          >
            Reload
          </button>
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="product = null"
          >
            Show skeleton
          </button>
          <button
            class="cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 hover:bg-surface"
            @click="clear"
          >
            Clear cache
          </button>
        </div>

        <div ref="containerRef" class="relative">
          <ASkeletonLayer v-if="loading && shape" :shape="shape" />
          <div
            v-else-if="loading"
            class="rounded-md border border-dashed border-border p-6 text-center text-xs text-text-dim"
          >
            Cold start — cache is empty. Click <em>Reload</em> to render the real card; the layer
            fills on the next loading flip.
          </div>
          <div v-else-if="product" class="flex items-start justify-between gap-6 p-4">
            <div class="flex-1">
              <p class="text-xs uppercase tracking-wide text-text-dim">New arrival</p>
              <h3 class="mt-1 text-base font-semibold">{{ product.name }}</h3>
              <p class="mt-2 text-sm leading-relaxed">{{ product.tagline }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-semibold">{{ product.price }}</p>
              <button
                class="mt-2 cursor-pointer rounded border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold hover:bg-surface"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
