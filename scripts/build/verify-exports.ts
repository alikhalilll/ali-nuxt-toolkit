/**
 * verify-exports.ts (shared, package-aware)
 *
 * Run from a package directory, after `pnpm build`. Cheap gate proving the
 * published `exports` map is consumer-clean:
 *   1. Every file referenced by `exports` exists on disk.
 *   2. Every reachable `.d.ts`/`.d.cts` is non-empty and has an `export`.
 *   3. No `__VLS_WithSlots` leaked into any emitted declaration under dist/.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const pkgRoot = process.cwd();

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function collectFilePaths(exportsObj: unknown, acc: string[] = []): string[] {
  if (typeof exportsObj === 'string') {
    if (exportsObj.startsWith('./')) acc.push(exportsObj);
    return acc;
  }
  if (Array.isArray(exportsObj)) {
    for (const item of exportsObj) collectFilePaths(item, acc);
    return acc;
  }
  if (exportsObj && typeof exportsObj === 'object') {
    for (const value of Object.values(exportsObj)) collectFilePaths(value, acc);
  }
  return acc;
}

async function main(): Promise<void> {
  const pkg = JSON.parse(await fs.readFile(path.join(pkgRoot, 'package.json'), 'utf8'));
  if (!pkg.exports) throw new Error('verify-exports: package.json has no `exports` field');

  const referenced = [...new Set(collectFilePaths(pkg.exports))];
  const missing: string[] = [];
  for (const rel of referenced) {
    if (!(await exists(path.join(pkgRoot, rel)))) missing.push(rel);
  }
  if (missing.length) {
    throw new Error(
      `verify-exports: exports map references files that do not exist:\n  - ${missing.join('\n  - ')}`
    );
  }

  const dtsRefs = referenced.filter((p) => p.endsWith('.d.ts') || p.endsWith('.d.cts'));
  const empty: string[] = [];
  const noExport: string[] = [];
  for (const rel of dtsRefs) {
    const content = await fs.readFile(path.join(pkgRoot, rel), 'utf8');
    if (content.trim().length === 0) empty.push(rel);
    else if (!/\bexport\b/.test(content)) noExport.push(rel);
  }
  if (empty.length) throw new Error(`verify-exports: empty .d.ts:\n  - ${empty.join('\n  - ')}`);
  if (noExport.length) {
    throw new Error(
      `verify-exports: .d.ts files have no \`export\` keyword:\n  - ${noExport.join('\n  - ')}`
    );
  }

  const distDir = path.join(pkgRoot, 'dist');
  const leaked: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && /\.d\.c?ts$/.test(full)) {
        const content = await fs.readFile(full, 'utf8');
        if (content.includes('__VLS_WithSlots')) leaked.push(path.relative(pkgRoot, full));
      }
    }
  }
  await walk(distDir);
  if (leaked.length) {
    throw new Error(`verify-exports: __VLS_WithSlots leaked into:\n  - ${leaked.join('\n  - ')}`);
  }

  console.log(
    `verify-exports: ok — ${referenced.length} files referenced by exports, ${dtsRefs.length} .d.ts validated, 0 __VLS_WithSlots leaks.`
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
