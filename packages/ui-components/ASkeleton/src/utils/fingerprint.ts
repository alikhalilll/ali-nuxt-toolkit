import { Comment, Fragment, Text, type VNode } from 'vue';

/**
 * Derive a default cache key from a slot's vnode tree. Returns the first
 * non-comment child's component name (or HTML tag). When the slot only contains
 * text / comments / unknown content, returns `'anonymous'` so the caller can
 * still cache, but with no useful identity — encourage an explicit `cacheKey`.
 */
export function fingerprintSlot(vnodes: VNode[] | undefined): string {
  if (!vnodes) return 'anonymous';
  for (const vnode of vnodes) {
    const tag = describeVNode(vnode);
    if (tag) return tag;
  }
  return 'anonymous';
}

function describeVNode(vnode: VNode): string | undefined {
  const t = vnode.type;
  if (t === Comment || t === Text) return undefined;
  if (t === Fragment) {
    const children = vnode.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child && typeof child === 'object' && 'type' in (child as object)) {
          const found = describeVNode(child as VNode);
          if (found) return found;
        }
      }
    }
    return undefined;
  }
  if (typeof t === 'string') return t;
  if (typeof t === 'object' && t !== null) {
    const named =
      (t as { name?: string }).name ??
      (t as { __name?: string }).__name ??
      (t as { displayName?: string }).displayName;
    if (named) return named;
  }
  return undefined;
}
