/**
 * The reveal pane lifecycle, wired to the framework-agnostic `Memory`
 * class for content-side dev checks.
 *
 * Responsibilities split between layers:
 *   - This composable (Vue): watches state transitions, runs `fadeIn` on
 *     the newly mounted pane, emits `@reveal` on the specific
 *     `skeleton → content` edge, reports the loading source to the
 *     debug overlay, instantiates `Memory` for the content pane.
 *   - `Memory` class (framework-agnostic): observes the content for
 *     changes, saves its serialised shape, runs the dev-mode checks
 *     (missing sample / unsized images / size mismatch) with the
 *     correct wait-for-image-settle timing.
 *   - `Ghost` class (framework-agnostic): already instantiated by
 *     `<ASkeletonBones>`; reports the loading pane's source to the
 *     debug overlay and sets `loadingSize` for Memory to read.
 *
 * SRP: this composable owns the Vue reactivity glue; the engine classes
 * own the DOM-observing + persistence + dev-report policies.
 */

import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue';
import { Memory } from '../engine/Memory';
import { fadeIn } from '../reveal/apply';
import type { ASkeletonReveal } from '../types';
import type { ASkeletonState } from '../utils/resolveState';
import { clearReveal } from '../utils/debug';

interface LifecycleInput {
  state: Ref<ASkeletonState>;
  reveal: Ref<ASkeletonReveal | undefined>;
  mode: Ref<string>;
  cacheKey: Ref<string | undefined>;
  data: Ref<unknown>;
  sample: Ref<unknown>;
  driven: Ref<boolean>;
  revealEl: Ref<HTMLElement | null>;
  skeletonRef: Ref<HTMLElement | null>;
  contentRef: Ref<HTMLElement | null>;
  errorRef: Ref<HTMLElement | null>;
  emptyRef: Ref<HTMLElement | null>;
  /** Debug overlay source selector — called when the skeleton pane mounts. */
  sourceOf: () => string;
  emit: (event: 'reveal') => void;
}

export function useSkeletonLifecycle(input: LifecycleInput): void {
  let memory: Memory | null = null;

  function paneRefFor(state: ASkeletonState): HTMLElement | null {
    switch (state) {
      case 'content':
        return input.contentRef.value;
      case 'error':
        return input.errorRef.value;
      case 'empty':
        return input.emptyRef.value;
      case 'skeleton':
        return input.skeletonRef.value;
    }
  }

  function teardownMemory(): void {
    memory?.destroy();
    memory = null;
  }

  watch(
    () => input.state.value,
    (next, prev) => {
      const previous = (prev as ASkeletonState | undefined) ?? null;
      void nextTick(() => {
        const target = paneRefFor(next);
        if (!target) return;

        /* Fire the reveal animation. `fadeIn` short-circuits to a resolved
         * promise under `prefers-reduced-motion` or when `Element.animate`
         * isn't available (jsdom / happy-dom). */
        void fadeIn(target, input.reveal.value ?? 'smart', {
          initial: previous === null,
        });

        /* Memory lives only on the content pane. If we're leaving a
         * previous content state (e.g. content → skeleton on refetch),
         * tear down the previous Memory first. */
        if (next !== 'content') teardownMemory();

        /* Content pane just mounted — instantiate Memory with the current
         * data + sample flags so it can run its dev-mode `check()` pass. */
        if (next === 'content' && target && !memory) {
          memory = new Memory(target, {
            id: input.cacheKey.value,
            data: input.data.value,
            rendered: input.driven.value,
            sample: input.sample.value !== undefined,
          });
        }

        /* Fire the `@reveal` emit exactly once per `skeleton → content`
         * edge. Error-to-content, empty-to-content, or non-skeleton pane
         * churn do not trigger it. */
        if (next === 'content' && previous === 'skeleton') {
          const anim = (target as unknown as { animate?: unknown }).animate;
          const emitReveal = () => input.emit('reveal');
          if (typeof anim !== 'function') {
            emitReveal();
            return;
          }
          void fadeIn(target, input.reveal.value ?? 'smart').then(emitReveal);
        }
      });
    },
    { immediate: true, flush: 'post' }
  );

  onBeforeUnmount(() => {
    teardownMemory();
    if (input.revealEl.value) clearReveal(input.revealEl.value);
  });

  /* `sourceOf` kept in the input shape for API stability — the Ghost
   * class now reports loading-source directly to the debug overlay, so
   * ASkeleton.vue doesn't need to compute + report it anymore. */
  void input.sourceOf;
}
