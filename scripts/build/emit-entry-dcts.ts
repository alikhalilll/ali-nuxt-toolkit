/**
 * emit-entry-dcts.ts (shared, package-aware, generic)
 *
 * Run from a package directory, after vue-tsc emits the declaration tree into
 * `dist/` and after dts post-processing. For every `exports` subpath that has
 * both an `import.types` (`.d.ts`) and a `require.types` (`.d.cts`), copy the
 * emitted `.d.ts` → `.d.cts` so CJS consumers get types too. Fully driven by the
 * package's own exports map — no hardcoded entry list.
 *
 * The CJS copy drops the `sourceMappingURL` (go-to-definition of a re-exported
 * symbol follows the re-export to the original declaration's own map; a `.d.cts`
 * referencing a `.d.ts.map` would be wrong).
 */

import fs from 'node:fs';
import path from 'node:path';

const pkgRoot = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

/** Every (importTypes .d.ts → requireTypes .d.cts) pair declared in the exports map. */
function dtsPairs(): Array<{ dts: string; dcts: string }> {
  const pairs: Array<{ dts: string; dcts: string }> = [];
  for (const cond of Object.values(pkg.exports ?? {})) {
    if (!cond || typeof cond !== 'object') continue;
    const c = cond as { import?: { types?: string }; require?: { types?: string } };
    const dts = c.import?.types;
    const dcts = c.require?.types;
    if (dts?.endsWith('.d.ts') && dcts?.endsWith('.d.cts')) pairs.push({ dts, dcts });
  }
  return pairs;
}

let written = 0;
for (const { dts, dcts } of dtsPairs()) {
  const src = path.resolve(pkgRoot, dts);
  if (!fs.existsSync(src)) continue;
  const body = fs
    .readFileSync(src, 'utf8')
    .replace(/\n?\/\/# sourceMappingURL=.*\.d\.ts\.map\s*$/, '\n');
  fs.writeFileSync(path.resolve(pkgRoot, dcts), body);
  written++;
}

console.log(`emit-entry-dcts: wrote ${written} CJS declaration file(s) (.d.cts).`);
