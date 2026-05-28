/**
 * merge-sfc-styles.mjs
 *
 * Runs after `tailwindcss` has produced `dist/assets/styles.css` (the design tokens +
 * utility-class output) AND after `tsdown` has produced `dist/style.css` (the bundled
 * CSS from SFC `<style>` / `<style scoped>` blocks — currently only used by the
 * tell-input entry's BEM-named scoped styles).
 *
 * We concatenate the SFC styles into the single shipped stylesheet so consumers'
 * existing `import '@alikhalilll/ui/styles.css'` continues to be the only CSS import
 * they need. The intermediate `dist/style.css` is then removed.
 */
import { existsSync, readFileSync, appendFileSync, unlinkSync } from 'node:fs';

const target = 'dist/assets/styles.css';
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
