<script setup lang="ts">
/**
 * Data-Driven Skeleton Demo.
 *
 * Demonstrates the `:data` + `:sample` workflow with ASmartSkeleton:
 * Pass your expected data structure to `:sample`. While `:data` is null or pending,
 * ASmartSkeleton lays out the sample unseen in real DOM flow, measures exact typographic
 * and bounding boxes, and reveals seamlessly with zero layout shift.
 */
import { onMounted, onUnmounted, ref } from 'vue';

interface Product {
  id: string;
  title: string;
  category: string;
  price: string;
  rating: string;
  reviews: number;
  image: string;
  description: string;
}

const SAMPLE_PRODUCT: Product = {
  id: 'kbd-01',
  title: 'Apex Pro Wireless Mechanical Keyboard',
  category: 'Hardware · Peripherals',
  price: '$189.00',
  rating: '4.9',
  reviews: 328,
  image:
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
  description:
    'Hot-swappable tactile switches, CNC machined aluminum chassis, and low-latency 2.4GHz connectivity.',
};

const product = ref<Product | null>(null);
const loading = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function fetchProduct() {
  if (timer) clearTimeout(timer);
  loading.value = true;
  product.value = null;

  timer = setTimeout(() => {
    product.value = { ...SAMPLE_PRODUCT };
    loading.value = false;
  }, 900);
}

onMounted(fetchProduct);
onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

const code = `<script setup lang="ts">
import { ref } from 'vue';
import { ASmartSkeleton } from '@alikhalilll/a-smart-skeleton';

const product = ref(null);

const SAMPLE_PRODUCT = {
  title: 'Apex Pro Wireless Mechanical Keyboard',
  category: 'Hardware · Peripherals',
  price: '$189.00',
  rating: '4.9',
  reviews: 328,
  image: 'https://images.unsplash.com/...',
  description: 'Hot-swappable tactile switches, CNC machined aluminum chassis...',
};
\u003c/script>

<template>
  <!-- While product is null, ASmartSkeleton lays out SAMPLE_PRODUCT invisibly -->
  <ASmartSkeleton
    id="demo-product-card"
    :data="product"
    :sample="SAMPLE_PRODUCT"
    label="Loading product card"
  >
    <template #default="{ data }">
      <article class="flex flex-col rounded-xl border bg-surface overflow-hidden">
        <img :src="data?.image" class="aspect-video w-full object-cover" />
        <div class="p-4 flex flex-col gap-2">
          <span class="text-xs text-muted">{{ data?.category }}</span>
          <h4 class="font-bold text-base">{{ data?.title }}</h4>
          <p class="text-xs text-muted">{{ data?.description }}</p>
          <div class="flex items-center justify-between pt-2">
            <span class="font-bold">{{ data?.price }}</span>
            <button class="btn-primary">Add to Cart</button>
          </div>
        </div>
      </article>
    </template>
  </ASmartSkeleton>
</template>`;
</script>

<template>
  <div class="my-6">
    <DemoTabs :code="code">
      <div class="p-4 sm:p-6">
        <!-- Header row with reload -->
        <div class="mb-5 flex items-center justify-between border-b border-border/60 pb-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-text">Data-Driven Skeleton</span>
            <span class="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-text-dim">
              <code>:data="product" :sample="SAMPLE"</code>
            </span>
          </div>

          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-sm transition-all hover:bg-surface-2 active:scale-95 disabled:opacity-50"
            :disabled="loading"
            @click="fetchProduct"
          >
            <span
              class="size-2 rounded-full"
              :class="loading ? 'bg-amber-400 animate-ping' : 'bg-primary'"
            />
            <span>{{ loading ? 'Fetching...' : 'Simulate API Call' }}</span>
          </button>
        </div>

        <!-- Product Card Stage -->
        <div class="mx-auto max-w-sm">
          <div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <ASmartSkeleton
              id="demo-product-card"
              :data="product"
              :sample="SAMPLE_PRODUCT"
              label="Loading product card"
            >
              <template #default="{ data }">
                <article class="flex flex-col">
                  <!-- Product Image -->
                  <div class="relative aspect-video w-full overflow-hidden bg-surface-2">
                    <img
                      v-if="data?.image"
                      :src="data.image"
                      :alt="data?.title || 'Product'"
                      class="size-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <span
                      class="absolute top-2.5 right-2.5 rounded-full bg-emerald-500/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
                    >
                      In Stock
                    </span>
                  </div>

                  <!-- Content details -->
                  <div class="flex flex-col gap-2 p-4">
                    <span class="text-[11px] font-medium uppercase tracking-wider text-text-dim">
                      {{ data?.category }}
                    </span>

                    <h4 class="text-base font-bold text-text leading-snug">
                      {{ data?.title }}
                    </h4>

                    <p class="text-xs text-text-dim leading-relaxed line-clamp-2">
                      {{ data?.description }}
                    </p>

                    <div
                      class="mt-2 flex items-center justify-between border-t border-border/50 pt-3"
                    >
                      <div>
                        <span class="text-lg font-bold text-text">{{ data?.price }}</span>
                        <span class="ml-1.5 text-[11px] text-text-dim"
                          >★ {{ data?.rating }} ({{ data?.reviews }})</span
                        >
                      </div>

                      <button
                        type="button"
                        class="cursor-pointer rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-fg transition-opacity hover:opacity-90"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              </template>
            </ASmartSkeleton>
          </div>
        </div>
      </div>
    </DemoTabs>
  </div>
</template>
