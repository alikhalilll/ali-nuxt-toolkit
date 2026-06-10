export type FaviconReason = 'no_dom' | 'invalid_emoji' | 'canvas_unsupported';

export interface FaviconResult {
  ok: boolean;
  reason?: FaviconReason;
}

export interface SetFaviconOptions {
  size?: number;
  background?: string;
}
