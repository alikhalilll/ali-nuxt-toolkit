/**
 * merge-sfc-styles.ts (shared, package-aware)
 *
 * Run from a package directory, after `tailwindcss` produced `dist/styles.css`
 * (tokens-free utility output for this package) AND `tsdown` produced
 * `dist/style.css` (bundled CSS from SFC `<style>` blocks). Concatenates the
 * SFC styles into the single shipped `dist/styles.css` so consumers need only
 * `import '@alikhalilll/a-<name>/styles.css'`. The intermediate `dist/style.css`
 * is removed.
 */

import { existsSync, readFileSync, appendFileSync, unlinkSync } from 'node:fs';

const target = 'dist/styles.css';
const source = 'dist/style.css';

if (!existsSync(source)) {
  console.log('merge-sfc-styles: no dist/style.css — nothing to merge.');
  process.exit(0);
}

if (!existsSync(target)) {
  console.error(`merge-sfc-styles: target ${target} missing — did Tailwind run?`);
  process.exit(1);
}

const css = readFileSync(source, 'utf8');
appendFileSync(target, '\n/* --- bundled SFC styles --- */\n' + css);
unlinkSync(source);

console.log(`merge-sfc-styles: appended ${css.length} bytes from ${source} → ${target}`);
