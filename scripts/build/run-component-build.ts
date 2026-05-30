/**
 * run-component-build.ts (shared)
 *
 * The build pipeline for an `@alikhalilll/a-*` component package, run from the
 * package dir (`tsx ../../../scripts/build/run-component-build.ts`). Kept in one
 * place instead of duplicating the step sequence across every package.json.
 *
 * Why each step exists:
 *   - tsdown            — bundle every entry from the package's `exports` map to
 *                         ESM+CJS AND emit a single rolled-up `.d.ts` (+ `.d.cts`)
 *                         per entry via `dts: { vue: true }` (rolldown-plugin-dts
 *                         + vue-tsc). Components inline as `DefineComponent`; no
 *                         `.vue` token survives in any specifier.
 *   - strip-vls-wrapper — remove the `__VLS_WithSlots` artefact `@vue/language-tools`
 *                         bakes around SFC defaults that call `defineSlots()` —
 *                         its `T & { new (): { $slots: S } }` intersection breaks
 *                         `InstanceType<typeof Comp>` in consumers.
 *   - tailwindcss + merge-sfc-styles — compile this component's utilities into
 *                         `dist/styles.css` and append its bundled SFC styles.
 *   - gen-web-types     — emit `web-types.json` for JetBrains IDEs.
 *   - verify-exports / verify-go-to-def — gates: every exports path resolves to a
 *                         navigable declaration; no Volar-hostile specifier shapes
 *                         (`.d.ts` suffix, `.vue` token) leak into dist.
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
  step('strip-vls-wrapper.ts'),
  ['tailwindcss', '-i', 'styles.src.css', '-o', 'dist/styles.css', '--minify'],
  step('merge-sfc-styles.ts'),
  step('verify-css-bundle.ts'),
  step('gen-web-types.ts'),
  step('verify-exports.ts'),
  step('verify-go-to-def.ts'),
];

for (const [bin, ...args] of steps) {
  console.log(`\n▶ ${bin} ${args.join(' ')}`);
  await execa(bin, args, { cwd, stdio: 'inherit', preferLocal: true });
}
