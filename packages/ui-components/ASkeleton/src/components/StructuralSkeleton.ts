import { defineComponent, type PropType, type VNode, type VNodeArrayChildren } from 'vue';
import { buildStructuralSkeleton } from '../utils/buildStructuralSkeleton';

/**
 * Renders a structural skeleton derived from a slot's vnode tree. Pure render
 * function — no template, no scoped styles — so the parent's class strings
 * pass through unchanged and Tailwind utilities continue to drive layout.
 *
 * `maxNodes` is forwarded to the walker; cap defaults to 300 (see
 * `buildStructuralSkeleton`). Beyond that the walk stops emitting and the cap
 * propagates back as a clipped tree, keeping first-paint bounded.
 */
export const StructuralSkeleton = defineComponent({
  name: 'StructuralSkeleton',
  props: {
    vnodes: {
      type: Array as unknown as PropType<VNodeArrayChildren>,
      required: true,
    },
    animation: {
      type: String as PropType<string | null>,
      default: null,
    },
    maxDepth: {
      type: Number,
      default: 8,
    },
    maxNodes: {
      type: Number,
      default: 300,
    },
  },
  setup(props) {
    return (): VNode[] =>
      buildStructuralSkeleton(props.vnodes, {
        animationClass: props.animation,
        maxDepth: props.maxDepth,
        maxNodes: props.maxNodes,
      });
  },
});
