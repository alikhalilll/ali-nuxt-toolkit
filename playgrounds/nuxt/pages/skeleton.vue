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

/* ---------- v-for + grid + prototype + repeat demo ----------
 * Reproduces the user-reported failing case: a responsive grid of cards each
 * containing a switch, a counter, a heading, and two buttons. The skeleton
 * uses a `#prototype` slot for the shape source so the grid populates even
 * when `roles=[]` during the initial load, and `:repeat="6"` fills the grid
 * cells 1:1 with the eventual loaded state. */
interface RoleCard {
  id: number;
  name: string;
  users_count: number;
  is_active: boolean;
}

const roles = ref<RoleCard[]>([]);
const rolesLoading = ref(true);
const rolesRepeat = ref(6);

async function loadRoles() {
  rolesLoading.value = true;
  roles.value = [];
  await new Promise((r) => setTimeout(r, 900));
  roles.value = [
    { id: 1, name: 'Test role', users_count: 12, is_active: true },
    { id: 2, name: 'Operations manager', users_count: 4, is_active: true },
    { id: 3, name: 'Content editor', users_count: 8, is_active: false },
    { id: 4, name: 'Finance auditor', users_count: 2, is_active: true },
    { id: 5, name: 'Read-only analyst', users_count: 17, is_active: true },
    { id: 6, name: 'Onboarding helper', users_count: 1, is_active: false },
  ];
  rolesLoading.value = false;
}

function toggleRoles() {
  if (rolesLoading.value) {
    loadRoles();
  } else {
    rolesLoading.value = true;
    roles.value = [];
  }
}

loadRoles();

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
const themeVars = computed(() => themePresets[themeIdx.value]!.vars);
const themeAnim = computed(() => themePresets[themeIdx.value]!.animation);

/* ---------- Public-API demo 5: auto cacheKey is per-instance, plus truncation warning ----------
 * Two <ASkeleton> wrappers below render the same component with NO explicit cacheKey.
 *   - The auto-generated key is `<slot-name>:<useId()>`, so each wrapper has its own slot.
 *   - One wrapper is narrowed via `max-w-[260px]`, so the captured shapes diverge in width.
 *   - On the next loading flip, each wrapper replays its own shape — proof that the slots
 *     are not colliding.
 * The shared `autoMaxNodes` input drives `max-nodes` on both wrappers. Drop it to 5 to
 * force `truncated: true`, and `<ASkeleton>` will console.warn once per instance. */
const autoLoading = ref(true);
const autoProfile = ref<{ name: string; role: string; bio: string; avatar: string } | null>(null);
const autoMaxNodes = ref(500);

async function loadAutoProfile() {
  autoLoading.value = true;
  autoProfile.value = null;
  await new Promise((r) => setTimeout(r, 600));
  autoProfile.value = {
    name: 'Jordan Park',
    role: 'Staff Frontend Engineer',
    bio: 'Maintains a self-generating skeleton library. Prefers boring solutions that scale.',
    avatar: 'https://i.pravatar.cc/96?img=12',
  };
  autoLoading.value = false;
}

function resetAutoProfile() {
  autoProfile.value = null;
  autoLoading.value = true;
}

loadAutoProfile();

/* ---------- Public-API demo 6: advanced detection (v1.2.0+) ----------
 * Three richer slot trees that exercise every signal captured in 1.2.0:
 *   - bg / border / box-shadow / opacity captured per leaf via getComputedStyle()
 *   - per-line text geometry captured via Range.getClientRects(), so multi-line
 *     centered headings + RTL last-line positions replay exactly
 *   - dense leaf grids exercise the cost-bounded walk + per-card surface capture
 * A single `advancedLoading` ref controls all three so users can flip between
 * "real" and "skeleton" in one click and compare side-by-side. */
const advancedLoading = ref(true);

async function toggleAdvanced() {
  advancedLoading.value = !advancedLoading.value;
}

/* Demo A — pricing card. Real card has a white fill on a coloured page, a
 * recommended badge with emerald tint, an outlined secondary button, and a
 * shadow. The captured skeleton preserves all of those because of the new
 * `bg` / `border` / `boxShadow` detectors. */
interface PricingFeature {
  text: string;
}
const pricingFeatures: PricingFeature[] = [
  { text: 'Unlimited projects + integrations' },
  { text: 'Priority support, 4-hour SLA' },
  { text: 'Team workspaces with SSO' },
  { text: 'Audit log + advanced permissions' },
];

/* Demo B — Arabic RTL hero, structurally similar to the hero the user was
 * fixing. Centred multi-line heading + paragraph, RTL last-line positioning.
 * Per-line Range capture means the short last line lands on the *right* in
 * RTL, not on the left as the v1.1.0 heuristic produced. */
const heroBullets = [
  { icon: 'lucide:rocket', text: 'إطلاق فوري في 1-3 أيام' },
  { icon: 'lucide:headphones', text: 'دعم فني متواصل' },
  { icon: 'lucide:layout-dashboard', text: 'لوحة تحكم سهلة ومرنة' },
];

/* Demo C — dashboard stats grid. Each card has its own background tint, an
 * icon, a big number, a label, and a small trend chip with opacity < 1. The
 * skeleton picks up each per-card surface plus the chip's translucency. */
interface Stat {
  icon: string;
  label: string;
  value: string;
  trend: string;
  trendTone: 'up' | 'down';
  bg: string;
}
const stats: Stat[] = [
  {
    icon: 'lucide:users',
    label: 'Active donors',
    value: '12,480',
    trend: '+8.2%',
    trendTone: 'up',
    bg: 'bg-emerald-50',
  },
  {
    icon: 'lucide:trending-up',
    label: 'Monthly receipts',
    value: 'SAR 184k',
    trend: '+12%',
    trendTone: 'up',
    bg: 'bg-sky-50',
  },
  {
    icon: 'lucide:hand-coins',
    label: 'Avg. donation',
    value: 'SAR 92',
    trend: '−2.1%',
    trendTone: 'down',
    bg: 'bg-amber-50',
  },
  {
    icon: 'lucide:bell',
    label: 'Open campaigns',
    value: '7',
    trend: '+1',
    trendTone: 'up',
    bg: 'bg-violet-50',
  },
];
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
         v-for + grid + #prototype + :repeat
         The failing case from the bug report, now solved end-to-end.
         ============================================================ -->
    <h2 class="mt-12 mb-2 text-xl font-semibold tracking-tight">
      Lists & grids · <code>v-for</code> with <code>#prototype</code> and <code>:repeat</code>
    </h2>
    <p class="mb-4 text-sm text-text-dim">
      A responsive grid of cards, each with a switch, a counter, a heading, and two buttons. The
      <code>class</code> with grid utilities lives on <code>&lt;ASkeleton&gt;</code> itself, so the
      grid container is the same DOM element in both states — no layout shift when data arrives. The
      <code>#prototype</code> slot supplies the shape source while <code>roles=[]</code>;
      <code>:repeat="6"</code> fills six skeleton cards 1:1 against the eventual loaded set.
    </p>

    <div class="mb-12 rounded-xl border border-brand-border bg-surface p-5">
      <div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          class="cursor-pointer rounded border border-brand-border bg-surface-2 px-3 py-1.5 text-sm text-text-dim hover:bg-surface"
          @click="toggleRoles"
        >
          {{ rolesLoading ? 'Resolve' : 'Reset to loading' }}
        </button>
        <label class="ml-3 flex items-center gap-2 text-text-dim">
          <span>repeat:</span>
          <input
            v-model.number="rolesRepeat"
            type="range"
            min="1"
            max="12"
            step="1"
            class="cursor-pointer"
          />
          <span class="w-6 text-right tabular-nums">{{ rolesRepeat }}</span>
        </label>
        <span class="ml-3 text-text-dim">
          loading = <code>{{ rolesLoading }}</code> · roles.length =
          <code>{{ roles.length }}</code>
        </span>
      </div>

      <ASkeleton
        :loading="rolesLoading"
        :repeat="rolesRepeat"
        :max-nodes="10000"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <!-- Prototype: one card. Used as the skeleton shape source while loading,
             regardless of whether `roles` is populated. Never rendered when
             loading=false. -->
        <template #prototype>
          <article
            class="flex flex-col gap-3 rounded-lg bg-white p-5 ring-1 ring-gray-200 text-gray-900"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-500">0 users</p>
              <div class="h-5 w-9 rounded-full bg-gray-200" role="presentation" />
            </div>
            <h3 class="text-lg font-bold">Role placeholder</h3>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button class="rounded border border-gray-300 px-3 py-1.5 text-sm">View users</button>
              <button class="rounded px-3 py-1.5 text-sm text-gray-600">Edit</button>
            </div>
          </article>
        </template>

        <!-- Real content. v-for over the loaded data. -->
        <article
          v-for="role in roles"
          :key="role.id"
          class="flex flex-col gap-3 rounded-lg bg-white p-5 ring-1 ring-gray-200 text-gray-900"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">{{ role.users_count }} users</p>
            <span
              class="inline-block h-5 w-9 rounded-full"
              :class="role.is_active ? 'bg-emerald-500' : 'bg-gray-200'"
              :aria-label="role.is_active ? 'Active' : 'Inactive'"
            />
          </div>
          <h3 class="text-lg font-bold">{{ role.name }}</h3>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button class="rounded border border-gray-300 px-3 py-1.5 text-sm">View users</button>
            <button class="rounded px-3 py-1.5 text-sm text-gray-600">Edit</button>
          </div>
        </article>
      </ASkeleton>
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
      Auto cache key · per-instance · truncation surface
    </h2>
    <p class="mb-4 text-sm text-text-dim">
      Both wrappers below render the <strong>same</strong> component with
      <strong>no</strong> explicit <code>cache-key</code>. The default key is
      <code>&lt;slot-name&gt;:&lt;useId()&gt;</code> — distinct per instance — so the narrow
      wrapper's captured shape never replays inside the wide one. Drop <code>max-nodes</code> to
      <code>5</code> and open DevTools: you'll see
      <code>[ASkeleton] Capture truncated…</code> exactly once per instance, even after multiple
      reloads of the same wrapper.
    </p>

    <div class="mb-4 flex flex-wrap items-center gap-3 text-sm">
      <label class="flex items-center gap-2">
        <span>max-nodes:</span>
        <input
          v-model.number="autoMaxNodes"
          type="number"
          min="3"
          max="500"
          class="w-20 rounded border border-brand-border bg-surface-2 px-2 py-1"
        />
      </label>

      <button
        class="cursor-pointer rounded border border-brand bg-brand px-3 py-1.5 font-semibold text-bg hover:brightness-110"
        @click="loadAutoProfile"
      >
        Reload both
      </button>
      <button
        class="cursor-pointer rounded border border-brand-border px-3 py-1.5 text-text-dim hover:bg-surface-2"
        @click="resetAutoProfile"
      >
        Show skeleton
      </button>
    </div>

    <div class="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-lg border border-brand-border bg-surface p-4">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
          Wide instance · no cacheKey
        </p>
        <ASkeleton :loading="autoLoading" :max-nodes="autoMaxNodes">
          <div class="flex items-start gap-4 p-2">
            <img
              v-if="autoProfile?.avatar"
              :src="autoProfile.avatar"
              :alt="autoProfile.name"
              class="size-16 shrink-0 rounded-full object-cover"
            />
            <div v-else class="size-16 shrink-0 rounded-full" />
            <div class="flex-1">
              <h3 class="text-base font-semibold">{{ autoProfile?.name }}</h3>
              <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">
                {{ autoProfile?.role }}
              </p>
              <p class="mt-2 text-sm leading-relaxed">{{ autoProfile?.bio }}</p>
            </div>
          </div>
        </ASkeleton>
      </div>

      <div class="rounded-lg border border-brand-border bg-surface p-4">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
          Narrow instance · no cacheKey
        </p>
        <div class="max-w-[260px]">
          <ASkeleton :loading="autoLoading" :max-nodes="autoMaxNodes">
            <div class="flex items-start gap-4 p-2">
              <img
                v-if="autoProfile?.avatar"
                :src="autoProfile.avatar"
                :alt="autoProfile.name"
                class="size-16 shrink-0 rounded-full object-cover"
              />
              <div v-else class="size-16 shrink-0 rounded-full" />
              <div class="flex-1">
                <h3 class="text-base font-semibold">{{ autoProfile?.name }}</h3>
                <p class="mt-0.5 text-xs uppercase tracking-wide text-text-dim">
                  {{ autoProfile?.role }}
                </p>
                <p class="mt-2 text-sm leading-relaxed">{{ autoProfile?.bio }}</p>
              </div>
            </div>
          </ASkeleton>
        </div>
      </div>
    </div>

    <h2 class="mt-10 mb-2 text-xl font-semibold tracking-tight">
      Advanced detection · v1.2.0 capture engine
    </h2>
    <p class="mb-4 text-sm text-text-dim">
      Three richer slot trees that each show a different signal added in 1.2.0.
      <strong>Pricing card</strong> proves <code>bg</code> / <code>border</code> /
      <code>box-shadow</code> capture — the white fill, emerald badge tint, outlined secondary
      button, and card elevation all carry through. <strong>Arabic hero</strong>
      proves the Range-API per-line capture — the short last line of the centred RTL heading lands
      on the right, not on the left as the old heuristic produced.
      <strong>Stats grid</strong> proves per-card surface capture across a dense leaf layout — each
      card keeps its own background tint, each trend chip its opacity.
    </p>

    <div class="mb-4 flex flex-wrap items-center gap-3 text-sm">
      <button
        class="cursor-pointer rounded border border-brand bg-brand px-3 py-1.5 font-semibold text-bg hover:brightness-110"
        @click="toggleAdvanced"
      >
        {{ advancedLoading ? 'Show real components' : 'Show skeleton' }}
      </button>
    </div>

    <div class="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <!-- Demo A: pricing card -->
      <div class="rounded-lg border border-brand-border bg-surface p-4">
        <p class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
          Pricing card · bg + border + box-shadow capture
        </p>
        <div class="rounded-2xl bg-zinc-100 p-6">
          <ASkeleton :loading="advancedLoading">
            <div
              class="rounded-2xl bg-white p-6 ring-1 ring-zinc-200"
              style="box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.18)"
            >
              <span
                class="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                RECOMMENDED
              </span>
              <h3 class="mt-4 text-2xl font-bold text-zinc-900">Pro</h3>
              <p class="mt-1 text-sm leading-relaxed text-zinc-600">
                Everything in Starter, plus team workspaces, SSO, audit logs, and 4-hour support
                SLAs. Cancel anytime.
              </p>
              <div class="mt-6 flex items-baseline gap-1">
                <span class="text-4xl font-bold text-zinc-900">$49</span>
                <span class="text-sm text-zinc-500">/month</span>
              </div>
              <ul class="mt-6 space-y-2 text-sm text-zinc-700">
                <li v-for="f in pricingFeatures" :key="f.text" class="flex items-start gap-2">
                  <Icon name="lucide:check" class="mt-0.5 size-4 text-emerald-600" mode="svg" />
                  <span>{{ f.text }}</span>
                </li>
              </ul>
              <button
                class="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                style="box-shadow: 0 8px 18px -8px rgba(5, 150, 105, 0.6)"
              >
                Start free trial
              </button>
              <button
                class="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700"
              >
                Talk to sales
              </button>
            </div>
          </ASkeleton>
        </div>
      </div>

      <!-- Demo B: Arabic RTL hero -->
      <div class="rounded-lg border border-brand-border bg-surface p-4">
        <p class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
          Arabic RTL hero · per-line Range capture
        </p>
        <ASkeleton :loading="advancedLoading">
          <div
            dir="rtl"
            class="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-lime-500 p-8 text-center"
          >
            <h1 class="mb-4 text-2xl font-bold leading-tight text-white md:text-3xl">
              أطلق منصة تبرعات إلكترونية متكاملة لجمعيتك مع
              <span class="text-yellow-200">عطاء</span>
            </h1>
            <p class="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-white/90">
              عطاء تمنحك نظام تبرعات ذكي وسهل الاستخدام، يساعدك على جذب المتبرعين، تنظيم مشاريعك،
              وتتبع التبرعات والتقارير في مكان واحد
            </p>
            <div class="mb-6 flex flex-wrap items-center justify-center gap-3">
              <button
                class="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700"
              >
                احجز موعد لعرض تعريفي
              </button>
              <button
                class="rounded-xl border border-white bg-transparent px-5 py-2.5 text-sm font-semibold text-white"
              >
                استعرض النسخة التجريبية
              </button>
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div
                v-for="b in heroBullets"
                :key="b.text"
                class="flex items-center justify-center gap-2 text-white"
              >
                <Icon :name="b.icon" class="size-4" mode="svg" />
                <span class="text-sm">{{ b.text }}</span>
              </div>
            </div>
          </div>
        </ASkeleton>
      </div>

      <!-- Demo C: dashboard stats grid -->
      <div class="rounded-lg border border-brand-border bg-surface p-4 xl:col-span-2">
        <p class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
          Stats grid · per-card surface + opacity capture
        </p>
        <ASkeleton :loading="advancedLoading">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div
              v-for="s in stats"
              :key="s.label"
              :class="['rounded-xl p-4 ring-1 ring-zinc-200', s.bg]"
              style="box-shadow: 0 4px 12px -6px rgba(0, 0, 0, 0.08)"
            >
              <div class="flex items-center justify-between">
                <Icon :name="s.icon" class="size-5 text-zinc-700" mode="svg" />
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    s.trendTone === 'up'
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-rose-200 text-rose-800',
                  ]"
                  style="opacity: 0.85"
                >
                  {{ s.trend }}
                </span>
              </div>
              <div class="mt-4 text-2xl font-bold text-zinc-900">{{ s.value }}</div>
              <div class="text-xs text-zinc-600">{{ s.label }}</div>
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
