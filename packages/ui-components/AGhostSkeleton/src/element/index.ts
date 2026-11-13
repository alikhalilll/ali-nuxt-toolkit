import { Reveal, type RevealMode } from '../core';

// Importable on a server, where there's no HTMLElement to extend
const Base = typeof HTMLElement === 'undefined' ? (class {} as typeof HTMLElement) : HTMLElement;

/** A reveal in plain HTML: its children start as a skeleton with `loading`, as content without. */
export class AGhostSkeletonReveal extends Base {
  private reveal: Reveal | null = null;
  private started = false;

  connectedCallback() {
    if (this.started) return;
    this.started = true;
    const content = document.createDocumentFragment();
    content.append(...this.childNodes);
    this.reveal = new Reveal(this, {
      id: this.id || undefined,
      reveal: (this.getAttribute('reveal') as RevealMode | null) ?? undefined,
      label: this.getAttribute('label') ?? undefined,
      onReveal: () => this.dispatchEvent(new Event('reveal')),
    });
    if (this.hasAttribute('loading')) this.reveal.load(content);
    else this.reveal.show(content);
  }

  disconnectedCallback() {
    // A move reconnects within the task; only a removal stays out
    queueMicrotask(() => {
      if (this.isConnected) return;
      this.reveal?.destroy();
      this.reveal = null;
    });
  }

  /** Shows a skeleton measured from `content`, rendered from sample data, or else the shape last shown. */
  load(content?: Node | string) {
    this.setAttribute('loading', '');
    this.reveal?.load(content);
  }

  show(content: Node | string) {
    this.removeAttribute('loading');
    this.reveal?.show(content);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('a-ghost-skeleton-reveal')) {
  customElements.define('a-ghost-skeleton-reveal', AGhostSkeletonReveal);
  if (!customElements.get('ask-reveal')) {
    customElements.define('ask-reveal', class extends AGhostSkeletonReveal {});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'a-ghost-skeleton-reveal': AGhostSkeletonReveal;
    'ask-reveal': AGhostSkeletonReveal;
  }
}
