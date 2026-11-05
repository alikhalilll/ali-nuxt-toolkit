import { describe, expect, it } from 'vitest';
import '../src/element';
import { ASmartSkeletonReveal } from '../src/element';

describe('ASmartSkeletonReveal custom element', () => {
  it('is registered in customElements registry', () => {
    expect(customElements.get('a-smart-skeleton-reveal')).toBeDefined();
    expect(customElements.get('ask-reveal')).toBeDefined();
  });

  it('can be instantiated and exposes load and show methods', () => {
    const el = document.createElement('a-smart-skeleton-reveal') as ASmartSkeletonReveal;
    expect(typeof el.load).toBe('function');
    expect(typeof el.show).toBe('function');

    el.setAttribute('loading', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('loading')).toBe(true);

    el.show('<div>Content</div>');
    expect(el.hasAttribute('loading')).toBe(false);

    el.remove();
  });
});
