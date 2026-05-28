/**
 * generate-entry-dts.ts
 *
 * Writes the top-level entry `.d.ts` files that consumers reach via the
 * `package.json#exports` map. Each is a one-line stub that re-exports
 * everything from the matching mirror location under `dist/runtime/`.
 *
 *   dist/tell-input/index.d.ts
 *     → `export * from '../runtime/entries/tell-input/index.js';`
 *
 * The stub is intentionally trivial — every prop / emit / slot type lives in
 * the per-component `.vue.d.ts` files under `runtime/`, alongside the actual
 * `.vue` source (shipped by `copy-sources.ts`). Volar resolves the stub's
 * single re-export, walks into the per-source declarations, and via the
 * `.d.ts.map` jumps to the SFC source for go-to-definition.
 *
 * Also emits matching `.d.cts` files so the `require` condition in
 * package.json's exports map works the same way for CJS consumers.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const distDir = path.join(pkgRoot, 'dist');

interface EntryDef {
  /** Output path under `dist/`, relative — e.g. `tell-input/index.d.ts`. */
  out: string;
  /** Module specifier that re-exports the entry — e.g. `../runtime/entries/tell-input/index.js`. */
  target: string;
  /** Whether the entry has a default export (Nuxt module, etc.) that also needs re-exporting. */
  withDefault: boolean;
}

const ENTRIES: EntryDef[] = [
  { out: 'index.d.ts', target: './runtime/index.js', withDefault: false },
  {
    out: 'tell-input/index.d.ts',
    target: '../runtime/entries/tell-input/index.js',
    withDefault: false,
  },
  { out: 'input/index.d.ts', target: '../runtime/entries/input/index.js', withDefault: false },
  { out: 'popover/index.d.ts', target: '../runtime/entries/popover/index.js', withDefault: false },
  { out: 'drawer/index.d.ts', target: '../runtime/entries/drawer/index.js', withDefault: false },
  {
    out: 'responsive-popover/index.d.ts',
    target: '../runtime/entries/responsive-popover/index.js',
    withDefault: false,
  },
  { out: 'utils/index.d.ts', target: '../runtime/utils/index.js', withDefault: false },
  { out: 'nuxt/index.d.ts', target: '../runtime/nuxt/index.js', withDefault: true },
  { out: 'resolver/index.d.ts', target: '../runtime/resolver/index.js', withDefault: true },
];

function lines(target: string, withDefault: boolean): string[] {
  const out = [`export * from '${target}';`];
  if (withDefault) out.push(`export { default } from '${target}';`);
  return out;
}

async function main(): Promise<void> {
  let written = 0;
  for (const entry of ENTRIES) {
    const absDts = path.join(distDir, entry.out);
    const absDcts = absDts.replace(/\.d\.ts$/, '.d.cts');
    await fs.mkdir(path.dirname(absDts), { recursive: true });
    const content = lines(entry.target, entry.withDefault).join('\n') + '\n';
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
