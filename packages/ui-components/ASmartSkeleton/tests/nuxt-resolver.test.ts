import { describe, expect, it } from 'vitest';
import ASmartSkeletonResolver from '../src/resolver';
import nuxtModule from '../src/nuxt';

type ResolverInstance = { resolve: (name: string) => { name: string; from: string } | undefined };

describe('ASmartSkeletonResolver', () => {
  it('resolves ASmartSkeleton components', () => {
    const resolver = ASmartSkeletonResolver() as unknown as ResolverInstance;
    const res = resolver.resolve('ASmartSkeleton');
    expect(res).toEqual({
      name: 'ASmartSkeleton',
      from: '@alikhalilll/a-smart-skeleton',
    });
  });

  it('resolves ASmartSkeletonBox components', () => {
    const resolver = ASmartSkeletonResolver() as unknown as ResolverInstance;
    const res = resolver.resolve('ASmartSkeletonBox');
    expect(res).toEqual({
      name: 'ASmartSkeletonBox',
      from: '@alikhalilll/a-smart-skeleton',
    });
  });

  it('supports prefix option', () => {
    const resolver = ASmartSkeletonResolver({ prefix: 'Custom' }) as unknown as ResolverInstance;
    const res = resolver.resolve('CustomASmartSkeleton');
    expect(res).toEqual({
      name: 'ASmartSkeleton',
      from: '@alikhalilll/a-smart-skeleton',
    });
  });

  it('returns undefined for unrelated components', () => {
    const resolver = ASmartSkeletonResolver() as unknown as ResolverInstance;
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
    expect(meta?.name).toBe('@alikhalilll/a-smart-skeleton');
    expect(meta?.configKey).toBe('aSmartSkeleton');
  });
});
