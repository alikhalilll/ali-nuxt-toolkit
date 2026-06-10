import type { FaviconResult, SetFaviconOptions } from './types';
import { setFavicon } from './set-favicon';

export class FaviconController {
  private current: string | null = null;
  private readonly options: SetFaviconOptions;

  constructor(options: SetFaviconOptions = {}) {
    this.options = options;
  }

  get value(): string | null {
    return this.current;
  }

  set(emoji: string): FaviconResult {
    const result = setFavicon(emoji, this.options);
    if (result.ok) this.current = emoji;
    return result;
  }

  clear(): void {
    this.current = null;
    if (typeof document === 'undefined') return;
    document.querySelectorAll('link[rel="icon"]').forEach((el) => el.remove());
  }
}
