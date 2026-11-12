#!/usr/bin/env node
/**
 * Mirror `content/**.md` into `public/` so each doc page also resolves at a
 * `<route>.md` URL.
 *
 * Why we need this at all: the docs site is statically generated under the
 * `github-pages` Nitro preset. The "View as Markdown" / "Copy Markdown link"
 * actions on every page point at `<route>.md`, and on a static host that
 * means a physical file has to exist in `dist/` at that path. The simplest
 * way to make that happen is to mirror the markdown sources into `public/`
 * before each `nuxt dev` / `nuxt build` / `nuxt generate` run — Nuxt then
 * carries `public/` straight through to `dist/`.
 *
 * Two other approaches were considered and rejected:
 *
 *   1. A Nitro server route at `server/routes/[...slug].md.get.ts` that
 *      reads from `content/` on demand. Works, but every doc route then
 *      has to be listed twice in `nitro.prerender.routes` (`/api-provider`
 *      and `/api-provider.md`), and the list has to stay in sync with
 *      every new content file. The mirror script auto-discovers content
 *      instead.
 *
 *   2. `nitro.publicAssets: [{ baseURL: '/', dir: 'content' }]`. Almost
 *      free, but doesn't rename `content/ui/index.md` to `/ui.md` — it'd
 *      land at `/ui/index.md`, which breaks parity with the HTML route
 *      (`/ui`). Renaming `index.md` files is the entire reason this lives
 *      in code rather than as a Nitro mount.
 *
 * Path mapping (matches the canonical paths `pages/[...slug].vue` computes):
 *
 *   content/index.md          → public/index.md
 *   content/api-provider.md   → public/api-provider.md
 *   content/ui/index.md       → public/ui.md
 *   content/ui/tel-input.md   → public/ui/tel-input.md
 *
 * Run manually with `node ./scripts/mirror-content.mjs` from `apps/docs/`,
 * or rely on the `predev` / `prebuild` / `pregenerate` package scripts which
 * pnpm fires automatically before the matching command.
 */
import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(here, '..', 'content');
const PUBLIC_DIR = join(here, '..', 'public');
// Repo root is three levels up from apps/docs/scripts/ — llms.txt / llms-full.txt
// live there so GitHub serves them as the canonical copy, and we mirror them into
// public/ so they're also served at the docs site URL.
const REPO_ROOT = join(here, '..', '..', '..');
const ROOT_MIRRORS = ['llms.txt', 'llms-full.txt'];

/**
 * Recursively yield every `.md` file under `dir` (depth-first). Pure
 * generator — no side effects beyond the directory reads.
 */
async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield full;
    }
  }
}

/**
 * Map a content-relative path to its mirrored public-relative path.
 * Pure function — no I/O.
 *
 *   'index.md'         → 'index.md'
 *   'api-provider.md'  → 'api-provider.md'
 *   'ui/index.md'      → 'ui.md'
 *   'ui/tel-input.md'  → 'ui/tel-input.md'
 */
export function routeFor(relPath) {
  const normalised = relPath.split('\\').join('/');
  if (basename(normalised) !== 'index.md') return normalised;
  const parent = dirname(normalised);
  return parent === '.' ? 'index.md' : `${parent}.md`;
}

async function mirrorRootFile(name) {
  const source = join(REPO_ROOT, name);
  try {
    await stat(source);
  } catch {
    console.warn(`[mirror-content] ${name} not found at ${source} — skipping.`);
    return false;
  }
  const dest = join(PUBLIC_DIR, name);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(source, dest);
  console.log(`[mirror-content] ${name} → public/${name}`);
  return true;
}

async function mirror() {
  let mirrored = 0;
  try {
    await stat(CONTENT_DIR);
  } catch {
    console.warn(`[mirror-content] content/ not found at ${CONTENT_DIR} — nothing to mirror.`);
    return;
  }

  for await (const sourceFile of walk(CONTENT_DIR)) {
    const rel = relative(CONTENT_DIR, sourceFile);
    const outRel = routeFor(rel);
    const outFile = join(PUBLIC_DIR, outRel);
    await mkdir(dirname(outFile), { recursive: true });
    await copyFile(sourceFile, outFile);
    console.log(`[mirror-content] ${rel} → public/${outRel}`);
    mirrored += 1;
  }

  for (const name of ROOT_MIRRORS) {
    if (await mirrorRootFile(name)) mirrored += 1;
  }

  console.log(`[mirror-content] mirrored ${mirrored} file${mirrored === 1 ? '' : 's'}.`);
}

mirror().catch((err) => {
  console.error('[mirror-content] failed:', err);
  process.exit(1);
});
