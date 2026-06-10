import type { Plugin } from 'vite';

export interface EmojiFaviconPluginOptions {
  emoji?: string;
  size?: number;
  background?: string;
}

const PLACEHOLDER_RE = /<link\s+rel=["']icon["'][^>]*\sdata-emoji[^>]*\/?>/i;

export function emojiFavicon(options: EmojiFaviconPluginOptions = {}): Plugin {
  return {
    name: 'vite-plugin-emoji-favicon',
    transformIndexHtml(html) {
      if (!options.emoji) return html;
      const dataUrl = renderServerSideDataUrl(options.emoji, options);
      if (!dataUrl) return html;
      const replacement = `<link rel="icon" href="${dataUrl}" />`;
      return PLACEHOLDER_RE.test(html)
        ? html.replace(PLACEHOLDER_RE, replacement)
        : html.replace(/<\/head>/i, `${replacement}\n</head>`);
    },
  };
}

// At build time there is no DOM canvas; encode a tiny SVG instead so the
// dev-server / build output ships a real favicon before any client JS runs.
function renderServerSideDataUrl(emoji: string, options: EmojiFaviconPluginOptions): string | null {
  const size = options.size ?? 64;
  const fontSize = Math.round(size * 0.8);
  const bg = options.background ?? 'transparent';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<text x="50%" y="50%" font-size="${fontSize}" text-anchor="middle" ` +
    `dominant-baseline="central" font-family="serif">${escapeXml(emoji)}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[c]!,
  );
}

export default emojiFavicon;
