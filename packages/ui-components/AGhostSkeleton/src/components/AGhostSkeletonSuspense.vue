<script lang="ts">
import { defineComponent, h, onBeforeUnmount, onMounted, ref, Suspense, type PropType } from 'vue';
import { ATTR_PANE, ATTR_REVEAL, boxOf, fadeIn, fadeOut, Memory, type RevealMode } from '../core';
import { useGhostSkeleton } from '../composables/useGhostSkeleton';
import { useStyles } from '../composables/useStyles';
import { Loading } from './AGhostSkeleton.vue';

type State = { waited: boolean; exit: (() => void) | null };
const state = { type: Object as PropType<State>, required: true } as const;

export const Fallback = defineComponent({
  name: 'AGhostSkeletonFallback',
  props: { id: String, label: String, reveal: [String, Object] as PropType<RevealMode>, state },
  setup(props, { slots }) {
    const element = ref<HTMLElement | null>(null);
    const config = useGhostSkeleton();

    onMounted(() => {
      const pane = element.value;
      const reveal = pane?.parentElement;
      if (!pane || !reveal) return;
      // eslint-disable-next-line vue/no-mutating-props
      props.state.waited = true;
      fadeIn(pane, props.reveal ?? config.reveal, { initial: true });
      reveal.setAttribute('aria-busy', 'true');
    });

    onBeforeUnmount(() => {
      const pane = element.value;
      const reveal = pane?.parentElement;
      if (!pane || !reveal) return;
      reveal.removeAttribute('aria-busy');

      const box = boxOf(pane);
      const copy = pane.cloneNode(true) as HTMLElement;
      // eslint-disable-next-line vue/no-mutating-props
      props.state.exit = () => {
        Object.assign(copy.style, {
          position: 'absolute',
          top: `${box.top}px`,
          left: `${box.left}px`,
          width: `${box.width}px`,
        });
        reveal.prepend(copy);
        fadeOut(copy).then(() => copy.remove());
      };
    });

    return () =>
      h(
        'div',
        { ref: element, [ATTR_PANE]: '' },
        h(Loading, { id: props.id, exact: false, label: props.label }, slots.default)
      );
  },
});

export const BoundaryContent = defineComponent({
  name: 'AGhostSkeletonBoundaryContent',
  props: { id: String, reveal: [String, Object] as PropType<RevealMode>, state },
  emits: ['reveal'],
  setup(props, { slots, emit }) {
    const element = ref<HTMLElement | null>(null);
    const config = useGhostSkeleton();
    let memory: Memory | null = null;

    onMounted(() => {
      const pane = element.value;
      if (!pane) return;
      const waited = props.state.waited;
      const arrival = fadeIn(pane, props.reveal ?? config.reveal, {
        initial: !waited,
      });
      if (waited) arrival.then(() => emit('reveal'));

      props.state.exit?.();
      // eslint-disable-next-line vue/no-mutating-props
      props.state.exit = null;
      memory = new Memory(pane, { id: props.id });
    });
    onBeforeUnmount(() => memory?.destroy());

    return () => h('div', { ref: element, [ATTR_PANE]: '' }, slots.default?.());
  },
});

/**
 * A Suspense boundary whose fallback is a measured skeleton, crossfading into the content.
 *
 * ```vue
 * <AGhostSkeletonSuspense>
 *   <LoadedQuote />
 *   <template #skeleton><Quote :quote="SAMPLE_QUOTE" /></template>
 * </AGhostSkeletonSuspense>
 * ```
 */
export default defineComponent({
  name: 'AGhostSkeletonSuspense',
  props: {
    /** Remembers the shape under this key across visits. */
    id: String,
    /** Read to screen readers while suspended, in place of the skeleton. */
    label: String,
    /** Overrides the provider's reveal for this boundary alone. */
    reveal: [String, Object] as PropType<RevealMode>,
  },
  /** `reveal`: content has come in over the skeleton. */
  emits: ['reveal'],
  setup(props, { slots, emit }) {
    useStyles();
    const shared: State = { waited: false, exit: null };

    return () =>
      h('div', { [ATTR_REVEAL]: '' }, [
        h(Suspense, null, {
          default: () =>
            h(
              BoundaryContent,
              {
                id: props.id,
                reveal: props.reveal,
                state: shared,
                onReveal: () => emit('reveal'),
              },
              slots.default
            ),
          fallback: () =>
            h(
              Fallback,
              {
                id: props.id,
                label: props.label,
                reveal: props.reveal,
                state: shared,
              },
              slots.skeleton
            ),
        }),
      ]);
  },
});
</script>
