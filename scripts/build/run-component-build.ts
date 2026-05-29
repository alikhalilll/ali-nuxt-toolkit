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
 *   - vue-tsc           — emit per-source `.d.ts` (+ `.d.ts.map`) into `dist/runtime/`.
 *   - fix-dts-imports   — append `.js` / map `.vue` → `.vue.d.ts` in emitted dts so
 *                         declarations resolve under `node16`/`nodenext` consumers.
 *   - generate-entry-dts — write the `dist/{,nuxt/,resolver/}index.d.ts(+.d.cts)` stubs
 *                         the exports map points at (re-export from the runtime mirror).
 *   - strip-vls-wrapper — drop `__VLS_WithSlots` (a vue-tsc artefact that breaks
 *                         `InstanceType` + go-to-definition), preserving source maps.
 *   - tailwindcss + merge-sfc-styles — compile this component's utilities into
 *                         `dist/styles.css` and append its bundled SFC styles.
 *   - gen-web-types     — emit `web-types.json` for JetBrains IDEs.
 *   - verify-exports    — gate: every exports path exists, dts non-empty, no __VLS leak.
 *
 * `.d.ts.map` sources point at the package-root source (shipped via `files`), so
 * go-to-definition lands on the real `.vue`/`.ts` — no need to copy sources into dist.
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
  step('generate-entry-dts.ts'),
  step('strip-vls-wrapper.ts'),
  ['tailwindcss', '-i', 'styles.src.css', '-o', 'dist/styles.css', '--minify'],
  step('merge-sfc-styles.ts'),
  step('gen-web-types.ts'),
  step('verify-exports.ts'),
];

for (const [bin, ...args] of steps) {
  console.log(`\n▶ ${bin} ${args.join(' ')}`);
  await execa(bin, args, { cwd, stdio: 'inherit', preferLocal: true });
}
