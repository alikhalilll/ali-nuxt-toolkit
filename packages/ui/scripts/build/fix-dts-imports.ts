/**
 * fix-dts-imports.ts
 *
 * Post-build script that rewrites import/export specifiers inside every `.d.ts`
 * file under `dist/` so the published declarations resolve in a consumer's
 * project, where path aliases and source-style extensions don't apply.
 *
 * Rules applied:
 *   1. Path alias `@/utils` / `@/entries/...` → relative path into the
 *      corresponding `dist/runtime/...` location.
 *   2. Bare relative refs without extension (`'./foo'`) → append `.js`.
 *   3. `.vue` extension → `.vue.d.ts` (the companion declaration `vue-tsc`
 *      emits alongside the copied `.vue` source — see `copy-sources.ts`).
 *   4. Bare directory refs (`'.'`, `'..'`) → `./index.js` / `../index.js`.
 *   5. Non-relative specifiers (bare package names like `'vue'`) → unchanged.
 *
 * Runs against the whole dist tree, including the per-entry top-level
 * `dist/<entry>/index.d.ts` re-exports written by `generate-entry-dts.ts`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const distDir = path.join(pkgRoot, 'dist');
const runtimeDir = path.join(distDir, 'runtime');

/**
 * Convert a `@/<rest>` import specifier to a relative path from `fileDir`
 * to `dist/runtime/<rest>`. Both the `@/utils` and `@/entries/...` aliases
 * share the same root (the workspace's package root), which mirrors directly
 * onto `dist/runtime/`.
 */
function resolveAlias(specifier: string, fileDir: string): string | null {
  const m = specifier.match(/^@\/(.+)$/);
  if (!m) return null;
  const targetAbs = path.join(runtimeDir, m[1]);
  let rel = path.relative(fileDir, targetAbs).split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

async function isDirectory(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Apply the extension fixes from the rules list to a resolved specifier.
 * Mirrors the canonical post-emit transform shipped by `vue-tsc`-style
 * libraries — see the reference repo's `fix-dts-imports.mjs`.
 *
 * Async because directory-vs-file detection requires `fs.stat` to decide
 * between `./entries/input` → `./entries/input.js` (file) or
 * `./entries/input/index.js` (directory). vue-tsc itself blindly appends
 * `.js` even when the source spec resolved to a directory, so we re-resolve
 * here.
 */
async function fixExtension(specifier: string, fileDir: string): Promise<string> {
  if (!specifier.startsWith('.')) return specifier;
  if (specifier === '.') return './index.js';
  if (specifier === '..') return '../index.js';
  if (specifier.endsWith('.d.ts')) return specifier;
  if (specifier.endsWith('.vue')) return `${specifier}.d.ts`;

  // Strip a trailing `.js` so we can re-check directory-vs-file. vue-tsc emits
  // `./entries/input.js` for a `./entries/input` directory ref — wrong shape
  // on disk, where the entry is `./entries/input/index.js`.
  const bare = specifier.replace(/\.js$/, '');
  const abs = path.resolve(fileDir, bare);
  if (await isDirectory(abs)) return `${bare}/index.js`;
  if (specifier.endsWith('.js')) return specifier;
  return `${specifier}.js`;
}

const SPEC_RE = /(from\s+['"])([^'"]+)(['"])|(import\(\s*['"])([^'"]+)(['"]\s*\))/g;

async function transform(content: string, fileDir: string): Promise<string> {
  const matches: Array<{ match: string; index: number; replacement: Promise<string> }> = [];
  for (const m of content.matchAll(SPEC_RE)) {
    const fromSpec = m[2];
    const impSpec = m[5];
    const isFromForm = fromSpec != null;
    const prefix = isFromForm ? m[1] : m[4];
    const original = isFromForm ? fromSpec : impSpec;
    const suffix = isFromForm ? m[3] : m[6];

    const aliased = resolveAlias(original, fileDir);
    matches.push({
      match: m[0],
      index: m.index!,
      replacement: fixExtension(aliased ?? original, fileDir).then(
        (fixed) => `${prefix}${fixed}${suffix}`
      ),
    });
  }

  const resolved = await Promise.all(matches.map((m) => m.replacement));
  // Apply from the back so earlier indices stay valid.
  let out = content;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    out = out.slice(0, m.index) + resolved[i] + out.slice(m.index + m.match.length);
  }
  return out;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && full.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const files = await walk(distDir);
  let changed = 0;
  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    const fixed = await transform(original, path.dirname(file));
    if (fixed !== original) {
      await fs.writeFile(file, fixed, 'utf8');
      changed++;
    }
  }
  console.log(
    `fix-dts-imports: rewrote specifiers in ${changed} of ${files.length} .d.ts file(s).`
  );
}

main().catch((err: unknown) => {
  console.error(
    'fix-dts-imports failed:',
    err instanceof Error ? (err.stack ?? err.message) : String(err)
  );
  process.exit(1);
});
