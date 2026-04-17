export interface TocLink {
  id: string;
  depth: number;
  text: string;
  children?: TocLink[];
}

export const useDocToc = () => useState<TocLink[] | null>('doc-toc', () => null);
export const useMobileNavOpen = () => useState<boolean>('mobile-nav-open', () => false);
