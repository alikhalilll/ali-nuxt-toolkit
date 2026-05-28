/**
 * verify-exports.ts
 *
 * Lightweight gate that proves the published `exports` map is consumer-clean:
 *   1. Every subpath listed in package.json's `exports` resolves to files
 *      that actually exist on disk (no broken `./dist/foo.d.ts` references).
 *   2. Every `.d.ts` reachable through `exports` is non-empty and contains
 *      at least one `export` keyword.
 *   3. The emitted `.d.ts` files are free of `__VLS_WithSlots` (re-asserts
 *      the strip-vls-wrapper.ts gate after a build).
 *
 * Run after `pnpm build`. Designed to be cheap (no `tsc` invocation) so it
 * can sit in `prepack` without adding seconds.
 *
 * NOTE: this is NOT a full replacement for `attw`. When @arethetypeswrong/cli
 * is unblocked in this env we should add it as an additional gate. For now,
 * this catches the regressions that matter most for downstream Volar.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function collectFilePaths(exportsObj, acc = []) {
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

async function main() {
  const pkg = JSON.parse(await fs.readFile(path.join(pkgRoot, 'package.json'), 'utf8'));
  if (!pkg.exports) throw new Error('verify-exports: package.json has no `exports` field');

  // 1. Resolve every file referenced by exports.
  const referenced = [...new Set(collectFilePaths(pkg.exports))];
  const missing = [];
  for (const rel of referenced) {
    const abs = path.join(pkgRoot, rel);
    if (!(await exists(abs))) missing.push(rel);
  }
  if (missing.length) {
    throw new Error(
      `verify-exports: exports map references files that do not exist:\n  - ${missing.join('\n  - ')}`
    );
  }

  // 2. Every reachable .d.ts is non-empty and has at least one export.
  const dtsRefs = referenced.filter((p) => p.endsWith('.d.ts') || p.endsWith('.d.cts'));
  const empty = [];
  const noExport = [];
  for (const rel of dtsRefs) {
    const content = await fs.readFile(path.join(pkgRoot, rel), 'utf8');
    if (content.trim().length === 0) empty.push(rel);
    else if (!/\bexport\b/.test(content)) noExport.push(rel);
  }
  if (empty.length) {
    throw new Error(`verify-exports: empty .d.ts:\n  - ${empty.join('\n  - ')}`);
  }
  if (noExport.length) {
    throw new Error(
      `verify-exports: .d.ts files have no \`export\` keyword:\n  - ${noExport.join('\n  - ')}`
    );
  }

  // 3. No leftover __VLS_WithSlots anywhere under dist/.
  const distDir = path.join(pkgRoot, 'dist');
  const leaked = [];
  async function walk(dir) {
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
        if (content.includes('__VLS_WithSlots')) {
          leaked.push(path.relative(pkgRoot, full));
        }
      }
    }
  }
  await walk(distDir);
  if (leaked.length) {
    throw new Error(
      `verify-exports: __VLS_WithSlots leaked into:\n  - ${leaked.join('\n  - ')}\n` +
        `strip-vls-wrapper.mjs may need updating.`
    );
  }

  console.log(
    `verify-exports: ok — ${referenced.length} files referenced by exports, ` +
      `${dtsRefs.length} .d.ts validated, 0 __VLS_WithSlots leaks.`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
