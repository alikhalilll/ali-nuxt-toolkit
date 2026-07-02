<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { APopover } from '@alikhalilll/a-popover';
import { ADrawer } from '@alikhalilll/a-drawer';
import { provideResponsivePopoverContext } from '../composables/useResponsivePopoverContext';
import type { AResponsivePopoverProps, AResponsivePopoverSlots } from '../types';

const props = withDefaults(defineProps<AResponsivePopoverProps>(), {
  breakpoint: '(min-width: 768px)',
  modal: true,
  scrollLock: 'events',
  forceBottomSheet: false,
});

/**
 * Auto-detect nesting inside another vaul drawer by walking the Vue component tree.
 * When we find a `DrawerRoot` ancestor we render `DrawerRootNested` — otherwise the
 * two vaul roots race each other and the outer drawer closes when the inner overlay
 * is clicked (plus the outer focus trap eats keystrokes in the inner drawer).
 *
 * The walk mirrors exactly what `inject()` inside `DrawerRootNested` will see —
 * Vue's provide/inject follows the component tree, and slot content's instance
 * parent is whichever component renders `<slot/>` (not where the content was
 * declared), so an inner popover mounted inside an outer drawer's slot naturally
 * reaches the vaul `DrawerRoot` ancestor. A DOM sniff (`document.querySelector`)
 * would give the wrong answer twice: it fires on *sibling* open drawers elsewhere
 * on the page (Reka's provide/inject wouldn't reach them → `DrawerRootNested`
 * crashes on missing context), and it lingers during the outer drawer's ~500ms
 * exit animation while the node still has `data-vaul-drawer`.
 *
 * Only coupling is the component name — `'DrawerRoot'` is `vaul-vue`'s public
 * component name and is stable across versions.
 */
const instance = getCurrentInstance();
const nested = (() => {
  let parent = instance?.parent;
  while (parent) {
    const name = parent.type?.__name ?? (parent.type as { name?: string })?.name;
    if (name === 'DrawerRoot') return true;
    parent = parent.parent;
  }
  return false;
})();

defineSlots<AResponsivePopoverSlots>();

const open = defineModel<boolean>('open');

// Render-mode resolution. Today only `forceBottomSheet` short-circuits ahead of
// the media-query default; a future `forcePopover` would slot in as another
// branch before the fallback (dispatch-style — new render variants land as new
// entries, not as new conditions tangled into the consumer).
const isDesktopByMedia = useMediaQuery(() => props.breakpoint);
const isDesktop = computed(() => {
  if (props.forceBottomSheet) return false;
  return isDesktopByMedia.value;
});

/**
 * Per-branch `modal` resolution — the two roots interpret the prop differently:
 *
 *   APopover (desktop, reka-ui): `modal=true` triggers `PopoverContentModal` + its
 *   built-in `useBodyScrollLock`, which mutates `body { overflow: hidden }` and so
 *   breaks `position: sticky` on the host page. We never want that — our own
 *   event-based lock in `AResponsivePopoverContent` is sticky-safe and covers both
 *   `'events'` and `'body'` modes. Force `modal=false` on reka-ui regardless of the
 *   caller's `scrollLock` choice. Legacy `props.modal === false` still propagates
 *   (it was explicit).
 *
 *   ADrawer (mobile, vaul-vue): `modal=false` SUPPRESSES THE OVERLAY entirely. Drawers
 *   are modal by convention (a dimmed backdrop is the affordance), so default to modal
 *   unless the caller explicitly turned the whole thing off.
 */
const rekaModal = computed(() => false);
const drawerModal = computed(() => props.modal !== false);

// Always tell vaul to skip its body-style scroll lock — our event-based lock owns the
// scroll-prevention strategy now, and vaul's default `body { overflow: hidden;
// position: fixed }` mutation kills `position: sticky` everywhere on the host page.
// (Was previously gated on `scrollLock !== 'body'`; now `'body'` is also event-based,
// so we apply this unconditionally.)
const drawerNoBodyStyles = computed(() => true);

provideResponsivePopoverContext({
  open: computed(() => open.value ?? false),
  isDesktop: computed(() => isDesktop.value),
  scrollLock: computed(() => props.scrollLock),
});
</script>

<template>
  <APopover v-if="isDesktop" v-model:open="open" :modal="rekaModal" data-slot="responsive-popover">
    <slot :is-desktop="true" />
  </APopover>
  <ADrawer
    v-else
    v-model:open="open"
    :modal="drawerModal"
    :no-body-styles="drawerNoBodyStyles"
    :nested="nested"
    data-slot="responsive-popover"
  >
    <slot :is-desktop="false" />
  </ADrawer>
</template>
