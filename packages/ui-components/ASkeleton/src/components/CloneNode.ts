/**
 * `CloneNode` — recursive renderer for one node of a `CaptureSnapshot`.
 *
 * Design:
 *   - **Strategy table by `CapturedNode.kind`**. Each kind ('container' |
 *     'text' | 'image' | 'video' | 'media' | 'block') has its own renderer
 *     function. Adding a new kind is one entry in `RENDERERS` — no edits
 *     elsewhere (Open/Closed).
 *   - **Pure render function**. No reactive state of its own; everything
 *     flows from props.
 *   - **Composition**: per-line text bars share the same shape as block
 *     leaves so there's no behaviour duplication.
 */
import { defineComponent, h, type PropType, type VNode } from 'vue';
import type { CapturedNode, TextLineRect } from '../utils/captureStyles';
import { renderImageIcon, renderPlayIcon } from './icons';

interface RendererCtx {
  node: CapturedNode;
  animClass: string | null;
  /** Convert a captured node into its absolute-positioned style object. */
  blockStyle: (n: CapturedNode) => Record<string, unknown>;
  /** Build the inline style for a per-line text bar. */
  lineStyle: (
    line: TextLineRect,
    parentStyle: Readonly<Record<string, string>>
  ) => Record<string, unknown>;
}

type Renderer = (ctx: RendererCtx) => VNode;

/* ─────────────────────────────────────────────────────────────────────────────
 * Strategy table — one renderer per `CapturedNode.kind`.
 * ───────────────────────────────────────────────────────────────────────────── */
const RENDERERS: Record<CapturedNode['kind'], Renderer> = {
  container: renderContainer,
  text: renderText,
  image: (ctx) => renderLeafWithIcon(ctx, 'image'),
  video: (ctx) => renderLeafWithIcon(ctx, 'video'),
  media: (ctx) => renderLeaf(ctx),
  block: (ctx) => renderLeaf(ctx),
};

/**
 * Container — positioned wrapper with captured background / border / shadow.
 * No `.a-skel` class so the surface shows through exactly as in the real DOM.
 * Recurse into children via the same `CloneNode`.
 *
 * `CapturedNode.{x,y}` is always root-relative, but children render inside
 * this container — itself `position: absolute`. If we hand children the
 * root-relative coords as-is, their `left` / `top` resolve against the
 * container (their new offset parent), doubling the offset. Pass a
 * `blockStyle` closure that subtracts this container's offset so each
 * descendant lands at its captured root-relative position regardless of
 * how deeply it's nested.
 */
function renderContainer(ctx: RendererCtx): VNode {
  const { node } = ctx;
  const childBlockStyle = (n: CapturedNode): Record<string, unknown> => ({
    position: 'absolute',
    left: `${n.x - node.x}px`,
    top: `${n.y - node.y}px`,
    width: `${n.w}px`,
    height: `${n.h}px`,
    ...n.style,
  });
  return h(
    'div',
    {
      class: 'a-skel-clone-container',
      style: ctx.blockStyle(node),
      'aria-hidden': 'true',
    },
    (node.children ?? []).map((child) =>
      h(CloneNode, {
        node: child,
        animClass: ctx.animClass,
        blockStyle: childBlockStyle,
        lineStyle: ctx.lineStyle,
      })
    )
  );
}

/**
 * Text — container carrying captured background/border, with per-line
 * shimmer bars positioned absolutely inside. Each text line becomes one bar
 * at the exact rendered text rect (multi-line / wrapped / RTL all replay 1:1).
 */
function renderText(ctx: RendererCtx): VNode {
  const { node, animClass } = ctx;
  /* Fallback to a single full-rect bar if the Range API wasn't usable. */
  const lines = node.textLines ?? [{ x: node.x, y: node.y, w: node.w, h: node.h }];
  return h(
    'div',
    {
      class: 'a-skel-clone-container a-skel-clone-text',
      style: ctx.blockStyle(node),
      'aria-hidden': 'true',
    },
    lines.map((line) =>
      h('div', {
        class: ['a-skel-clone-textbar', animClass],
        style: ctx.lineStyle(
          /* Convert root-relative line coords → container-relative. */
          { x: line.x - node.x, y: line.y - node.y, w: line.w, h: line.h },
          node.style
        ),
      })
    )
  );
}

/** Plain shimmer leaf (block / media). */
function renderLeaf(ctx: RendererCtx): VNode {
  return h('div', {
    class: ['a-skel a-skel-clone-leaf', ctx.animClass],
    style: ctx.blockStyle(ctx.node),
    'aria-hidden': 'true',
  });
}

/** Shimmer leaf with a centered placeholder icon (image / video). */
function renderLeafWithIcon(ctx: RendererCtx, kind: 'image' | 'video'): VNode {
  return h(
    'div',
    {
      class: ['a-skel a-skel-clone-leaf a-skel-clone-leaf--with-icon', ctx.animClass],
      style: ctx.blockStyle(ctx.node),
      'aria-hidden': 'true',
    },
    [kind === 'image' ? renderImageIcon() : renderPlayIcon()]
  );
}

export const CloneNode = defineComponent({
  name: 'CloneNode',
  props: {
    node: { type: Object as PropType<CapturedNode>, required: true },
    animClass: { type: [String, null] as PropType<string | null>, default: null },
    blockStyle: {
      type: Function as PropType<RendererCtx['blockStyle']>,
      required: true,
    },
    lineStyle: {
      type: Function as PropType<RendererCtx['lineStyle']>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const renderer = RENDERERS[props.node.kind];
      return renderer({
        node: props.node,
        animClass: props.animClass,
        blockStyle: props.blockStyle,
        lineStyle: props.lineStyle,
      });
    };
  },
});
