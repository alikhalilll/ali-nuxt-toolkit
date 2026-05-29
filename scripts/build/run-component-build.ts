/**
 * run-component-build.ts (shared)
 *
 * The build pipeline for an `@alikhalilll/a-*` component package, run from the
 * package dir (`tsx ../../../scripts/build/run-component-build.ts`). Kept in one
 * place instead of duplicating the step sequence across every package.json.
 *
 * Why each step exists:
 *   - tsdown            — bundle `.`/`./nuxt`/`./resolver` to ESM+CJS (no dts; tsdown's
 *                         vue dts emission is broken here, so vue-tsc handles dts).
 *   - vue-tsc           — emit the per-source `.d.ts` (+ `.d.ts.map`) tree straight into
 *                         `dist/` — flat, no `runtime/` mirror. `dist/index.d.ts` is the
 *                         real entry the exports map points at (no re-export stub).
 *   - fix-dts-imports   — append `.js` / map `.vue` → `.vue.js` in emitted dts so
 *                         declarations resolve (with go-to-def) under TS/Volar.
 *   - strip-vls-wrapper — drop `__VLS_WithSlots` (a vue-tsc artefact that breaks
 *                         `InstanceType` + go-to-definition), preserving source maps.
 *   - emit-entry-dcts   — copy the entry `.d.ts` → `.d.cts` for the `require` condition.
 *   - tailwindcss + merge-sfc-styles — compile this component's utilities into
 *                         `dist/styles.css` and append its bundled SFC styles.
 *   - gen-web-types     — emit `web-types.json` for JetBrains IDEs.
 *   - verify-exports    — gate: every exports path exists, dts non-empty, no __VLS leak.
 *   - verify-go-to-def  — gate: every public export resolves to a navigable declaration
 *                         and no emitted specifier ends in a literal `.d.ts` (which
 *                         would break Volar's "go to definition").
 *
 * `.d.ts.map` sources point at the package-root source (shipped via `files`), so
 * go-to-definition lands on the real `.vue`/`.ts` — no copied sources in dist.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const here = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const step = (s: string) => ['tsx', path.join(here, s)];

const steps: string[][] = [
  ['rimraf', 'dist', 'web-types.json'],
  ['tsdown'],
  ['vue-tsc', '-p', 'tsconfig.dist.json'],
  step('fix-dts-imports.ts'),
  step('strip-vls-wrapper.ts'),
  step('emit-entry-dcts.ts'),
  ['tailwindcss', '-i', 'styles.src.css', '-o', 'dist/styles.css', '--minify'],
  step('merge-sfc-styles.ts'),
  step('gen-web-types.ts'),
  step('verify-exports.ts'),
  step('verify-go-to-def.ts'),
];

for (const [bin, ...args] of steps) {
  console.log(`\n▶ ${bin} ${args.join(' ')}`);
  await execa(bin, args, { cwd, stdio: 'inherit', preferLocal: true });
}
