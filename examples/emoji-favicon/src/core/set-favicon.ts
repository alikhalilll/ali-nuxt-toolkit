import type { FaviconResult, SetFaviconOptions } from './types';

const EMOJI_RE = /\p{Extended_Pictographic}/u;

export function isEmoji(value: string): boolean {
  return typeof value === 'string' && EMOJI_RE.test(value);
}

export function renderEmojiToDataUrl(
  emoji: string,
  options: SetFaviconOptions = {},
): string | null {
  if (typeof document === 'undefined') return null;
  const size = options.size ?? 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.font = `${Math.round(size * 0.8)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2);

  return canvas.toDataURL('image/png');
}

export function setFavicon(emoji: string, options: SetFaviconOptions = {}): FaviconResult {
  if (typeof document === 'undefined') return { ok: false, reason: 'no_dom' };
  if (!isEmoji(emoji)) return { ok: false, reason: 'invalid_emoji' };

  const dataUrl = renderEmojiToDataUrl(emoji, options);
  if (!dataUrl) return { ok: false, reason: 'canvas_unsupported' };

  const link =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
    Object.assign(document.createElement('link'), { rel: 'icon' });
  link.href = dataUrl;
  if (!link.isConnected) document.head.append(link);

  return { ok: true };
}
