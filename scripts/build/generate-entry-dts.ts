/**
 * generate-entry-dts.ts (shared, package-aware)
 *
 * Run from a package directory. Writes the top-level entry `.d.ts` / `.d.cts`
 * stubs that consumers reach via `package.json#exports`. Each is a one-line
 * re-export of the matching mirror location under `dist/runtime/` — Volar
 * resolves the stub, walks into the per-source `.vue.d.ts`, and via the
 * `.d.ts.map` jumps to the SFC source for go-to-definition.
 *
 * Entries are derived by convention from the package layout:
 *   - root `index.ts`        → dist/index.d.ts        → ./runtime/index.js
 *   - `nuxt/index.ts`        → dist/nuxt/index.d.ts   → ../runtime/nuxt/index.js (+default)
 *   - `resolver/index.ts`    → dist/resolver/index.d.ts → ../runtime/resolver/index.js (+default)
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const pkgRoot = process.cwd();
const distDir = path.join(pkgRoot, 'dist');

interface EntryDef {
  out: string;
  target: string;
  withDefault: boolean;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function lines(target: string, withDefault: boolean): string {
  const out = [`export * from '${target}';`];
  if (withDefault) out.push(`export { default } from '${target}';`);
  return out.join('\n') + '\n';
}

async function main(): Promise<void> {
  const entries: EntryDef[] = [
    { out: 'index.d.ts', target: './runtime/index.js', withDefault: false },
  ];
  if (await exists(path.join(pkgRoot, 'nuxt/index.ts'))) {
    entries.push({ out: 'nuxt/index.d.ts', target: '../runtime/nuxt/index.js', withDefault: true });
  }
  if (await exists(path.join(pkgRoot, 'resolver/index.ts'))) {
    entries.push({
      out: 'resolver/index.d.ts',
      target: '../runtime/resolver/index.js',
      withDefault: true,
    });
  }

  let written = 0;
  for (const entry of entries) {
    const absDts = path.join(distDir, entry.out);
    const absDcts = absDts.replace(/\.d\.ts$/, '.d.cts');
    await fs.mkdir(path.dirname(absDts), { recursive: true });
    const content = lines(entry.target, entry.withDefault);
    await fs.writeFile(absDts, content, 'utf8');
    await fs.writeFile(absDcts, content, 'utf8');
    written += 2;
  }
  console.log(`generate-entry-dts: wrote ${written} entry stubs (.d.ts + .d.cts).`);
}

main().catch((err: unknown) => {
  console.error(
    'generate-entry-dts failed:',
    err instanceof Error ? (err.stack ?? err.message) : String(err)
  );
  process.exit(1);
});
