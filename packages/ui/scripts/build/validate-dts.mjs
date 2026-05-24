/**
 * validate-dts.mjs
 *
 * Post-fix gate. Runs after `fix-dts-imports.mjs` and asserts the dist
 * .d.ts tree is consumer-clean:
 *   - no remaining `@/` specifier
 *   - no bare `from '..'` or `from '.'`
 *   - no absolute filesystem paths or `/src/` leaks
 *   - every relative specifier resolves on disk under standard TS resolution
 *     (`<spec>.d.ts` or `<spec>/index.d.ts`)
 *
 * Fails the build with the first violation.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const distDir = path.join(pkgRoot, 'dist');

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && full.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function resolvesAsModule(absSpecifier) {
  // Try the spec as a file with .d.ts, then as a directory with /index.d.ts.
  if (await exists(absSpecifier + '.d.ts')) return true;
  if (await exists(path.join(absSpecifier, 'index.d.ts'))) return true;
  if (await exists(absSpecifier)) return true; // file already has extension (rare)
  return false;
}

function fail(filePath, msg) {
  const rel = path.relative(pkgRoot, filePath);
  console.error(`validate-dts: ${rel}: ${msg}`);
  process.exit(1);
}

async function main() {
  const files = await walk(distDir);
  if (files.length === 0) {
    console.error(`validate-dts: no .d.ts files in ${distDir}`);
    process.exit(1);
  }

  const specRe = /(?:from\s+|import\(\s*)(['"])([^'"]+)\1/g;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');

    if (content.includes(pkgRoot) && !content.includes(distDir)) {
      fail(file, 'leaks absolute path');
    }
    if (content.includes('/src/') || content.includes('\\src\\')) {
      fail(file, 'leaks /src/ path');
    }

    const fileDir = path.dirname(file);
    let m;
    while ((m = specRe.exec(content)) !== null) {
      const spec = m[2];

      if (spec.startsWith('@/')) {
        fail(file, `unrewritten alias specifier: '${spec}'`);
      }
      if (spec === '.' || spec === '..') {
        fail(file, `bare relative specifier: '${spec}'`);
      }

      if (spec.startsWith('./') || spec.startsWith('../')) {
        const target = path.resolve(fileDir, spec);
        const ok = await resolvesAsModule(target);
        if (!ok) fail(file, `unresolvable relative specifier: '${spec}'`);
      }
      // Bare specifiers (e.g. 'vue', 'lucide-vue-next') are skipped — they're
      // externals, resolved at the consumer's node_modules.
    }
  }

  console.log(`validate-dts: ok — ${files.length} files validated`);
}

main().catch((err) => {
  console.error('validate-dts failed:', err.message);
  process.exit(1);
});
