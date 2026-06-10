<script setup lang="ts">
import { ref, computed } from 'vue';
import { clearCached, useSkeleton, walkDom } from '@alikhalilll/a-skeleton';
import type { CachedShape } from '@alikhalilll/a-skeleton';

/* Profile-card demo data so we can flip loading → loaded and watch the skeleton learn the shape. */
const profile = ref<{ name: string; role: string; bio: string; avatar: string } | null>(null);
const profileLoading = ref(true);

async function loadProfile() {
  profileLoading.value = true;
  profile.value = null;
  await new Promise((r) => setTimeout(r, 800));
  profile.value = {
    name: 'Maya Hartman',
    role: 'Senior Platform Engineer',
    bio: 'Builds developer tools and component libraries. Lives in Lisbon. Currently exploring runtime DOM introspection for self-generating skeleton loaders.',
    avatar: 'https://i.pravatar.cc/96?img=47',
  };
  profileLoading.value = false;
}

const profileLoaded = computed(() => profile.value !== null);

const animation = ref<'shimmer' | 'pulse' | 'none'>('shimmer');
const persist = ref(false);

function resetProfile() {
  profile.value = null;
  profileLoading.value = true;
}

function nukeCache() {
  clearCached();
  resetProfile();
}

/* Article list demo so we can also show multi-line text capture. */
const articles = ref<{ title: string; excerpt: string; author: string; date: string }[]>([]);
const articlesLoading = ref(true);

async function loadArticles() {
  articlesLoading.value = true;
  articles.value = [];
  await new Promise((r) => setTimeout(r, 700));
  articles.value = [
    {
      title: 'Self-generating skeleton loaders',
      excerpt:
        'A runtime DOM walk plus a tiny cache turns a regular component into its own skeleton — no hand-drawn placeholder markup.',
      author: 'Maya Hartman',
      date: '2 days ago',
    },
    {
      title: 'When to measure, when to mirror',
      excerpt:
        'Three render strategies for skeletons (overlay, mirror, inline replacement) and the trade-offs between them.',
      author: 'Sam Iqbal',
      date: '4 days ago',
    },
  ];
  articlesLoading.value = false;
}

/* Three placeholder rows so the structural skeleton renders multiple article slots
 * on first load even before data lands. The component author drives this. */
const articleStructure = computed(() =>
  articles.value.length > 0 ? articles.value : [null, null, null]
);

loadProfile();
loadArticles();

/* ---------- Public-API demo 1: hand-crafted skeleton with <ASkeletonBlock> ---------- */
const handCraftedLoading = ref(true);
function toggleHandCrafted() {
  handCraftedLoading.value = !handCraftedLoading.value;
}

/* ---------- Public-API demo 2: useSkeleton + <ASkeletonLayer> custom orchestration
 * The composable is wired up around a manually-managed container ref. The cached
 * shape powers an <ASkeletonLayer> that renders during loading. We don't use the
 * <ASkeleton> wrapper at all — pure DIY. */
const product = ref<{ name: string; price: string; tagline: string } | null>(null);
const productLoading = computed(() => product.value === null);
const productRef = ref<HTMLElement | null>(null);

const { shape: productShape, clear: clearProductShape } = useSkeleton({
  cacheKey: 'product-card',
  target: () => (productLoading.value ? null : productRef.value),
  maxNodes: 100,
});

async function loadProduct() {
  product.value = null;
  await new Promise((r) => setTimeout(r, 600));
  product.value = {
    name: 'Featherlight Backpack',
    price: '$129',
    tagline: 'Built for 12-hour travel days. Recycled ripstop, weighs less than a paperback.',
  };
}

function resetProduct() {
  product.value = null;
}

/* ---------- Public-API demo 3: imperative walkDom for one-off measurements ---------- */
const measuredRef = ref<HTMLElement | null>(null);
const measurement = ref<CachedShape | null>(null);
function takeMeasurement() {
  if (!measuredRef.value) return;
  measurement.value = walkDom(measuredRef.value, { maxDepth: 6, maxNodes: 50 });
}

loadProduct();

/* ---------- Public-API demo 4: theming via CSS variables ---------- */
interface ThemePreset {
  label: string;
  vars: Record<string, string>;
  animation: 'shimmer' | 'pulse' | 'none';
}

const themePresets: ThemePreset[] = [
  { label: 'Default', vars: {}, animation: 'shimmer' },
  {
    label: 'Soft Sand',
    vars: {
      '--ak-skeleton-block': 'hsl(28 30% 86%)',
      '--ak-skeleton-shimmer': 'hsl(28 60% 96% / 0.7)',
      '--ak-skeleton-radius': '0.75rem',
      '--ak-skeleton-duration': '1.8s',
    },
    animation: 'shimmer',
  },
  {
    label: 'Neon Pop',
    vars: {
      '--ak-skeleton-block': 'hsl(280 40% 22%)',
      '--ak-skeleton-shimmer': 'hsl(180 100% 60% / 0.45)',
      '--ak-skeleton-radius': '1rem',
      '--ak-skeleton-duration': '1.1s',
    },
    animation: 'shimmer',
  },
  {
    label: 'Slow Pulse',
    vars: {
      '--ak-skeleton-duration': '2.4s',
      '--ak-skeleton-pulse-opacity': '0.3',
    },
    animation: 'pulse',
  },
];

const themeIdx = ref(0);
const themedLoading = ref(true);
const themeVars = computed(() => themePresets[themeIdx.value].vars);
const themeAnim = computed(() => themePresets[themeIdx.value].animation);
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold tracking-tight">@alikhalilll/a-skeleton · ASkeleton</h1>
    <p class="mb-8 text-text-dim">
      An auto-generating skeleton loader.
      <strong>First paint</strong> — <code>ASkeleton</code> walks the slot's vnode tree and renders
      a structural skeleton that mirrors the component's HTML (same tags, same Tailwind classes →
      same flex/grid/spacing/sizing). <strong>Second load</strong> — the previously measured DOM
      shape is replayed as pixel-aligned positioned blocks, exact to ±1px. Click
      <em>Clear cache</em> to wipe both layers and see the structural pass again.
    </p>

    <div class="mb-6 flex flex-wrap items-center gap-3 text-sm">
      <label class="flex items-center gap-2">
        <span>animation:</span>
        <select
          v-model="animation"
          class="rounded border border-brand-border bg-surface-2 px-2 py-1"
        >
          <option value="shimmer">shimmer</option>
          <option value="pulse">pulse</option>
          <option value="none">none</option>
        </select>
      </label>

      <label class="flex items-center gap-2">
        <input v-model="persist" type="checkbox" />
        <span>persist (localStorage)</span>
      </label>

      <button
        class="cursor-pointer rounded border border-brand bg-brand px-3 py-1.5 font-semibold text-bg hover:brightness-110"
        @click="loadProfile"
      >
        Reload profile
      </button>
      <button
        class="cursor-pointer rounded border border-brand-border px-3 py-1.5 text-text-dim hover:bg-surface-2"
        @click="resetProfile"
      >
        Show skeleton
      </button>
      <button
        class="cursor-pointer rounded border border-brand-border px-3 py-1.5 text-text-dim hover:bg-surface-2"
        @click="nukeCache"
      >
        Clear cache → cold start
      </button>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Profile card demo: structure always rendered, content gated per-element. -->
      <div class="rounded-xl border border-brand-border bg-surface p-5">
        <h2 class="mb-4 border-l-[3px] border-brand pl-2 text-lg font-semibold">
          Profile card
          <span class="ml-2 text-xs font-normal text-text-dim">
            cacheKey = <code>profile-card</code>
          </span>
        </h2>

        <ASkeleton
          :loading="profileLoading"
          cache-key="profile-card"
          :animation="animation"
          :persist="persist"
        >
          <!-- Structure always renders. The structural walker sees this exact tree on
               cache miss and produces a skeleton with the same flex layout, the
               same circular avatar, the same heading + body bars. -->
          <div class="flex items-start gap-4 p-4">
            <img
              v-if="profile?.avatar"
              :src="profile.avatar"
              :alt="profile.name"
              class="size-16 shrink-0 rounded-full object-cover"
            />
            <div v-else class="size-16 shrink-0 rounded-full" />

            <div class="flex-1">
              <h3 class="text-base font-semibold">{{ profile?.name }}</h3>
              <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">
                {{ profile?.role }}
              </p>
              <p class="mt-2 text-sm leading-relaxed">{{ profile?.bio }}</p>
            </div>
          </div>
        </ASkeleton>

        <p class="mt-3 text-xs text-text-dim">
          State: <code>{{ profileLoaded ? 'loaded' : 'loading' }}</code>
        </p>
      </div>

      <!-- Article list demo: render N rows even when empty so the structural skeleton
           shows three article shapes on first load. -->
      <div class="rounded-xl border border-brand-border bg-surface p-5">
        <h2 class="mb-4 border-l-[3px] border-brand pl-2 text-lg font-semibold">
          Article list
          <span class="ml-2 text-xs font-normal text-text-dim">
            cacheKey = <code>article-list</code>
          </span>
        </h2>

        <ASkeleton
          :loading="articlesLoading"
          cache-key="article-list"
          :animation="animation"
          :persist="persist"
        >
          <ul class="flex flex-col gap-4">
            <li
              v-for="(article, idx) in articleStructure"
              :key="idx"
              class="border-b border-brand-border pb-3 last:border-b-0"
            >
              <h3 class="text-sm font-semibold">{{ article?.title }}</h3>
              <p class="mt-1 text-xs leading-relaxed text-text-dim">{{ article?.excerpt }}</p>
              <p class="mt-2 text-[10px] uppercase tracking-wide text-text-dim">
                {{ article?.author }} · {{ article?.date }}
              </p>
            </li>
          </ul>
        </ASkeleton>

        <div class="mt-3 flex gap-2 text-xs">
          <button
            class="rounded border border-brand-border px-2 py-1 text-text-dim hover:bg-surface-2"
            @click="loadArticles"
          >
            Reload articles
          </button>
          <button
            class="rounded border border-brand-border px-2 py-1 text-text-dim hover:bg-surface-2"
            @click="
              articles = [];
              articlesLoading = true;
            "
          >
            Show skeleton
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Public API demos — for users building their own skeletons
         ============================================================ -->
    <h2 class="mt-12 mb-2 text-xl font-semibold tracking-tight">
      Public API · craft your own skeleton
    </h2>
    <p class="mb-6 text-sm text-text-dim">
      <code>ASkeleton</code> is the wrapper, but every layer it uses is exported. Reach for these
      when you want a different render strategy.
    </p>

    <!-- ASkeletonBlock — hand-crafted skeleton from primitive blocks -->
    <div class="mb-8 rounded-xl border border-brand-border bg-surface p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="border-l-[3px] border-brand pl-2 text-lg font-semibold">
          1 · <code>&lt;ASkeletonBlock&gt;</code>
          <span class="ml-2 text-xs font-normal text-text-dim">
            single-block primitive · flow layout
          </span>
        </h3>
        <button
          class="cursor-pointer rounded border border-brand-border px-3 py-1.5 text-sm text-text-dim hover:bg-surface-2"
          @click="toggleHandCrafted"
        >
          Toggle loading
        </button>
      </div>
      <p class="mb-3 text-xs text-text-dim">
        No measurement, no cache — you compose <code>type</code>, <code>w</code>, <code>h</code>,
        <code>lines</code>, and <code>animation</code> directly. Great for custom designs that won't
        benefit from auto-capture.
      </p>

      <div v-if="handCraftedLoading" class="flex items-start gap-4 p-4">
        <ASkeletonBlock type="circle" :w="64" :h="64" />
        <div class="flex-1 space-y-2">
          <ASkeletonBlock type="text" :w="160" :h="18" />
          <ASkeletonBlock type="text" :w="100" :h="12" />
          <ASkeletonBlock type="text" :lines="3" :h="14" class="!mt-3" />
        </div>
      </div>
      <div v-else class="flex items-start gap-4 p-4">
        <img
          src="https://i.pravatar.cc/96?img=12"
          alt="Sam"
          class="size-16 shrink-0 rounded-full object-cover"
        />
        <div class="flex-1">
          <h3 class="text-base font-semibold">Sam Iqbal</h3>
          <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">Staff DX Engineer</p>
          <p class="mt-2 text-sm leading-relaxed">
            Maintains the component library and writes blog posts about skeleton loaders. Probably
            had too much coffee today.
          </p>
        </div>
      </div>
    </div>

    <!-- useSkeleton + ASkeletonLayer — composable orchestration -->
    <div class="mb-8 rounded-xl border border-brand-border bg-surface p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="border-l-[3px] border-brand pl-2 text-lg font-semibold">
          2 · <code>useSkeleton()</code> + <code>&lt;ASkeletonLayer&gt;</code>
          <span class="ml-2 text-xs font-normal text-text-dim">
            DIY orchestration · cacheKey =
            <code>product-card</code>
          </span>
        </h3>
        <div class="flex gap-2">
          <button
            class="cursor-pointer rounded border border-brand bg-brand px-3 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
            @click="loadProduct"
          >
            Reload
          </button>
          <button
            class="cursor-pointer rounded border border-brand-border px-3 py-1.5 text-sm text-text-dim hover:bg-surface-2"
            @click="resetProduct"
          >
            Show skeleton
          </button>
          <button
            class="cursor-pointer rounded border border-brand-border px-3 py-1.5 text-sm text-text-dim hover:bg-surface-2"
            @click="clearProductShape"
          >
            Clear cache
          </button>
        </div>
      </div>
      <p class="mb-3 text-xs text-text-dim">
        The composable wires probe + cache + reactivity around a manually-managed ref. No
        <code>&lt;ASkeleton&gt;</code> wrapper involved. <code>ASkeletonLayer</code> replays
        whatever shape the composable has cached.
      </p>

      <div ref="productRef" class="relative">
        <ASkeletonLayer v-if="productLoading && productShape" :shape="productShape" />
        <div
          v-else-if="productLoading"
          class="rounded-md border border-dashed border-brand-border p-6 text-center text-xs text-text-dim"
        >
          Cold start — the layer is empty until the first measurement runs. Click
          <em>Reload</em> to render the real card; the layer fills on the next loading flip.
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
              class="mt-2 cursor-pointer rounded border border-brand bg-brand px-3 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- walkDom — imperative measurement -->
    <div class="mb-8 rounded-xl border border-brand-border bg-surface p-5">
      <h3 class="mb-4 border-l-[3px] border-brand pl-2 text-lg font-semibold">
        3 · <code>walkDom()</code>
        <span class="ml-2 text-xs font-normal text-text-dim">
          pure utility · one-shot measure
        </span>
      </h3>
      <p class="mb-3 text-xs text-text-dim">
        Synchronously walk any element and inspect the captured shape. Useful for debugging or
        building a custom orchestrator that doesn't fit the composable.
      </p>

      <div ref="measuredRef" class="rounded-md border border-brand-border bg-surface-2 p-4">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-full bg-brand/30" />
          <div class="flex-1">
            <p class="text-sm font-semibold">Target element</p>
            <p class="text-xs text-text-dim">
              Hit <em>Measure</em> to walk this card and dump the captured shape.
            </p>
          </div>
        </div>
      </div>

      <button
        class="mt-3 cursor-pointer rounded border border-brand bg-brand px-3 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
        @click="takeMeasurement"
      >
        Measure
      </button>

      <pre
        v-if="measurement"
        class="mt-3 max-h-64 overflow-auto rounded border border-brand-border bg-surface-2 p-3 text-[10px] leading-relaxed"
        >{{
          JSON.stringify(
            {
              width: measurement.width,
              height: measurement.height,
              truncated: measurement.truncated,
              nodeCount: measurement.nodes.length,
              firstNode: measurement.nodes[0],
            },
            null,
            2
          )
        }}</pre
      >
    </div>

    <!-- Theming via CSS variables -->
    <div class="mb-8 rounded-xl border border-brand-border bg-surface p-5">
      <h3 class="mb-4 border-l-[3px] border-brand pl-2 text-lg font-semibold">
        4 · Theming
        <span class="ml-2 text-xs font-normal text-text-dim">
          via <code>--ak-skeleton-*</code> CSS variables
        </span>
      </h3>
      <p class="mb-3 text-xs text-text-dim">
        Override <code>--ak-skeleton-block</code>, <code>--ak-skeleton-shimmer</code>,
        <code>--ak-skeleton-radius</code>, or <code>--ak-skeleton-duration</code> on
        <code>:root</code>, a wrapper class, or inline. Defaults inherit from
        <code>--ak-ui-*</code> tokens so dark/light mode propagates automatically.
      </p>

      <div class="mb-3 flex flex-wrap gap-2 text-xs">
        <button
          v-for="(t, i) in themePresets"
          :key="t.label"
          :class="[
            'cursor-pointer rounded border px-3 py-1.5 transition',
            themeIdx === i
              ? 'border-brand bg-brand/10 text-brand'
              : 'border-brand-border bg-surface-2 hover:bg-surface',
          ]"
          @click="themeIdx = i"
        >
          {{ t.label }}
        </button>
        <button
          class="ml-auto cursor-pointer rounded border border-brand-border px-3 py-1.5 text-text-dim hover:bg-surface-2"
          @click="themedLoading = !themedLoading"
        >
          Toggle loading
        </button>
      </div>

      <div :style="themeVars">
        <ASkeleton :loading="themedLoading" cache-key="themed-profile" :animation="themeAnim">
          <div class="flex items-start gap-4 p-4">
            <img
              src="https://i.pravatar.cc/96?img=32"
              alt="Riya"
              class="size-16 shrink-0 rounded-full object-cover"
            />
            <div class="flex-1">
              <h3 class="text-base font-semibold">Riya Chen</h3>
              <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">Design Engineer</p>
              <p class="mt-2 text-sm leading-relaxed">
                Spends her weekends tuning CSS variables. Bakes excellent sourdough.
              </p>
            </div>
          </div>
        </ASkeleton>
      </div>
    </div>

    <h2 class="mt-10 mb-2 text-xl font-semibold tracking-tight">
      How the two-layer skeleton works
    </h2>
    <ol class="ml-5 list-decimal space-y-2 text-sm text-text-dim">
      <li>
        <strong>Cache miss + loading:</strong> <code>ASkeleton</code> walks the slot's vnode tree
        and renders a structural skeleton — same tags, same <code>class</code> strings, atomic
        leaves (<code>&lt;img&gt;</code>, <code>&lt;button&gt;</code>) as shimmer blocks, text tags
        (<code>&lt;h3&gt;</code>, <code>&lt;p&gt;</code>) as text bars. Tailwind utilities like
        <code>size-16</code> and <code>rounded-full</code> still apply, so the avatar circle and
        headline widths look right on the very first paint.
      </li>
      <li>
        <strong>Data arrives:</strong> the real slot renders, a <code>ResizeObserver</code> +
        <code>requestAnimationFrame</code> walk the DOM, and the exact geometry (per-block
        <code>x/y/w/h</code>, border-radius, multi-line counts) is captured under
        <code>cacheKey</code>.
      </li>
      <li>
        <strong>Next loading flip:</strong> cache hit — positioned blocks render absolutely inside a
        layer sized to the previously measured bounding box. Pixel-aligned to ±1px.
      </li>
      <li>
        <strong>Authoring rule:</strong> keep the wrapper structure unconditional — gate content per
        leaf (<code>&#123;&#123; data?.name &#125;&#125;</code>) rather than gating the entire
        template on <code>v-if="data"</code>. The structural walker can only mirror what the slot's
        template actually renders during loading.
      </li>
    </ol>
  </section>
</template>
