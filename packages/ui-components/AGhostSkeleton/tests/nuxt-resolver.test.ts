import { describe, expect, it } from 'vitest';
import AGhostSkeletonResolver from '../src/resolver';
import nuxtModule from '../src/nuxt';

type ResolverInstance = { resolve: (name: string) => { name: string; from: string } | undefined };

describe('AGhostSkeletonResolver', () => {
  it('resolves AGhostSkeleton components', () => {
    const resolver = AGhostSkeletonResolver() as unknown as ResolverInstance;
    const res = resolver.resolve('AGhostSkeleton');
    expect(res).toEqual({
      name: 'AGhostSkeleton',
      from: '@alikhalilll/a-ghost-skeleton',
    });
  });

  it('resolves AGhostSkeletonBox components', () => {
    const resolver = AGhostSkeletonResolver() as unknown as ResolverInstance;
    const res = resolver.resolve('AGhostSkeletonBox');
    expect(res).toEqual({
      name: 'AGhostSkeletonBox',
      from: '@alikhalilll/a-ghost-skeleton',
    });
  });

  it('supports prefix option', () => {
    const resolver = AGhostSkeletonResolver({ prefix: 'Custom' }) as unknown as ResolverInstance;
    const res = resolver.resolve('CustomAGhostSkeleton');
    expect(res).toEqual({
      name: 'AGhostSkeleton',
      from: '@alikhalilll/a-ghost-skeleton',
    });
  });

  it('returns undefined for unrelated components', () => {
    const resolver = AGhostSkeletonResolver() as unknown as ResolverInstance;
    const res = resolver.resolve('UnknownComponent');
    expect(res).toBeUndefined();
  });
});

type NuxtModuleLike = {
  getMeta?: () => Promise<{ name: string; configKey: string }>;
  meta?: { name: string; configKey: string };
};

describe('nuxtModule', () => {
  it('has valid metadata', async () => {
    const mod = nuxtModule as unknown as NuxtModuleLike;
    const meta = typeof mod.getMeta === 'function' ? await mod.getMeta() : mod.meta;
    expect(meta?.name).toBe('@alikhalilll/a-ghost-skeleton');
    expect(meta?.configKey).toBe('aGhostSkeleton');
  });
});
