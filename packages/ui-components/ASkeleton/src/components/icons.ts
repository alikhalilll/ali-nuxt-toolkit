/**
 * Shared placeholder icon renderers for leaf nodes (image / video). Lives at
 * one site so both `CloneNode.ts` (clone mode) and `StructuralLayerNode.ts`
 * (Recipe 3 structural mode) render identical glyphs.
 */
import { h, type VNode } from 'vue';

export function renderImageIcon(): VNode {
  return h(
    'svg',
    {
      class: 'a-skel-clone-icon',
      viewBox: '0 0 24 24',
      'aria-hidden': 'true',
    },
    [
      h('path', {
        d: 'M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-3.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM19 17H5l3.5-4.5 2.5 3 3.5-4.5L19 17Z',
        fill: 'currentColor',
      }),
    ]
  );
}

export function renderPlayIcon(): VNode {
  return h(
    'svg',
    {
      class: 'a-skel-clone-icon',
      viewBox: '0 0 24 24',
      'aria-hidden': 'true',
    },
    [
      h('circle', {
        cx: 12,
        cy: 12,
        r: 10,
        stroke: 'currentColor',
        'stroke-width': 1.5,
        fill: 'none',
      }),
      h('path', { d: 'M10 8l6 4-6 4V8Z', fill: 'currentColor' }),
    ]
  );
}
