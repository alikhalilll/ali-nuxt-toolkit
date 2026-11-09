#!/usr/bin/env node
/**
 * Generate PNG assets from the master SVG seals.
 *
 * Inputs:
 *   public/logos/seal-*.svg  — pure-path, currentColor
 *
 * Outputs:
 *   public/logos/png/seal-*-{light,dark}.png  — 256px fixed-colour PNGs for READMEs
 *   public/favicon.ico                         — 32×32 PNG renamed (browsers accept this)
 *   public/favicon.svg                         — brand seal, used as the SVG favicon
 *   public/apple-touch-icon.png                — 180×180 dark background + seal
 *   public/og-image.png                        — 1200×630 social preview
 *
 * The master SVGs use `currentColor` so we wrap them with explicit stroke/fill
 * before rasterising — one wrapper for light, one for dark.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const logosDir = resolve(root, 'public/logos');
const pngDir = resolve(logosDir, 'png');
const publicDir = resolve(root, 'public');

const SEALS = [
  'brand',
  'skel',
  'tel',
  'tel-v2',
  'tel-v3',
  'tel-v4',
  'tel-v5',
  'api',
  'crypto',
  'mid',
];

/** Wrap a master SVG so `currentColor` resolves to the given colour. */
function withColor(svgText, color) {
  // sharp's renderer resolves `currentColor` via the root `color` property.
  return svgText.replace('<svg ', `<svg color="${color}" `);
}

/** Render one SVG string to a PNG buffer at the given size. */
async function rasterise(svgText, size) {
  return sharp(Buffer.from(svgText), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(pngDir, { recursive: true });

  // Per-seal: generate a light + dark PNG at 256px for README use.
  for (const name of SEALS) {
    const src = await readFile(resolve(logosDir, `seal-${name}.svg`), 'utf8');

    const darkBuf = await rasterise(withColor(src, '#f5f5f5'), 256);
    await writeFile(resolve(pngDir, `seal-${name}-dark.png`), darkBuf);

    const lightBuf = await rasterise(withColor(src, '#0a0a0a'), 256);
    await writeFile(resolve(pngDir, `seal-${name}-light.png`), lightBuf);

    console.log(`✔  seal-${name}  (light + dark PNG @ 256)`);
  }

  // Favicons.
  const brandSrc = await readFile(resolve(logosDir, 'seal-brand.svg'), 'utf8');

  // SVG favicon (dark-theme first: light stroke)
  await writeFile(resolve(publicDir, 'favicon.svg'), withColor(brandSrc, '#60a5fa'));
  console.log('✔  favicon.svg');

  // 32×32 PNG favicon. Browsers accept PNG renamed as .ico for the favicon slot.
  const fav32 = await rasterise(withColor(brandSrc, '#60a5fa'), 32);
  await writeFile(resolve(publicDir, 'favicon.ico'), fav32);
  await writeFile(resolve(publicDir, 'favicon-32x32.png'), fav32);
  console.log('✔  favicon.ico + favicon-32x32.png');

  // Apple touch icon — 180×180, brand on a dark rounded surface.
  const touchComposite = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    },
  })
    .composite([
      {
        input: await rasterise(withColor(brandSrc, '#60a5fa'), 128),
        gravity: 'center',
      },
    ])
    .png()
    .toBuffer();
  await writeFile(resolve(publicDir, 'apple-touch-icon.png'), touchComposite);
  console.log('✔  apple-touch-icon.png (180×180)');

  // OG image — 1200×630 dark surface with centred brand seal + tagline block.
  // We rasterise the brand seal at 240 then composite it onto a dark background.
  const ogSeal = await rasterise(withColor(brandSrc, '#60a5fa'), 240);

  // Build the OG image as a composite SVG so we can include the title text.
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0a0a0a"/>
    <text x="600" y="430" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="700" fill="#f5f5f5" letter-spacing="-0.02em">ali-nuxt-toolkit</text>
    <text x="600" y="490" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="400" fill="#a8a8a8">Five focused packages for Nuxt 3 / 4 and Vue 3</text>
    <text x="600" y="560" text-anchor="middle" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="22" fill="#60a5fa">@alikhalilll/*</text>
  </svg>`;

  const ogBg = await sharp(Buffer.from(ogSvg)).png().toBuffer();
  const ogImage = await sharp(ogBg)
    .composite([
      {
        input: ogSeal,
        top: 90,
        left: (1200 - 240) / 2,
      },
    ])
    .png()
    .toBuffer();
  await writeFile(resolve(publicDir, 'og-image.png'), ogImage);
  console.log('✔  og-image.png (1200×630)');

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
