/**
 * verify-go-to-def.ts (shared, package-aware)
 *
 * Run from a package directory, after build. Guards two historic regressions:
 *
 *  1. Specifiers ending in literal `.d.ts` (e.g. `from './x.vue.d.ts'`) resolve
 *     the *type* but yield no navigable declaration in Volar — "Cannot find
 *     declaration to go to". The correct shapes are a `.js`/`.cjs` specifier
 *     (TS maps it to the `.d.ts` + declaration map) or extensionless.
 *
 *  2. Specifiers containing `.vue` (e.g. `from './x.vue'` or `from './x.vue.js'`)
 *     route through Volar's SFC virtual-file resolution. When the build emits
 *     rolled-up dts (no per-component `*.vue.d.ts` left in dist), there is no
 *     SFC to resolve to — the consumer collapses the import to `any` (no
 *     autocomplete, no go-to-def). Components are inlined as `DefineComponent`
 *     in the rolled-up barrel; no `.vue`-tokened specifier should survive.
 *
 * Fail the build if any emitted declaration uses either broken form.
 */

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const SPEC_RE = /(?:from\s*|import\(\s*)['"]([^'"]+)['"]/g;

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

const dtsSuffixOffenders: string[] = [];
const vueTokenOffenders: string[] = [];

for (const file of walk(distDir)) {
  const rel = path.relative(process.cwd(), file);
  for (const m of fs.readFileSync(file, 'utf8').matchAll(SPEC_RE)) {
    const spec = m[1];
    if (spec.endsWith('.d.ts') || spec.endsWith('.d.cts')) {
      dtsSuffixOffenders.push(`${rel} → ${spec}`);
    } else if (spec.includes('.vue')) {
      vueTokenOffenders.push(`${rel} → ${spec}`);
    }
  }
}

const errors: string[] = [];
if (dtsSuffixOffenders.length) {
  errors.push(
    `${dtsSuffixOffenders.length} specifier(s) end in a literal .d.ts ` +
      `(breaks Volar go-to-definition — use a .js specifier):\n  - ` +
      dtsSuffixOffenders.join('\n  - ')
  );
}
if (vueTokenOffenders.length) {
  errors.push(
    `${vueTokenOffenders.length} specifier(s) contain a .vue token ` +
      `(routes through Volar's SFC resolution; consumer collapses to \`any\`):\n  - ` +
      vueTokenOffenders.join('\n  - ')
  );
}

if (errors.length) {
  console.error('verify-go-to-def:\n' + errors.join('\n\n'));
  process.exit(1);
}

console.log(
  'verify-go-to-def: ok — no literal .d.ts specifiers and no .vue tokens in emitted declarations.'
);
