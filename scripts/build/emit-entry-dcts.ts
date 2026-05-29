/**
 * emit-entry-dcts.ts (shared, package-aware)
 *
 * Run from a package directory, after vue-tsc emits the declaration tree straight
 * into `dist/` (flat — no `runtime/` mirror, no re-export stub) and after the dts
 * post-processing (fix-dts, strip-vls). For each entry the `exports` map exposes
 * under a `require` condition (`.`, `./nuxt`, `./resolver`), copy the emitted
 * `dist/<entry>.d.ts` → `dist/<entry>.d.cts` so CJS consumers get types too.
 *
 * The CJS copy drops the `sourceMappingURL` (go-to-definition of a re-exported
 * symbol follows the re-export to the original declaration's own map; the entry
 * map isn't needed, and a `.d.cts` referencing a `.d.ts.map` would be wrong).
 */

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const ENTRIES = ['index.d.ts', 'nuxt/index.d.ts', 'resolver/index.d.ts'];

let written = 0;
for (const rel of ENTRIES) {
  const dts = path.join(distDir, rel);
  if (!fs.existsSync(dts)) continue;
  const dcts = dts.replace(/\.d\.ts$/, '.d.cts');
  const body = fs
    .readFileSync(dts, 'utf8')
    .replace(/\n?\/\/# sourceMappingURL=.*\.d\.ts\.map\s*$/, '\n');
  fs.writeFileSync(dcts, body);
  written++;
}

console.log(`emit-entry-dcts: wrote ${written} CJS declaration file(s) (.d.cts).`);
