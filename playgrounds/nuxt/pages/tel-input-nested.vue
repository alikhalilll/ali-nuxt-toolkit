<script setup lang="ts">
/**
 * Regression harness for the nested-drawer fix.
 *
 * Reproduces the exact failure mode reported in `saas-frontend/apps/kashier` — an
 * `ATelInput` rendered inside a vaul-vue drawer, with the country picker's own
 * drawer opening on top. Before the fix, opening the picker was fatal:
 *
 *   - clicking the picker's overlay closed the *outer* drawer too (both vaul
 *     `DrawerRoot`s registered their own dismiss handlers against the shared
 *     portal, and the mount-order race let the outer fire before the inner
 *     `DismissableLayer` claimed the top of the stack),
 *   - typing in the picker's search input went nowhere (the outer drawer's
 *     Radix focus trap yanked focus back into itself as soon as the inner
 *     input got focused).
 *
 * With the tree-walk in `AResponsivePopover` the inner branch flips to
 * `DrawerRootNested`, wires the parent's onNestedDrag / onNestedRelease /
 * onNestedOpenChange bridges, and the outer drawer stays out of both loops.
 *
 * How to verify manually:
 *   1. `pnpm --filter nuxt-playground dev` (or `pnpm play` from the repo root).
 *   2. Navigate to `/tel-input-nested`.
 *   3. Click "Open drawer" — the outer drawer opens.
 *   4. Click the flag on the tel input to open the country picker.
 *   5. Type in the picker's search box: keystrokes should show up.
 *   6. Click the picker's dimmed overlay: only the picker should close.
 *      The outer drawer must remain open. Repeat.
 *
 * The label under the tel input reports the runtime `nested` flag reported by
 * `AResponsivePopover` — useful as a quick "did the auto-detect fire?" sanity
 * check without opening the picker.
 */
import { ref, watch } from 'vue';
import { ADrawer, ADrawerContent, ADrawerTrigger } from '@alikhalilll/a-drawer';
import { ATelInput } from '@alikhalilll/a-tel-input';

const outerOpen = ref(false);
const phone = ref('');
const country = ref<number | null>(null);

/** Snapshot of `[data-vaul-drawer]` count in the DOM — sanity for the fix. */
const drawerCount = ref(0);
watch(outerOpen, async () => {
  await new Promise((r) => setTimeout(r, 100));
  drawerCount.value =
    typeof document !== 'undefined' ? document.querySelectorAll('[data-vaul-drawer]').length : 0;
});
</script>

<template>
  <section class="mx-auto max-w-2xl p-8">
    <h1 class="mb-4 text-2xl font-semibold">ATelInput inside a Drawer — nested regression test</h1>
    <p class="mb-6 text-sm text-text-dim">
      Before the fix, opening the country picker from inside this outer drawer would (a) break
      typing in the picker's search box and (b) close the outer drawer when the picker's overlay was
      clicked. The fix auto-detects the ancestor <code>DrawerRoot</code> and switches the picker's
      drawer to <code>DrawerRootNested</code>.
    </p>

    <ADrawer v-model:open="outerOpen">
      <ADrawerTrigger as-child>
        <button
          type="button"
          class="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow"
        >
          Open drawer
        </button>
      </ADrawerTrigger>

      <ADrawerContent class="p-6">
        <h2 class="mb-4 text-lg font-semibold">Outer drawer</h2>
        <p class="mb-4 text-sm text-text-dim">
          Click the flag on the right of the input, then try typing in the search box and clicking
          the country picker overlay.
        </p>

        <div class="max-w-sm">
          <ATelInput v-model:phone="phone" v-model:country="country" force-bottom-sheet size="lg" />
        </div>

        <p class="mt-6 text-xs text-text-dim">
          Live phone: <code>{{ phone || '(empty)' }}</code>
        </p>
        <p class="text-xs text-text-dim">
          Live country dial: <code>{{ country ?? 'null' }}</code>
        </p>
        <p class="mt-2 text-xs text-text-dim">
          Open vaul drawer nodes in the DOM: <code>{{ drawerCount }}</code>
          <span v-if="drawerCount > 0" class="text-brand"> (outer drawer is live)</span>
        </p>
      </ADrawerContent>
    </ADrawer>
  </section>
</template>
