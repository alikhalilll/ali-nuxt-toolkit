/**
 * copy-sources.ts
 *
 * Copies every `.vue` source file from the workspace's `entries/`, `utils/`,
 * `nuxt/`, `resolver/` source roots into `dist/runtime/` at the matching
 * mirror path, so the per-component `.d.ts.map` files emitted by `vue-tsc`
 * resolve to a real on-disk source.
 *
 * Why ship the raw `.vue` in dist?
 * --------------------------------
 * Without the source file alongside the declaration:
 *   - Cmd+Click in a consumer's IDE on `<ATellInput>` lands on the `.d.ts`
 *     (or, with no map, on the entry barrel), not on the actual SFC.
 *   - "Peek definition" / "Go to type definition" stops one level short.
 * Shipping the `.vue` makes the declaration map's `sources` reference resolve,
 * so the IDE walks directly to `ATellInput.vue` line N. This matches the
 * pattern shadcn-vue / Nuxt-module libraries ship.
 *
 * Only `.vue` source files are copied; the corresponding `.ts` source files
 * are emitted by `vue-tsc` directly because `tsconfig.dist.json` includes them
 * (vue-tsc copies non-emit `.ts` inputs that are referenced from elsewhere).
 * For `.vue` files vue-tsc only emits the companion `.d.ts` — the SFC itself
 * isn't copied, so we do it here.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const runtimeDir = path.join(pkgRoot, 'dist', 'runtime');

const SOURCE_ROOTS = ['entries', 'utils', 'nuxt', 'resolver'];

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      out.push(full);
    }
  }
  return out;
}

async function main(): Promise<void> {
  let copied = 0;
  for (const sourceRoot of SOURCE_ROOTS) {
    const sourceDir = path.join(pkgRoot, sourceRoot);
    const vueFiles = await walk(sourceDir);
    for (const src of vueFiles) {
      const rel = path.relative(pkgRoot, src);
      const dest = path.join(runtimeDir, rel);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      copied++;
    }
  }
  console.log(`copy-sources: copied ${copied} .vue source file(s) into dist/runtime/.`);
}

main().catch((err: unknown) => {
  console.error(
    'copy-sources failed:',
    err instanceof Error ? (err.stack ?? err.message) : String(err)
  );
  process.exit(1);
});
