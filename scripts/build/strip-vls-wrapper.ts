/**
 * strip-vls-wrapper.ts (shared, package-aware)
 *
 * Run from a package directory, after `tsdown`/`vue-tsc` emit. Removes the
 * `__VLS_WithSlots` wrappers `@vue/language-tools` bakes around SFC defaults
 * that call `defineSlots()`. The `T & { new (): { $slots: S } }` intersection
 * breaks `InstanceType<typeof Comp>` and Cmd+Click in consumer templates.
 *
 * Rewrites `__VLS_export$N: __VLS_WithSlots$N<typeof __VLS_base$N, …>` to
 * `__VLS_export$N: typeof __VLS_base$N` and drops the alias. Uses `magic-string`
 * + `@ampproject/remapping` to keep the `.d.ts.map` → `.vue` mapping intact so
 * navigation still lands on the right line.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import MagicString from 'magic-string';
import remapping, { type EncodedSourceMap } from '@ampproject/remapping';

const pkgRoot = process.cwd();
const distDir = path.join(pkgRoot, 'dist');

const DTS_EXT = /\.d\.c?ts$/;

const EXPORT_RE =
  /declare const __VLS_export(\$\d+)?: __VLS_WithSlots(\$\d+)?<typeof __VLS_base(\$\d+)?, __VLS_Slots(\$\d+)?>;/g;

const ALIAS_DEFAULT_RE =
  /\s*type __VLS_WithSlots(\$\d+)?<T, S> = T & \{\s*new \(\): \{\s*\$slots: S;\s*\};\s*\};/g;

const ALIAS_PREV_RE =
  /\s*type __VLS_WithSlots(\$\d+)?<T, S> = T & \(new \(\) => \(T extends new \(\.\.\.args: any\) => infer R \? R : \{\}\) & \{ \$slots: S \}\);/g;

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
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && DTS_EXT.test(full)) out.push(full);
  }
  return out;
}

function applyStrip(
  content: string,
  fileBasename: string
): { code: string; map: EncodedSourceMap } | null {
  const s = new MagicString(content);
  let changed = false;

  for (const m of content.matchAll(EXPORT_RE)) {
    const exportSfx = m[1] ?? '';
    const baseSfx = m[3] ?? '';
    s.overwrite(
      m.index!,
      m.index! + m[0].length,
      `declare const __VLS_export${exportSfx}: typeof __VLS_base${baseSfx};`
    );
    changed = true;
  }
  for (const m of content.matchAll(ALIAS_DEFAULT_RE)) {
    s.remove(m.index!, m.index! + m[0].length);
    changed = true;
  }
  for (const m of content.matchAll(ALIAS_PREV_RE)) {
    s.remove(m.index!, m.index! + m[0].length);
    changed = true;
  }

  if (!changed) return null;

  const code = s.toString();
  const map = s.generateMap({
    source: fileBasename,
    file: fileBasename,
    includeContent: false,
    hires: true,
  }) as unknown as EncodedSourceMap;

  return { code, map };
}

function composeMaps(
  editMap: EncodedSourceMap,
  originalMap: EncodedSourceMap | null,
  fileBasename: string
): EncodedSourceMap {
  if (!originalMap) return editMap;
  return remapping(editMap, (file: string) =>
    file === fileBasename ? originalMap : null
  ) as EncodedSourceMap;
}

async function readMapIfExists(mapPath: string): Promise<EncodedSourceMap | null> {
  try {
    return JSON.parse(await fs.readFile(mapPath, 'utf8')) as EncodedSourceMap;
  } catch {
    return null;
  }
}

async function processFile(file: string): Promise<{ stripped: boolean; leftover: boolean }> {
  const content = await fs.readFile(file, 'utf8');
  const result = applyStrip(content, path.basename(file));
  if (!result) return { stripped: false, leftover: content.includes('__VLS_WithSlots') };

  const mapPath = file + '.map';
  const originalMap = await readMapIfExists(mapPath);
  const finalMap = composeMaps(result.map, originalMap, path.basename(file));

  await fs.writeFile(file, result.code, 'utf8');
  if (originalMap) await fs.writeFile(mapPath, JSON.stringify(finalMap), 'utf8');

  return { stripped: true, leftover: result.code.includes('__VLS_WithSlots') };
}

async function main(): Promise<void> {
  const files = await walk(distDir);
  if (files.length === 0)
    throw new Error(`strip-vls-wrapper: no .d.ts files in ${distDir}. Did tsdown run?`);

  let touched = 0;
  let remaining = 0;
  for (const file of files) {
    const { stripped, leftover } = await processFile(file);
    if (stripped) touched++;
    if (leftover) {
      remaining++;
      console.error(
        `strip-vls-wrapper: ${path.relative(pkgRoot, file)} still contains __VLS_WithSlots`
      );
    }
  }

  console.log(`strip-vls-wrapper: scanned ${files.length} files — stripped ${touched}`);
  if (remaining > 0) {
    throw new Error(
      `strip-vls-wrapper: ${remaining} file(s) still contain __VLS_WithSlots. The regex needs updating.`
    );
  }
}

main().catch((err: unknown) => {
  console.error('strip-vls-wrapper failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
