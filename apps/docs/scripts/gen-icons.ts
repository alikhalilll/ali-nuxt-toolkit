/**
 * Generate PNG icons from public/favicon.svg.
 *
 *   apple-touch-icon.png   180×180   (iOS home-screen)
 *   favicon-32.png          32×32    (browser tab fallback for old browsers)
 *   og-image.png          1200×630   (Open Graph / Twitter card)
 *
 * Re-run whenever the brand SVG changes:
 *
 *   node apps/docs/scripts/gen-icons.mjs
 *
 * Requires Playwright + chromium. Reuses the install from
 * `social-media/tell-input/slides/node_modules/playwright`, which the slidev
 * carousel already pulls in — no extra dependency needed.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');
const svg = (await readFile(join(publicDir, 'favicon.svg'), 'utf8')).trim();

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();

/**
 * Render an HTML snippet at exact pixel dimensions, screenshot the body.
 * Returns the PNG bytes.
 */
async function snap({ width, height, html }) {
  await page.setViewportSize({ width, height });
  const doc = `<!doctype html><html><head><style>
    html, body { margin: 0; padding: 0; background: transparent; }
    body { width: ${width}px; height: ${height}px; overflow: hidden; }
  </style></head><body>${html}</body></html>`;
  await page.setContent(doc, { waitUntil: 'networkidle' });
  // Wait for fonts so the OG-image text isn't a fallback face.
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  return page.screenshot({ omitBackground: true, type: 'png' });
}

// ---------- Square icons (favicon SVG, centered on a square canvas) ----------
function squareIconHtml(sizePx) {
  return `<div style="width:${sizePx}px;height:${sizePx}px;display:flex;align-items:center;justify-content:center;">
    <div style="width:${sizePx}px;height:${sizePx}px;">${svg.replace('<svg ', `<svg width="${sizePx}" height="${sizePx}" `)}</div>
  </div>`;
}

const favicon32 = await snap({ width: 32, height: 32, html: squareIconHtml(32) });
await writeFile(join(publicDir, 'favicon-32.png'), favicon32);
console.log('✓ favicon-32.png  (32×32)');

const appleIcon = await snap({ width: 180, height: 180, html: squareIconHtml(180) });
await writeFile(join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('✓ apple-touch-icon.png  (180×180)');

// ---------- OG image (1200×630, brand mark + wordmark + tagline + dark bg) ----------
const ogHtml = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap');
  * { box-sizing: border-box; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  .og {
    position: relative;
    width: 1200px;
    height: 630px;
    background:
      radial-gradient(60% 50% at 18% 20%, rgba(96,165,250,0.22), transparent 65%),
      radial-gradient(50% 45% at 90% 80%, rgba(167,139,250,0.22), transparent 65%),
      linear-gradient(135deg, #06080e 0%, #0a0e16 50%, #06080e 100%);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 90px;
    color: #f5f7fb;
  }
  /* Faint dot grid overlay */
  .og::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse at center, black, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at center, black, transparent 75%);
    pointer-events: none;
  }
  .row {
    display: flex; align-items: center; gap: 32px;
    position: relative; z-index: 1;
    margin-bottom: 36px;
  }
  .mark {
    width: 120px; height: 120px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 24px;
    background: rgba(96,165,250,0.10);
  }
  .mark svg { width: 96px; height: 96px; }
  .word { font-size: 44px; font-weight: 700; letter-spacing: -0.02em; }
  .word .scope { color: #a4adc1; font-weight: 500; }
  .word .sep { color: #60a5fa; margin: 0 2px; }
  .title {
    position: relative; z-index: 1;
    font-size: 88px; font-weight: 700; line-height: 1.04; letter-spacing: -0.035em;
    margin: 0;
    max-width: 980px;
  }
  .title .accent {
    background: linear-gradient(90deg, #60a5fa 0%, #22d3ee 55%, #a78bfa 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .tag {
    position: relative; z-index: 1;
    margin: 28px 0 0;
    font-size: 30px;
    color: #c2cad9;
    font-weight: 500;
    max-width: 900px;
    line-height: 1.4;
  }
  .chips {
    position: relative; z-index: 1;
    display: flex; flex-wrap: wrap; gap: 12px;
    margin-top: 42px;
  }
  .chip {
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 18px;
    color: #c2cad9;
  }
</style>
<div class="og">
  <div class="row">
    <div class="mark">${svg.replace('<svg ', '<svg width="96" height="96" ')}</div>
    <div class="word"><span class="scope">ali-nuxt</span><span class="sep">/</span><span>toolkit</span></div>
  </div>
  <h1 class="title">The strongly-typed <span class="accent">Nuxt toolkit.</span></h1>
  <p class="tag">Four production-grade modules with a framework-agnostic core. Independently installable.</p>
  <div class="chips">
    <span class="chip">api-provider</span>
    <span class="chip">crypto</span>
    <span class="chip">auto-middleware</span>
    <span class="chip">ui</span>
  </div>
</div>
`;
const og = await snap({ width: 1200, height: 630, html: ogHtml });
await writeFile(join(publicDir, 'og-image.png'), og);
console.log('✓ og-image.png  (1200×630)');

await browser.close();
console.log('\nAll three icons written to apps/docs/public.');
