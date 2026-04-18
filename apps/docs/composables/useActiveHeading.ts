import type { Ref } from 'vue';

/**
 * Height of the sticky UI (header + optional mobile TOC bar) plus
 * breathing room. Used both by scrollspy and by scroll-to-section so
 * they stay in sync and the target heading isn't hidden behind the bar.
 */
export function getStickyOffset(): number {
  if (!import.meta.client) return 96;
  const header = document.querySelector('header')?.getBoundingClientRect().height ?? 56;
  const mobileBar =
    document.querySelector<HTMLElement>('[data-mobile-toc-bar]')?.getBoundingClientRect().height ??
    0;
  return Math.round(header + mobileBar + 16);
}

export function scrollToHash(id: string) {
  if (!import.meta.client) return;
  const el = document.getElementById(id);
  if (!el) return;
  // Browser clamps to max scroll automatically, so for the last section
  // on a short page this simply lands at the page bottom (smoothly).
  const top = el.getBoundingClientRect().top + window.scrollY - getStickyOffset();
  window.scrollTo({ top, behavior: 'smooth' });
  history.replaceState(history.state, '', `#${id}`);
}

function isNearPageBottom(): boolean {
  if (!import.meta.client) return false;
  const scrollMax = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  return window.scrollY + window.innerHeight >= scrollMax - 4;
}

/**
 * Scrollspy. Returns a ref holding the id of the heading currently
 * considered "active".
 *
 * Strategy:
 *   - An IntersectionObserver watches all heading elements. The "active
 *     zone" is a horizontal band under the sticky UI (top = stickyOffset,
 *     bottom = 40% of viewport). A heading is `visible` while any part
 *     of it is inside this band.
 *   - While one or more headings are in the zone, the active id is the
 *     topmost-in-document one of them.
 *   - While no heading is in the zone (the user is reading well below
 *     the last heading), the active id is the most recent heading that
 *     has scrolled ABOVE the zone.
 *
 * This is immune to the two classic failure modes of scroll-event-based
 * spies: flicker during smooth-scroll animations, and misreads when the
 * sticky UI changes height (e.g. mobile TOC bar opening).
 */
export function useActiveHeading(ids: Ref<string[]>) {
  const active = ref<string | null>(null);
  let observer: IntersectionObserver | null = null;
  const visible = new Set<string>();

  function resolve() {
    const list = ids.value;
    if (!list.length) {
      active.value = null;
      return;
    }

    // End-of-page short-circuit: when we're pinned to the bottom of the
    // document (typical for the tail of a short page), the last heading
    // wins even if it never entered the active zone. Otherwise the spy
    // would stay stuck on the previous heading forever.
    if (isNearPageBottom()) {
      active.value = list[list.length - 1] ?? null;
      return;
    }

    // Prefer topmost-in-document heading currently inside the active zone.
    const inZone = list.find((id) => visible.has(id));
    if (inZone) {
      active.value = inZone;
      return;
    }

    // No heading in the zone — pick the most recent heading scrolled above it.
    const triggerY = getStickyOffset() + 4;
    let above: string | null = null;
    for (const id of list) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.getBoundingClientRect().top < triggerY) {
        above = id;
      } else {
        break;
      }
    }
    active.value = above ?? list[0] ?? null;
  }

  function setup() {
    observer?.disconnect();
    visible.clear();
    if (!import.meta.client) return;
    if (!ids.value.length) {
      active.value = null;
      return;
    }

    const offset = getStickyOffset();
    // Active zone: top = below sticky UI, bottom = mid-viewport.
    // `-60%` for the bottom means the zone ends at 40% of viewport height.
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        resolve();
      },
      {
        rootMargin: `-${offset}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    for (const id of ids.value) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    resolve();
  }

  onMounted(() => {
    nextTick(setup);
    window.addEventListener('resize', setup);
    // Also recompute on scroll — needed for the fallback "above the zone" branch
    // where no observer entry fires (the zone has nothing in it).
    window.addEventListener('scroll', resolve, { passive: true });
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    window.removeEventListener('resize', setup);
    window.removeEventListener('scroll', resolve);
  });

  watch(ids, () => nextTick(setup), { deep: true });

  return active;
}
