<script lang="ts">
import {
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  Transition,
  watch,
  type PropType,
  type VNodeChild,
} from 'vue';
import {
  ATTR_GHOST,
  ATTR_LAYER,
  ATTR_LOADING,
  ATTR_OWN,
  ATTR_PANE,
  ATTR_REVEAL,
  ATTR_SNAPSHOT,
  ATTR_STATUS,
  checkNonce,
  fadeIn,
  fadeOut,
  Ghost,
  INLINE_SCRIPT,
  INLINE_STUB,
  Memory,
  type MemoryOptions,
  type RevealMode,
} from '../core';
import { claimStub, useGhostSkeleton } from '../composables/useGhostSkeleton';
import { useStyles } from '../composables/useStyles';

/**
 * The measured loading pane. Internal — `<AGhostSkeleton>` renders it.
 *
 * The ghost is laid out but never seen; the layer holds bones in a shadow root,
 * so hydration never touches what was measured.
 */
export const Loading = defineComponent({
  name: 'AGhostSkeletonLoading',
  props: {
    id: String,
    exact: Boolean,
    refetch: Boolean,
    label: String,
  },
  setup(props, { slots }) {
    const element = ref<HTMLElement | null>(null);
    const config = useGhostSkeleton();
    const script = claimStub() ? INLINE_STUB : INLINE_SCRIPT;
    let ghost: Ghost | null = null;

    const optionsOf = () => ({ id: props.id, exact: props.exact, refetch: props.refetch });
    onMounted(() => {
      checkNonce(config.nonce);
      if (element.value) ghost = new Ghost(element.value, optionsOf());
    });
    // Options-only changes update the live ghost in place; the observers and shadow sheet
    // outlive a prop flip, which happens every data arrival in data-driven mode.
    watch(
      () => [props.id, props.exact, props.refetch],
      () => ghost?.update(optionsOf())
    );
    onBeforeUnmount(() => ghost?.destroy());

    return () => [
      props.label ? h('span', { [ATTR_STATUS]: '' }, props.label) : null,
      h(
        'div',
        {
          ref: element,
          [ATTR_LOADING]: '',
          'aria-hidden': 'true',
          inert: '',
        },
        [
          h('div', { [ATTR_GHOST]: '' }, slots.default?.()),
          h('div', { [ATTR_SNAPSHOT]: '' }),
          h('div', { [ATTR_LAYER]: '' }),
        ]
      ),
      h('script', { nonce: config.nonce, innerHTML: script }),
    ];
  },
});

export const Content = defineComponent({
  name: 'AGhostSkeletonContent',
  props: {
    memory: { type: Object as PropType<MemoryOptions>, required: true },
  },
  setup(props, { slots }) {
    const element = ref<HTMLElement | null>(null);
    let memory: Memory | null = null;

    onMounted(() => {
      if (element.value) memory = new Memory(element.value, props.memory);
    });
    onBeforeUnmount(() => memory?.destroy());

    return () => h('div', { ref: element }, slots.default?.());
  },
});

/**
 * Shows a skeleton measured from the content it wraps, then reveals the content.
 *
 * ```vue
 * <AGhostSkeleton :data="user" :sample="SAMPLE_USER">
 *   <template #default="{ data }">
 *     <UserCard :user="data" />
 *   </template>
 * </AGhostSkeleton>
 * ```
 */
export default defineComponent({
  name: 'AGhostSkeleton',
  props: {
    /** Shows the skeleton, even over `data`. With `data`, it also shows while there is none. */
    loading: { type: Boolean, default: undefined },
    /** Loading while `null` or `undefined`; handed to the default slot as `{ data }`. */
    data: { type: null as unknown as PropType<unknown>, required: false },
    /** Stands in for `data` to draw the skeleton before any has loaded. */
    sample: { type: null as unknown as PropType<unknown>, required: false },
    /** Remembers the shape under this key across visits. */
    id: String,
    /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
    label: String,
    empty: Boolean,
    error: { type: null as unknown as PropType<unknown>, required: false },
    /** Overrides the provider's reveal for this skeleton alone. */
    reveal: [String, Object] as PropType<RevealMode>,
  },
  /** `reveal`: content has come in over a skeleton. */
  emits: ['reveal'],
  setup(props, { slots, emit }) {
    const instance = getCurrentInstance();
    const config = useGhostSkeleton();
    let last: { id?: string; data: unknown } | null = null;
    let shown: string | null = null;
    let from: string | null = null;
    useStyles();

    return () => {
      const driven = !!instance?.vnode.props && 'data' in instance.vnode.props;
      const data = props.data;
      if (data != null) last = { id: props.id, data };

      const show = (value: unknown): VNodeChild =>
        driven
          ? value != null
            ? slots.default?.({ data: value })
            : null
          : slots.default?.({ data: undefined });

      const loading = !!props.loading || (driven && data == null && !props.error && !props.empty);

      let key: string;
      let content: VNodeChild;
      if (loading) {
        const previous = last as { id?: string; data: unknown } | null;
        const real = data ?? (previous && previous.id === props.id ? previous.data : null);
        key = 'skeleton';
        content = slots.skeleton
          ? h('div', { [ATTR_OWN]: '', 'aria-hidden': 'true' }, slots.skeleton())
          : h(
              Loading,
              {
                id: props.id,
                exact: real != null,
                refetch: data != null,
                label: props.label,
              },
              () => show(real ?? props.sample)
            );
      } else if (props.error) {
        key = 'error';
        content = slots.error?.({ error: props.error });
      } else if (props.empty) {
        key = 'empty';
        content = slots.empty?.() ?? show(data);
      } else {
        key = 'content';
        content = h(
          Content,
          {
            memory: {
              id: props.id,
              data,
              rendered: driven,
              sample: props.sample !== undefined,
            },
          },
          () => show(data)
        );
      }

      if (key !== shown) {
        from = shown;
        shown = key;
      }
      const revealing = key === 'content' && from === 'skeleton';

      const reveal = props.reveal ?? config.reveal;
      return h('div', { [ATTR_REVEAL]: '', 'aria-busy': loading || undefined }, [
        h(
          Transition,
          {
            css: false,
            appear: true,
            onAppear: (el, done) => fadeIn(el as HTMLElement, reveal, { initial: true }).then(done),
            onEnter: (el, done) =>
              fadeIn(el as HTMLElement, reveal).then(() => {
                done();
                if (revealing) emit('reveal');
              }),
            onLeave: (el, done) => fadeOut(el as HTMLElement).then(done),
          },
          () => h('div', { key, [ATTR_PANE]: '' }, [content])
        ),
      ]);
    };
  },
});
</script>
