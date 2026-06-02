import { createHighlighter, type Highlighter } from 'shiki';

/**
 * Shared client-side Shiki highlighter for interactive demos.
 *
 * Mirrors the Nuxt Content config in `nuxt.config.ts` (same themes + langs) so
 * the rendered `DemoTabs` "Code" pane is visually identical to prose code blocks
 * coming out of the Markdown pipeline. Theme switching is driven by the `.dark`
 * class on `<html>` — Shiki's CSS-variable mode emits `--shiki-light` and
 * `--shiki-dark` per token, and the `html .dark .shiki span { color: var(--shiki-dark) }`
 * rule injected by Nuxt Content recolours every token in a single repaint.
 */

let highlighter: Highlighter | null = null;
let pending: Promise<Highlighter> | null = null;

export async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  if (!pending) {
    pending = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['ts', 'js', 'vue', 'bash', 'json', 'html', 'css'],
    }).then((h) => {
      highlighter = h;
      return h;
    });
  }
  return pending;
}

export async function highlight(code: string, lang: string): Promise<string> {
  const h = await getHighlighter();
  const loaded = h.getLoadedLanguages();
  const safeLang = (loaded as readonly string[]).includes(lang) ? lang : 'plaintext';
  return h.codeToHtml(code, {
    lang: safeLang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  });
}
