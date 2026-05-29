/**
 * verify-go-to-def.ts (shared, package-aware)
 *
 * Run from a package directory, after build. Guards the
 * "Cannot find declaration to go to" regression: a module specifier ending in a
 * literal `.d.ts` (e.g. `from './x.vue.d.ts'`) resolves the *type* but yields no
 * navigable declaration in Volar. The correct forms are a `.js` specifier (TS
 * maps it to the `.d.ts` + declaration map) or extensionless. Fail the build if
 * any emitted declaration uses the broken form.
 */

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const SPEC_RE = /(?:from\s*|import\(\s*)['"]([^'"]+\.d\.ts)['"]/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.d\.c?ts$/.test(e.name)) out.push(full);
  }
  return out;
}

const offenders: string[] = [];
for (const file of walk(distDir)) {
  for (const m of fs.readFileSync(file, 'utf8').matchAll(SPEC_RE)) {
    offenders.push(`${path.relative(process.cwd(), file)} → ${m[1]}`);
  }
}

if (offenders.length) {
  console.error(
    `verify-go-to-def: ${offenders.length} specifier(s) end in a literal .d.ts ` +
      `(breaks Volar go-to-definition — use a .js specifier):\n  - ${offenders.join('\n  - ')}`
  );
  process.exit(1);
}

console.log('verify-go-to-def: ok — no literal .d.ts specifiers in emitted declarations.');
