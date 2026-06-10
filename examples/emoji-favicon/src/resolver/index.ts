export interface ResolverResult {
  name: string;
  from: string;
}

const COMPONENT_TO_SOURCE: Record<string, string> = {
  EmojiFavicon: '@yourname/emoji-favicon/vue',
};

export function EmojiFaviconResolver() {
  return {
    type: 'component' as const,
    resolve(name: string): ResolverResult | undefined {
      const from = COMPONENT_TO_SOURCE[name];
      if (from) return { name, from };
    },
  };
}

export default EmojiFaviconResolver;
