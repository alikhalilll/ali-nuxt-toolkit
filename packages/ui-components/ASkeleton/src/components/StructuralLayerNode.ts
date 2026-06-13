/**
 * `StructuralLayerNode` — recursive renderer for a `StructuralNode` from a
 * `StructuralShape` captured by `walkStructural`. Used internally by
 * `<ASkeletonLayer>`.
 *
 * Design:
 *   - **Strategy table** keyed by `node.kind` + `node.leafKind`. Each kind has
 *     its own renderer function. Adding a new kind is one entry in `RENDERERS`
 *     (Open/Closed) — no edits elsewhere.
 *   - **Pure render function**: no reactive state of its own; everything flows
 *     from props.
 *   - **Container preservation**: container nodes emit `<{node.tag}
 *     :class="node.className" :style="node.style">…children…</…>`. The
 *     captured `style` carries comprehensive layout + visual CSS so the
 *     skeleton reads correctly even when the consumer's stylesheet isn't
 *     loaded at the mount point.
 *   - **Leaves**: render `<div class="a-skel + originalClass" :style="style">`.
 *     The original `class` is preserved so utility-first CSS (`mt-4`,
 *     `flex-1`, `inline-block`, …) survives; the captured style carries the
 *     same layout + visual properties used on containers plus `width` +
 *     `height` so the placeholder claims the right space.
 */
import { defineComponent, h, type PropType, type VNode } from 'vue';
import type { ContainerNode, LeafKind, LeafNode, StructuralNode } from '../types';
import { renderImageIcon, renderPlayIcon } from './icons';

interface RendererCtx {
  node: StructuralNode;
  animClass: string | null;
}

type Renderer = (ctx: RendererCtx) => VNode;

/* ─────────────────────────────────────────────────────────────────────────────
 * Strategy table — one renderer per kind. Containers carry their captured
 * structure; leaves render as a-skel placeholders.
 * ───────────────────────────────────────────────────────────────────────────── */
const LEAF_RENDERERS: Record<LeafKind, (node: LeafNode, animClass: string | null) => VNode> = {
  block: renderLeafBlock,
  media: renderLeafBlock,
  text: renderLeafText,
  image: (node, animClass) => renderLeafWithIcon(node, animClass, 'image'),
};

function renderContainer(node: ContainerNode, animClass: string | null): VNode {
  return h(
    node.tag,
    {
      class: node.className || undefined,
      style: node.style,
      'aria-hidden': 'true',
    },
    node.children.map((child) => h(StructuralLayerNode, { node: child, animClass }))
  );
}

/**
 * Build the leaf's `class` payload. Always includes `a-skel` (skeleton
 * surface) + the animation class; the original consumer class trails so it
 * survives the cascade alongside utility-first frameworks.
 */
function leafClass(node: LeafNode, animClass: string | null, extra?: string): string[] {
  const classes: string[] = ['a-skel'];
  if (extra) classes.push(extra);
  if (animClass) classes.push(animClass);
  if (node.className) classes.push(node.className);
  return classes;
}

function renderLeafBlock(node: LeafNode, animClass: string | null): VNode {
  return h('div', {
    class: leafClass(node, animClass),
    style: node.style,
    'aria-hidden': 'true',
  });
}

/**
 * Text leaf — host carries the captured layout + visual surface (including
 * the leaf's `width` / `height` so it claims the right space in its parent's
 * layout). Each captured per-line rect renders as one bar inside the host,
 * absolutely positioned at the captured rect (rects are leaf-relative; the
 * host's captured style includes `position: relative` via the `.a-skel-text-host`
 * default — see styles.src.css).
 *
 * When `textLines` is absent (Range API unusable), the leaf renders as a
 * single shimmer bar at the host's bounds — same as a leaf-block.
 */
function renderLeafText(node: LeafNode, animClass: string | null): VNode {
  const lines = node.textLines;
  if (!lines || lines.length === 0) {
    return h('div', {
      class: leafClass(node, animClass, 'a-skel--text'),
      style: node.style,
      'aria-hidden': 'true',
    });
  }
  return h(
    'div',
    {
      class: ['a-skel-text-host', node.className || undefined],
      style: node.style,
      'aria-hidden': 'true',
    },
    lines.map((line) =>
      h('div', {
        class: ['a-skel', 'a-skel--text-line', animClass],
        style: {
          position: 'absolute',
          left: `${line.x}px`,
          top: `${line.y}px`,
          width: `${line.w}px`,
          height: `${line.h}px`,
        },
      })
    )
  );
}

function renderLeafWithIcon(
  node: LeafNode,
  animClass: string | null,
  kind: 'image' | 'video'
): VNode {
  return h(
    'div',
    {
      class: leafClass(node, animClass, 'a-skel--with-icon'),
      style: node.style,
      'aria-hidden': 'true',
    },
    [kind === 'image' ? renderImageIcon() : renderPlayIcon()]
  );
}

const RENDERERS: Record<'container' | 'leaf', Renderer> = {
  container: (ctx) => renderContainer(ctx.node as ContainerNode, ctx.animClass),
  leaf: (ctx) => {
    const leaf = ctx.node as LeafNode;
    return LEAF_RENDERERS[leaf.leafKind](leaf, ctx.animClass);
  },
};

export const StructuralLayerNode = defineComponent({
  name: 'StructuralLayerNode',
  props: {
    node: { type: Object as PropType<StructuralNode>, required: true },
    animClass: { type: [String, null] as PropType<string | null>, default: null },
  },
  setup(props) {
    return () =>
      RENDERERS[props.node.kind]({
        node: props.node,
        animClass: props.animClass,
      });
  },
});
