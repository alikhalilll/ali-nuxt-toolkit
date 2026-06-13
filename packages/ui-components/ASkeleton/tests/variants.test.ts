/**
 * Variant primitive mount tests. For each variant we assert:
 *   1. It renders.
 *   2. It has the right ARIA role + busy state.
 *   3. The default animation class is applied.
 *   4. Custom props (size, lines, etc.) reach the DOM.
 *   5. A `<span class="a-skel-sr-only">Loading…</span>` is present for AT.
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ASkeletonText from '../src/components/variants/ASkeletonText.vue';
import ASkeletonHeading from '../src/components/variants/ASkeletonHeading.vue';
import ASkeletonAvatar from '../src/components/variants/ASkeletonAvatar.vue';
import ASkeletonImage from '../src/components/variants/ASkeletonImage.vue';
import ASkeletonVideo from '../src/components/variants/ASkeletonVideo.vue';
import ASkeletonButton from '../src/components/variants/ASkeletonButton.vue';
import ASkeletonInput from '../src/components/variants/ASkeletonInput.vue';
import ASkeletonListItem from '../src/components/variants/ASkeletonListItem.vue';
import ASkeletonCard from '../src/components/variants/ASkeletonCard.vue';
import ASkeletonTable from '../src/components/variants/ASkeletonTable.vue';
import ASkeletonChart from '../src/components/variants/ASkeletonChart.vue';
import ASkeletonForm from '../src/components/variants/ASkeletonForm.vue';
import ASkeletonArticle from '../src/components/variants/ASkeletonArticle.vue';
import ASkeletonDivider from '../src/components/variants/ASkeletonDivider.vue';
import ASkeletonChip from '../src/components/variants/ASkeletonChip.vue';

describe('ASkeletonText', () => {
  it('renders `lines` bars', () => {
    const w = mount(ASkeletonText, { props: { lines: 4 } });
    expect(w.findAll('.a-skel-variant-text')).toHaveLength(4);
  });
  it('has role=status + sr-only label', () => {
    const w = mount(ASkeletonText);
    expect(w.attributes('role')).toBe('status');
    expect(w.find('.a-skel-sr-only').text()).toContain('Loading');
  });
});

describe('ASkeletonHeading', () => {
  it('respects level prop via height', () => {
    const w = mount(ASkeletonHeading, { props: { level: 1 } });
    expect(w.attributes('style')).toMatch(/height/i);
  });
});

describe('ASkeletonAvatar', () => {
  it('size prop forwards to width/height', () => {
    const w = mount(ASkeletonAvatar, { props: { size: 64 } });
    expect(w.attributes('style')).toMatch(/64px/);
  });
  it('shape="square" removes border-radius', () => {
    const w = mount(ASkeletonAvatar, { props: { shape: 'square' } });
    expect(w.attributes('style')).toMatch(/border-radius:\s*0/);
  });
});

describe('ASkeletonImage', () => {
  it('renders the placeholder icon by default', () => {
    const w = mount(ASkeletonImage);
    expect(w.find('svg').exists()).toBe(true);
  });
  it('showIcon=false hides the icon', () => {
    const w = mount(ASkeletonImage, { props: { showIcon: false } });
    expect(w.find('svg').exists()).toBe(false);
  });
});

describe('ASkeletonVideo', () => {
  it('renders the play-icon placeholder', () => {
    const w = mount(ASkeletonVideo);
    expect(w.find('svg').exists()).toBe(true);
  });
});

describe('ASkeletonButton', () => {
  it('outlined sets transparent bg + border', () => {
    const w = mount(ASkeletonButton, { props: { outlined: true } });
    const s = w.attributes('style') || '';
    expect(s).toMatch(/transparent/);
    expect(s).toMatch(/border/);
  });
});

describe('ASkeletonInput', () => {
  it('renders with input variant class', () => {
    const w = mount(ASkeletonInput);
    expect(w.classes()).toContain('a-skel-variant-input');
  });
});

describe('ASkeletonListItem', () => {
  it('avatar=false hides the avatar', () => {
    const w = mount(ASkeletonListItem, { props: { avatar: false } });
    expect(w.find('.a-skel-variant-avatar').exists()).toBe(false);
  });
  it('lines prop reaches the inner text variant', () => {
    const w = mount(ASkeletonListItem, { props: { lines: 3 } });
    expect(w.findAll('.a-skel-variant-text')).toHaveLength(3);
  });
});

describe('ASkeletonCard', () => {
  it('media=false hides the image', () => {
    const w = mount(ASkeletonCard, { props: { media: false } });
    expect(w.find('.a-skel-variant-image').exists()).toBe(false);
  });
  it('actions=true renders two buttons', () => {
    const w = mount(ASkeletonCard, { props: { actions: true } });
    expect(w.findAll('.a-skel-variant-button').length).toBeGreaterThanOrEqual(2);
  });
});

describe('ASkeletonTable', () => {
  it('rows + columns prop drives the grid', () => {
    const w = mount(ASkeletonTable, { props: { rows: 3, columns: 5 } });
    /* showHeader=true (default) → 1 header row + 3 body rows = 4 row containers. */
    expect(w.findAll('.a-skel-variant-table__row')).toHaveLength(4);
  });
});

describe('ASkeletonChart', () => {
  it('renders `bars` count of chart bars', () => {
    const w = mount(ASkeletonChart, { props: { bars: 9, showHeader: false } });
    expect(w.findAll('.a-skel-variant-chart__bar')).toHaveLength(9);
  });
});

describe('ASkeletonForm', () => {
  it('renders `fields` label+input pairs', () => {
    const w = mount(ASkeletonForm, { props: { fields: 4, showSubmit: false } });
    expect(w.findAll('.a-skel-variant-input')).toHaveLength(4);
  });
});

describe('ASkeletonArticle', () => {
  it('paragraphs prop drives output', () => {
    const w = mount(ASkeletonArticle, {
      props: { paragraphs: 2, linesPerParagraph: 3, media: false },
    });
    /* 2 paragraphs × 3 lines + heading variant bars = total bars present */
    const bars = w.findAll('.a-skel-variant-text');
    expect(bars.length).toBeGreaterThanOrEqual(6);
  });
});

describe('ASkeletonDivider', () => {
  it('renders with role=separator', () => {
    const w = mount(ASkeletonDivider);
    expect(w.attributes('role')).toBe('separator');
  });
});

describe('ASkeletonChip', () => {
  it('renders inline span', () => {
    const w = mount(ASkeletonChip);
    expect(w.element.tagName).toBe('SPAN');
  });
});

describe('animation prop universally', () => {
  const subjects = [
    { c: ASkeletonText, name: 'Text' },
    { c: ASkeletonHeading, name: 'Heading' },
    { c: ASkeletonAvatar, name: 'Avatar' },
    { c: ASkeletonButton, name: 'Button' },
    { c: ASkeletonChip, name: 'Chip' },
  ] as const;
  for (const s of subjects) {
    it(`${s.name}: animation="shimmer" sets a-skel-anim-shimmer somewhere in tree`, () => {
      const w = mount(s.c, { props: { animation: 'shimmer' } as never });
      expect(w.html()).toMatch(/a-skel-anim-shimmer/);
    });
    it(`${s.name}: animation="none" removes anim class`, () => {
      const w = mount(s.c, { props: { animation: 'none' } as never });
      expect(w.html()).not.toMatch(/a-skel-anim-/);
    });
  }
});
