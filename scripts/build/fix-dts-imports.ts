/**
 * fix-dts-imports.ts (shared, package-aware)
 *
 * Run from a package directory. Rewrites import/export specifiers in every
 * `.d.ts` under `dist/` so the published declarations resolve in consumers
 * (including `node16`/`nodenext` moduleResolution):
 *   1. Bare relative refs without extension (`'./foo'`) → append `.js`.
 *   2. `.vue` extension → `.vue.js` — TS/Volar resolve this to the companion
 *      `.vue.d.ts` exactly like a normal `.js` → `.d.ts` import, so go-to-definition
 *      works. (A literal `.vue.d.ts` specifier resolves the type but yields no
 *      navigable declaration in Volar — "Cannot find declaration to go to".)
 *   3. Bare directory refs (`'.'`, `'..'`) → `./index.js` / `../index.js`.
 *   4. Non-relative specifiers (bare package names) → unchanged.
 *
 * Component source uses relative + bare-package imports only (no path aliases),
 * so there's no alias rewriting to do.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const pkgRoot = process.cwd();
const distDir = path.join(pkgRoot, 'dist');

async function isDirectory(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function fixExtension(specifier: string, fileDir: string): Promise<string> {
  if (!specifier.startsWith('.')) return specifier;
  if (specifier === '.') return './index.js';
  if (specifier === '..') return '../index.js';
  if (specifier.endsWith('.d.ts')) return specifier;
  if (specifier.endsWith('.vue')) return `${specifier}.js`;

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

    matches.push({
      match: m[0],
      index: m.index!,
      replacement: fixExtension(original, fileDir).then((fixed) => `${prefix}${fixed}${suffix}`),
    });
  }

  const resolved = await Promise.all(matches.map((m) => m.replacement));
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
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && full.endsWith('.d.ts')) out.push(full);
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
